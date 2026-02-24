/**
 * Base path for static assets & routing.
 * Matches the `basePath` in next.config.ts.
 * In production (GitHub Pages) the app is served under /climprotocol.
 */
export const BASE_PATH =
  process.env.NODE_ENV === 'production' ? '/climprotocol' : '';
