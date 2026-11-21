import jsPDF from 'jspdf';
import type { ResumeDocument } from '@/types/resume';
import { withBase } from '@/lib/basePath';

/**
 * Vector PDF: instead of taking a screenshot of the resume, this reads the laid-out DOM (positions, fonts,
 * colours) and redraws it with real, selectable text, so the PDF can be searched, copied and parsed by
 * applicant-tracking systems. Fonts are the same files the page uses ("ResumeSans" / "ResumeSerif").
 */

type FaceKey = 'sans400' | 'sans600' | 'sans700' | 'serif400' | 'serif700';

const FACES: Record<FaceKey, { file: string; id: string; descent: number }> = {
  sans400: { file: '/fonts/Inter-Regular.ttf', id: 'ResumeSans-400', descent: 0.2412 },
  sans600: { file: '/fonts/Inter-SemiBold.ttf', id: 'ResumeSans-600', descent: 0.2412 },
  sans700: { file: '/fonts/Inter-Bold.ttf', id: 'ResumeSans-700', descent: 0.2412 },
  serif400: { file: '/fonts/PTSerif-Regular.ttf', id: 'ResumeSerif-400', descent: 0.286 },
  serif700: { file: '/fonts/PTSerif-Bold.ttf', id: 'ResumeSerif-700', descent: 0.286 },
};

const fontCache = new Map<FaceKey, Promise<string>>();

function loadFontBase64(key: FaceKey): Promise<string> {
  let cached = fontCache.get(key);
  if (!cached) {
    cached = fetch(withBase(FACES[key].file))
      .then((res) => {
        if (!res.ok) throw new Error(`Не удалось загрузить шрифт ${FACES[key].file}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
        }
        return btoa(binary);
      });
    fontCache.set(key, cached);
    cached.catch(() => fontCache.delete(key)); // allow a retry after a network failure
  }
  return cached;
}

/* ------------------------------ colours ------------------------------ */

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseColor(value: string): Rgba | null {
  if (!value || value === 'transparent') return null;
  const rgb = value.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
  }
  const srgb = value.match(/^color\(srgb ([^)]+)\)$/);
  if (srgb) {
    const parts = srgb[1].split(/[\s/]+/).filter(Boolean).map(parseFloat);
    if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
    return { r: parts[0] * 255, g: parts[1] * 255, b: parts[2] * 255, a: parts[3] ?? 1 };
  }
  return null;
}

/* ------------------------------ drawing ops ------------------------------ */

interface RectOp {
  kind: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  color: Rgba;
  radius: number;
}

interface TextOp {
  kind: 'text';
  x: number;
  top: number;
  bottom: number;
  width: number;
  str: string;
  face: FaceKey;
  fontPx: number;
  color: Rgba;
  letterSpacingPx: number;
  href?: string;
}

interface ImageOp {
  kind: 'image';
  x: number;
  y: number;
  w: number;
  h: number;
  dataUrl: string;
  opacity: number;
}

type Op = RectOp | TextOp | ImageOp;

function pickFace(cs: CSSStyleDeclaration): FaceKey {
  const weight = parseInt(cs.fontWeight, 10) || 400;
  if (/serif/i.test(cs.fontFamily) && /ResumeSerif|PT Serif/i.test(cs.fontFamily)) {
    return weight >= 600 ? 'serif700' : 'serif400';
  }
  if (weight >= 700) return 'sans700';
  if (weight >= 600) return 'sans600';
  return 'sans400';
}

/** object-fit: cover, baked into a canvas (jsPDF can't crop). */
function coverImage(img: HTMLImageElement, w: number, h: number): string | null {
  if (!img.complete || !img.naturalWidth) return null;
  const scale = 3;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const fit = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
  const dw = img.naturalWidth * fit;
  const dh = img.naturalHeight * fit;
  ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
  try {
    return canvas.toDataURL('image/jpeg', 0.92);
  } catch {
    return null; // tainted canvas (cross-origin image)
  }
}

function collectOps(root: HTMLElement): Op[] {
  const ops: Op[] = [];
  const rootRect = root.getBoundingClientRect();

  const addRect = (x: number, y: number, w: number, h: number, color: Rgba | null, opacity: number, radius = 0) => {
    if (!color || w <= 0 || h <= 0) return;
    const a = color.a * opacity;
    if (a <= 0.001) return;
    ops.push({ kind: 'rect', x, y, w, h, color: { ...color, a }, radius });
  };

  const walk = (el: Element, inheritedOpacity: number) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const opacity = inheritedOpacity * (parseFloat(cs.opacity) || 0);
    if (opacity <= 0.001) return;

    const r = el.getBoundingClientRect();
    const x = r.left - rootRect.left;
    const y = r.top - rootRect.top;

    // background + borders
    const radius = parseFloat(cs.borderTopLeftRadius) || 0;
    addRect(x, y, r.width, r.height, parseColor(cs.backgroundColor), opacity, radius);
    const bt = parseFloat(cs.borderTopWidth) || 0;
    const bb = parseFloat(cs.borderBottomWidth) || 0;
    const bl = parseFloat(cs.borderLeftWidth) || 0;
    const br = parseFloat(cs.borderRightWidth) || 0;
    if (bt && cs.borderTopStyle !== 'none') addRect(x, y, r.width, bt, parseColor(cs.borderTopColor), opacity);
    if (bb && cs.borderBottomStyle !== 'none')
      addRect(x, y + r.height - bb, r.width, bb, parseColor(cs.borderBottomColor), opacity);
    if (bl && cs.borderLeftStyle !== 'none') addRect(x, y, bl, r.height, parseColor(cs.borderLeftColor), opacity);
    if (br && cs.borderRightStyle !== 'none')
      addRect(x + r.width - br, y, br, r.height, parseColor(cs.borderRightColor), opacity);

    if (el instanceof HTMLImageElement) {
      const innerW = r.width - bl - br;
      const innerH = r.height - bt - bb;
      const dataUrl = coverImage(el, innerW, innerH);
      if (dataUrl) ops.push({ kind: 'image', x: x + bl, y: y + bt, w: innerW, h: innerH, dataUrl, opacity });
      return;
    }

    el.childNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        walk(node as Element, opacity);
      } else if (node.nodeType === Node.TEXT_NODE) {
        addTextNode(node as Text, el, cs, opacity);
      }
    });
  };

  const addTextNode = (node: Text, parent: Element, cs: CSSStyleDeclaration, opacity: number) => {
    const text = node.textContent ?? '';
    if (!text.trim()) return;
    const color = parseColor(cs.color);
    if (!color) return;
    const fontPx = parseFloat(cs.fontSize) || 12;
    const face = pickFace(cs);
    const letterSpacingPx = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing) || 0;
    const upper = cs.textTransform === 'uppercase';
    const href = (parent.closest('a') as HTMLAnchorElement | null)?.href;

    // 1. every word -> its on-screen rectangle(s)
    interface Seg {
      str: string;
      left: number;
      right: number;
      top: number;
      bottom: number;
    }
    const segs: Seg[] = [];
    const range = document.createRange();
    const pushRects = (str: string, start: number, end: number) => {
      range.setStart(node, start);
      range.setEnd(node, end);
      const rects = Array.from(range.getClientRects()).filter((rc) => rc.width > 0 && rc.height > 0);
      if (rects.length === 1) {
        const rc = rects[0];
        segs.push({ str, left: rc.left, right: rc.right, top: rc.top, bottom: rc.bottom });
      } else if (rects.length > 1) {
        // a long word broken across lines: measure it character by character
        let current: Seg | null = null;
        for (let i = start; i < end; i++) {
          range.setStart(node, i);
          range.setEnd(node, i + 1);
          const rc = range.getClientRects()[0];
          if (!rc || rc.width <= 0) continue;
          if (current && Math.abs(rc.top - current.top) < fontPx * 0.5) {
            current.str += text[i];
            current.right = rc.right;
          } else {
            if (current) segs.push(current);
            current = { str: text[i], left: rc.left, right: rc.right, top: rc.top, bottom: rc.bottom };
          }
        }
        if (current) segs.push(current);
      }
    };
    const wordRe = /\S+/g;
    let m: RegExpExecArray | null;
    while ((m = wordRe.exec(text))) pushRects(m[0], m.index, m.index + m[0].length);

    // 2. words on the same visual line -> one string, so extracted text keeps its spaces
    let line: Seg | null = null;
    const flush = () => {
      if (!line) return;
      ops.push({
        kind: 'text',
        x: line.left - rootRect.left,
        top: line.top - rootRect.top,
        bottom: line.bottom - rootRect.top,
        width: line.right - line.left,
        str: upper ? line.str.toUpperCase() : line.str,
        face,
        fontPx,
        color: { ...color, a: color.a * opacity },
        letterSpacingPx,
        href: href || undefined,
      });
      line = null;
    };
    for (const seg of segs) {
      if (line && Math.abs(seg.top - line.top) < fontPx * 0.5 && seg.left >= line.left) {
        line.str += ' ' + seg.str;
        line.right = Math.max(line.right, seg.right);
        line.top = Math.min(line.top, seg.top);
        line.bottom = Math.max(line.bottom, seg.bottom);
      } else {
        flush();
        line = { ...seg };
      }
    }
    flush();
  };

  walk(root, 1);
  return ops;
}

/* ------------------------------ pagination ------------------------------ */

/**
 * Page ends: as close to the page boundary as possible, never through a line of text or an image, and (when
 * possible) never leaving a bold heading/job title stranded at the bottom without the line that follows it.
 */
function planPages(ops: Op[], totalHeight: number, pagePx: number, rootWidth: number): number[] {
  const texts = ops.filter((o): o is TextOp => o.kind === 'text');
  const hard: [number, number][] = []; // must not be cut through
  for (const op of ops) {
    if (op.kind === 'text') hard.push([op.top, op.bottom]);
    else if (op.kind === 'image') hard.push([op.y, op.y + op.h]);
    else if (op.h <= 80 && op.w < rootWidth * 0.9) hard.push([op.y, op.y + op.h]); // chips, tags, accent bars
  }
  // "keep with next": a bold line plus the line right below it in the same column
  const soft: [number, number][] = [];
  for (const t of texts) {
    if (t.face === 'sans400' || t.face === 'serif400') continue;
    const next = texts
      .filter((n) => n.top >= t.bottom - 1 && n.top - t.bottom <= 36 && Math.abs(n.x - t.x) < 200)
      .sort((x, y) => x.top - y.top)[0];
    if (next) soft.push([t.top, next.top + 1]);
  }

  const inside = (list: [number, number][], y: number) => list.some(([top, bottom]) => y > top + 0.5 && y < bottom - 0.5);

  const starts = [0];
  while (true) {
    const start = starts[starts.length - 1];
    if (totalHeight - start <= pagePx + 0.5) break;
    const target = start + pagePx;
    const floor = start + pagePx * 0.55;
    let cut = target;
    // tier 1: respect lines and keep-with-next; tier 2: lines only; tier 3: hard cut
    while (cut > floor && (inside(hard, cut) || inside(soft, cut))) cut -= 1;
    if (cut <= floor) {
      cut = target;
      while (cut > floor && inside(hard, cut)) cut -= 1;
      if (cut <= floor) cut = target;
    }
    starts.push(cut);
  }
  return starts;
}

/* ------------------------------ main ------------------------------ */

export async function exportResumeToTextPDF(
  element: HTMLElement,
  resume: ResumeDocument,
  mode: 'pc' | 'mobile',
  onProgress?: (status: string) => void
) {
  const lastName = resume.personal.lastName || 'Resume';
  const firstName = resume.personal.firstName || 'Candidate';
  const fileName = `Resume_${lastName}_${firstName}_${mode === 'mobile' ? 'Mobile' : 'PC'}.pdf`;

  onProgress?.('Подготовка шрифтов...');
  if (document.fonts) {
    await Promise.all(
      ['400 14px ResumeSans', '600 14px ResumeSans', '700 14px ResumeSans', '400 14px ResumeSerif', '700 14px ResumeSerif'].map(
        (f) => document.fonts.load(f, 'Аa').catch(() => [])
      )
    );
    await document.fonts.ready;
  }

  const pageW = mode === 'pc' ? 210 : 108;
  const pageH = mode === 'pc' ? 297 : 234;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pageW, pageH], compress: true });

  // Embed only the faces this resume actually uses
  onProgress?.('Чтение макета...');
  const rootRect = element.getBoundingClientRect();
  if (!rootRect.width || !rootRect.height) throw new Error('Не удалось измерить резюме (пустой макет)');
  const ops = collectOps(element);
  const usedFaces = new Set<FaceKey>(ops.filter((o): o is TextOp => o.kind === 'text').map((o) => o.face));
  for (const key of usedFaces) {
    const base64 = await loadFontBase64(key);
    const { file, id } = FACES[key];
    const vfsName = file.split('/').pop() as string;
    pdf.addFileToVFS(vfsName, base64);
    pdf.addFont(vfsName, id, 'normal', undefined, 'Identity-H');
  }

  onProgress?.('Генерация PDF...');
  const mmPerPx = pageW / rootRect.width;
  const ptPerPx = (mmPerPx * 72) / 25.4;
  const totalHeight = rootRect.height;
  const starts = planPages(ops, totalHeight, pageH / mmPerPx, rootRect.width);

  const GState = (pdf as unknown as { GState: new (o: { opacity: number }) => unknown }).GState;
  const setOpacity = (a: number) =>
    (pdf as unknown as { setGState: (g: unknown) => void }).setGState(new GState({ opacity: Math.min(1, Math.max(0, a)) }));

  starts.forEach((start, pageIndex) => {
    const end = pageIndex + 1 < starts.length ? starts[pageIndex + 1] : totalHeight + 1;
    if (pageIndex > 0) pdf.addPage([pageW, pageH], 'portrait');

    for (const op of ops) {
      if (op.kind === 'rect') {
        const y0 = Math.max(op.y, start);
        const y1 = Math.min(op.y + op.h, end);
        if (y1 - y0 <= 0.01) continue;
        setOpacity(op.color.a);
        pdf.setFillColor(Math.round(op.color.r), Math.round(op.color.g), Math.round(op.color.b));
        const fullyInside = y0 === op.y && y1 === op.y + op.h;
        if (op.radius > 0 && fullyInside) {
          const r = Math.min(op.radius, op.w / 2, op.h / 2) * mmPerPx;
          pdf.roundedRect(op.x * mmPerPx, (y0 - start) * mmPerPx, op.w * mmPerPx, (y1 - y0) * mmPerPx, r, r, 'F');
        } else {
          pdf.rect(op.x * mmPerPx, (y0 - start) * mmPerPx, op.w * mmPerPx, (y1 - y0) * mmPerPx, 'F');
        }
      } else if (op.kind === 'image') {
        if (op.y < start - 0.5 || op.y >= end) continue;
        setOpacity(op.opacity);
        pdf.addImage(op.dataUrl, 'JPEG', op.x * mmPerPx, (op.y - start) * mmPerPx, op.w * mmPerPx, op.h * mmPerPx);
      } else {
        if (op.top < start - 0.5 || op.top >= end) continue;
        const { id, descent } = FACES[op.face];
        setOpacity(op.color.a);
        pdf.setFont(id, 'normal');
        pdf.setFontSize(op.fontPx * ptPerPx);
        pdf.setTextColor(Math.round(op.color.r), Math.round(op.color.g), Math.round(op.color.b));
        const baseline = op.bottom - descent * op.fontPx;
        pdf.text(op.str, op.x * mmPerPx, (baseline - start) * mmPerPx, {
          baseline: 'alphabetic',
          charSpace: op.letterSpacingPx * mmPerPx,
        });
        if (op.href) {
          pdf.link(op.x * mmPerPx, (op.top - start) * mmPerPx, op.width * mmPerPx, (op.bottom - op.top) * mmPerPx, {
            url: op.href,
          });
        }
      }
    }
    setOpacity(1);
  });

  pdf.setProperties({ title: `Резюме — ${firstName} ${lastName}`.trim() });
  pdf.save(fileName);
  onProgress?.('');
}
