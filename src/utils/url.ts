/**
 * Link for a portfolio URL typed by the user (or received in a transfer link).
 * - "github.com/me" has no scheme and would become a relative link: add https://
 * - only http(s) is allowed: "javascript:" / "data:" links are refused ("#"), they would run code on click.
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^[^\s/:]+:\d+/.test(trimmed)) return '#';
  return `https://${trimmed}`;
}
