import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { ResumeDocument } from '@/types/resume';

/** Row "busyness": how many colour edges a 1px row has. A gap between text lines has almost none. */
function rowEdges(ctx: CanvasRenderingContext2D, y: number, width: number): number {
  const { data } = ctx.getImageData(0, y, width, 1);
  let edges = 0;
  for (let x = 4; x < data.length; x += 4) {
    const diff =
      Math.abs(data[x] - data[x - 4]) + Math.abs(data[x + 1] - data[x - 3]) + Math.abs(data[x + 2] - data[x - 2]);
    if (diff > 40) edges++;
  }
  return edges;
}

/**
 * Picks where to end a page: the emptiest row within the last part of the page, so a line of text
 * (or a bullet) is never sliced in half. Falls back to the hard page boundary.
 */
function findCut(ctx: CanvasRenderingContext2D, target: number, pageHeight: number, width: number): number {
  const windowSize = Math.floor(pageHeight * 0.14);
  let bestY = target;
  let bestEdges = Infinity;
  for (let y = target; y > target - windowSize; y--) {
    const edges = rowEdges(ctx, y, width);
    if (edges < bestEdges) {
      bestEdges = edges;
      bestY = y;
    }
    if (edges <= 2) break; // clean gap found (only the sidebar border, if any)
  }
  return bestY;
}

export async function exportResumeToPDF(
  element: HTMLElement,
  resume: ResumeDocument,
  mode: 'pc' | 'mobile',
  onProgress?: (status: string) => void
) {
  const lastName = resume.personal.lastName || 'Resume';
  const firstName = resume.personal.firstName || 'Candidate';
  const suffix = mode === 'mobile' ? 'Mobile' : 'PC';
  const fileName = `Resume_${lastName}_${firstName}_${suffix}.pdf`;

  onProgress?.('Подготовка холста...');

  // Ensure fonts are ready before drawing
  if (document.fonts) {
    await document.fonts.ready;
  }

  try {
    onProgress?.('Отрисовка элементов...');

    const canvas = await html2canvas(element, {
      scale: 2, // 2x for sharp printing
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      windowWidth: mode === 'pc' ? 794 : 408,
    });

    if (!canvas.width || !canvas.height) {
      throw new Error('Не удалось отрисовать резюме (пустой холст)');
    }

    onProgress?.('Генерация PDF...');

    // A4 for print, 108×234 mm for phones
    const pageW = mode === 'pc' ? 210 : 108;
    const pageH = mode === 'pc' ? 297 : 234;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pageW, pageH] });

    const pxPerMm = canvas.width / pageW;
    const pageHeightPx = Math.round(pageH * pxPerMm);
    const srcCtx = canvas.getContext('2d', { willReadFrequently: true });
    if (!srcCtx) throw new Error('Canvas недоступен в этом браузере');

    let y = 0;
    let pageIndex = 0;
    while (canvas.height - y > 6) {
      const remaining = canvas.height - y;
      const end =
        remaining <= pageHeightPx ? canvas.height : findCut(srcCtx, y + pageHeightPx, pageHeightPx, canvas.width);
      const sliceH = end - y;

      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = sliceH;
      const sliceCtx = slice.getContext('2d');
      if (!sliceCtx) throw new Error('Canvas недоступен в этом браузере');
      sliceCtx.fillStyle = '#FFFFFF';
      sliceCtx.fillRect(0, 0, slice.width, slice.height);
      sliceCtx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

      if (pageIndex > 0) pdf.addPage([pageW, pageH], 'portrait');
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pageW, sliceH / pxPerMm);

      y = end;
      pageIndex++;
    }

    pdf.save(fileName);
  } finally {
    onProgress?.('');
  }
}
