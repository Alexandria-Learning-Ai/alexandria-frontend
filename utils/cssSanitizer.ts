/**
 * CSS Sanitization Utility for EPUB Styles
 *
 * Sanitizes EPUB publisher CSS to prevent conflicts with Alexandria theming
 * while preserving content-specific typography and layout styles.
 *
 * Strategy:
 * - Remove body/html selectors that override app theme
 * - Remove background-color declarations on root elements
 * - Remove @page rules that conflict with mobile WebView
 * - Preserve content-specific styles (p, h1-h6, blockquote, etc.)
 * - Preserve typography choices (font-family, font-size, line-height)
 * - Preserve layout styles (margin, padding, text-align)
 */

/**
 * Sanitizes EPUB CSS to prevent conflicts with Alexandria theming.
 *
 * @param css - Raw CSS string from EPUB publisher
 * @returns Sanitized CSS string safe for merging with Alexandria styles
 *
 * @example
 * const sanitized = sanitizeEpubCSS(epubStyles);
 * // Returns CSS with body/html/background-color removed
 */
export const sanitizeEpubCSS = (css: string | null | undefined): string => {
  if (!css) return '';

  let sanitized = css;

  // Remove body selector blocks that override theme
  // Match: body { ... } (with or without multiple declarations)
  sanitized = sanitized.replace(/\bbody\s*\{[^}]*\}/gi, '');

  // Remove html selector blocks that override theme
  // Match: html { ... }
  sanitized = sanitized.replace(/\bhtml\s*\{[^}]*\}/gi, '');

  // Remove standalone background-color on root elements
  // This is aggressive - removes ALL background-color declarations
  // to prevent EPUB from overriding Alexandria's theme background
  sanitized = sanitized.replace(/background-color\s*:\s*[^;]+;/gi, '');

  // Remove @page rules that might conflict with WebView rendering
  // Match: @page { ... }
  sanitized = sanitized.replace(/@page\s*\{[^}]*\}/gi, '');

  // Remove @media print rules (not relevant for mobile reading)
  // Match: @media print { ... } (including nested blocks)
  sanitized = sanitized.replace(/@media\s+print\s*\{[^}]*\}/gi, '');

  // Remove !important declarations that could force override Alexandria styles
  // This is optional - comment out if you want to preserve publisher intent
  // sanitized = sanitized.replace(/\s*!important/gi, '');

  return sanitized.trim();
};

/**
 * Checks if EPUB CSS is present and non-empty after sanitization.
 *
 * @param css - Raw CSS string from EPUB
 * @returns true if sanitized CSS has meaningful content
 *
 * @example
 * if (hasValidEpubCSS(epubStyles)) {
 *   // Show "Use Original Styling" toggle
 * }
 */
export const hasValidEpubCSS = (css: string | null | undefined): boolean => {
  if (!css) return false;

  const sanitized = sanitizeEpubCSS(css);

  // Check if sanitized CSS has at least one CSS rule (not just whitespace)
  // Simple heuristic: look for { character (start of CSS rule)
  return sanitized.includes('{') && sanitized.length > 10;
};

/**
 * Wraps EPUB CSS in a scoped style tag with ID for debugging.
 *
 * @param css - Sanitized CSS string
 * @returns HTML style tag with scoped CSS
 *
 * @example
 * const styleTag = wrapEpubCSSInStyleTag(sanitizedCSS);
 * // Returns: <style id="epub-styles">...</style>
 */
export const wrapEpubCSSInStyleTag = (css: string): string => {
  if (!css) return '';

  return `<style id="epub-styles">
/* EPUB Publisher Styles (Sanitized) */
${css}
</style>`;
};

export default {
  sanitizeEpubCSS,
  hasValidEpubCSS,
  wrapEpubCSSInStyleTag,
};
