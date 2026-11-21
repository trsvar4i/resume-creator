import type { ResumeDocument, ExperienceItem, EducationItem } from '@/types/resume';
import { BASE_PATH } from '@/lib/basePath';

/**
 * Moving a résumé between devices without any server: the data is packed into the part of a link after "#".
 * Browsers never send that part over the network, so nothing leaves the two devices.
 *
 *   #r1.<base64url(deflate-raw(json))>   compressed (all modern browsers)
 *   #r0.<base64url(json)>                plain (fallback when CompressionStream is missing)
 *
 * The photo is not included (it would make the link far too long).
 */

const MAX_HASH_CHARS = 120_000;
const MAX_JSON_BYTES = 400_000;

/* ------------------------------ base64url ------------------------------ */

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/* ------------------------------ compression ------------------------------ */

const canCompress = () => typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream, limit?: number) {
  const writer = stream.writable.getWriter();
  void writer.write(bytes as BufferSource).then(() => writer.close()).catch(() => {});
  const reader = stream.readable.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (limit && total > limit) {
      await reader.cancel();
      throw new Error('too large');
    }
    parts.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/* ------------------------------ encode ------------------------------ */

export interface TransferLink {
  url: string;
  /** link length in characters */
  length: number;
  compressed: boolean;
}

export async function encodeResumeLink(resume: ResumeDocument, origin: string): Promise<TransferLink> {
  // Without id/updatedAt (regenerated on import) and without the photo
  const { id: _id, updatedAt: _updatedAt, ...rest } = resume;
  void _id;
  void _updatedAt;
  const { photoUrl: _photo, ...personal } = rest.personal;
  void _photo;
  const json = JSON.stringify({ ...rest, personal });
  const bytes = new TextEncoder().encode(json);

  let payload: string;
  let compressed = false;
  if (canCompress()) {
    payload = 'r1.' + toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')));
    compressed = true;
  } else {
    payload = 'r0.' + toBase64Url(bytes);
  }
  // The static export serves pages as folders (…/builder/), so the link points at the folder form
  const slash = process.env.NEXT_PUBLIC_STATIC_EXPORT === '1' ? '/' : '';
  const url = `${origin}${BASE_PATH}/builder${slash}#${payload}`;
  return { url, length: url.length, compressed };
}

/* ------------------------------ decode + validation ------------------------------ */

const str = (v: unknown, max = 2000): string => (typeof v === 'string' ? v.slice(0, max) : '');
const optStr = (v: unknown, max = 2000): string | undefined => {
  const s = str(v, max).trim();
  return s ? s : undefined;
};
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;
const strArray = (v: unknown, maxItems: number, maxLen = 500): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').slice(0, maxItems).map((x) => x.slice(0, maxLen)) : [];
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Only http(s) links may come in from a transfer link ("javascript:" etc. would run on click). */
function safeUrl(v: unknown): string | undefined {
  const s = optStr(v, 300);
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return undefined;
  return s;
}

/**
 * Builds a résumé from untrusted data field by field (never spreading the input), so a doctored link can't
 * smuggle in unexpected shapes, oversized lists or non-text values.
 */
export function normalizeImportedResume(raw: unknown): Omit<ResumeDocument, 'id' | 'updatedAt'> | null {
  if (!isObj(raw) || !isObj(raw.personal)) return null;
  const p = raw.personal;
  const c = isObj(p.contacts) ? p.contacts : {};

  const experience: ExperienceItem[] = (Array.isArray(raw.experience) ? raw.experience : [])
    .filter(isObj)
    .slice(0, 20)
    .map((e, i) => ({
      id: `imp-exp-${i}-${Math.random().toString(36).slice(2, 8)}`,
      company: str(e.company, 200),
      position: str(e.position, 200),
      startDate: str(e.startDate, 20),
      endDate: optStr(e.endDate, 20),
      isCurrent: e.isCurrent === true,
      rawDescription: str(e.rawDescription, 4000),
      aiBullets: strArray(e.aiBullets, 20, 600),
      bulletsSynced: e.bulletsSynced === true ? true : undefined,
    }));

  const education: EducationItem[] = (Array.isArray(raw.education) ? raw.education : [])
    .filter(isObj)
    .slice(0, 10)
    .map((e, i) => ({
      id: `imp-edu-${i}-${Math.random().toString(36).slice(2, 8)}`,
      institution: str(e.institution, 200),
      faculty: str(e.faculty, 200),
      level: oneOf(e.level, ['higher', 'secondary', 'courses'] as const, 'higher'),
      graduationYear: typeof e.graduationYear === 'number' && Number.isFinite(e.graduationYear) ? Math.trunc(e.graduationYear) : 0,
    }));

  const ai = isObj(raw.aiContent) ? raw.aiContent : {};
  const ap = isObj(raw.appearance) ? raw.appearance : {};

  return {
    personal: {
      lastName: str(p.lastName, 100),
      firstName: str(p.firstName, 100),
      middleName: optStr(p.middleName, 100),
      birthDate: optStr(p.birthDate, 10),
      showAge: p.showAge === true,
      showPhoto: p.showPhoto !== false,
      targetPosition: str(p.targetPosition, 200),
      contacts: {
        phone: optStr(c.phone, 40),
        email: optStr(c.email, 200),
        telegram: optStr(c.telegram, 40),
        whatsapp: optStr(c.whatsapp, 40),
        portfolioUrl: safeUrl(c.portfolioUrl),
        city: optStr(c.city, 100),
      },
    },
    hasNoExperience: raw.hasNoExperience === true,
    experience,
    education,
    skills: strArray(raw.skills, 60, 100),
    aiContent: {
      summary: str(ai.summary, 4000),
      highlights: strArray(ai.highlights, 20, 600),
      tone: oneOf(ai.tone, ['formal', 'dynamic', 'concise'] as const, 'dynamic'),
    },
    appearance: {
      templateId: oneOf(ap.templateId, ['classic', 'modern', 'minimal'] as const, 'modern'),
      themeId: oneOf(ap.themeId, ['graphite', 'navy', 'emerald', 'burgundy', 'indigo', 'olive'] as const, 'navy'),
      density: oneOf(ap.density, ['standard', 'compact'] as const, 'standard'),
    },
  };
}

/** Reads a "#r1.…" / "#r0.…" hash. Returns null if it isn't a transfer link or is damaged. */
export async function decodeResumeHash(hash: string) {
  const match = hash.match(/^#(r[01])\.([A-Za-z0-9_-]+)$/);
  if (!match || hash.length > MAX_HASH_CHARS) return null;
  try {
    const bytes = fromBase64Url(match[2]);
    const jsonBytes =
      match[1] === 'r1'
        ? canCompress()
          ? await pipe(bytes, new DecompressionStream('deflate-raw'), MAX_JSON_BYTES)
          : null
        : bytes;
    if (!jsonBytes || jsonBytes.length > MAX_JSON_BYTES) return null;
    return normalizeImportedResume(JSON.parse(new TextDecoder().decode(jsonBytes)));
  } catch {
    return null;
  }
}

/** True when the URL hash looks like a transfer link (even a broken one), so the app can say so. */
export const isTransferHash = (hash: string) => /^#r[01]\./.test(hash);
