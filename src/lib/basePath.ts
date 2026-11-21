/**
 * Sub-path the site is served from (GitHub Pages project sites live under /<repo-name>).
 * Set at build time through NEXT_PUBLIC_BASE_PATH, empty for local development.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Prefix an absolute path ("/fonts/x.ttf", "/api/...") with the base path. */
export const withBase = (path: string) => `${BASE_PATH}${path}`;
