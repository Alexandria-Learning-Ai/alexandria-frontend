/**
 * Apple Books-Inspired HTML Content Wrapper (Enhanced Version with EPUB CSS Merging)
 *
 * This function wraps raw HTML fragments with a complete HTML document structure
 * featuring Apple Books-style typography and styling, with optional EPUB CSS merging.
 *
 * Key Features:
 * - Georgia serif font family with dynamic sizing
 * - First-line indents (24px) for body paragraphs
 * - Centered, uppercase chapter headings
 * - Gold-bordered blockquotes with subtle background
 * - Justified text with automatic hyphenation
 * - Dynamic theme colors (text and background)
 * - Compatible with EPUB class names (x04-Body-Text, x01-Chapter-Title, etc.)
 * - Optional EPUB CSS merging with user preference toggle
 * - CSS sanitization to prevent theme conflicts
 *
 * Input: Raw HTML fragment (no <html>, <head>, or <body> tags)
 * Output: Complete HTML document with embedded CSS for WebView rendering
 */

import { Colors } from '../constants/Colors';
import { sanitizeEpubCSS } from '../utils/cssSanitizer';

type FontSize = 'small' | 'medium' | 'large';

const FONT_SIZE_MAP: Record<FontSize, number> = {
  small: 14,
  medium: 16,
  large: 18,
};

/**
 * Wraps HTML content with Apple Books-style CSS and optional EPUB styles
 *
 * @param html - Raw HTML content fragment
 * @param fontSize - Font size setting (small, medium, large)
 * @param themeColors - Theme colors for text and background
 * @param epubStyles - Optional EPUB publisher CSS (will be sanitized)
 * @param useOriginalStyles - User preference: true = use EPUB styles, false = Alexandria only
 * @returns Complete HTML document with embedded CSS
 */
export const wrapHtmlContentAppleBooks = (
  html: string,
  fontSize: FontSize,
  themeColors: { text: string; surface: string },
  epubStyles?: string | null,
  useOriginalStyles: boolean = false
): string => {
  const fontSizeValue = FONT_SIZE_MAP[fontSize];
  const lineHeight = fontSizeValue * 1.8;

  // Sanitize and prepare EPUB styles if user wants them
  const sanitizedEpubCSS = useOriginalStyles && epubStyles
    ? sanitizeEpubCSS(epubStyles)
    : '';

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

      ${sanitizedEpubCSS ? `<!-- EPUB Original Styles (Sanitized) -->
      <style id="epub-styles">
${sanitizedEpubCSS}
      </style>` : ''}

      <!-- Alexandria Base Styles -->
      <style id="alexandria-styles">
        /* ===============================
           RESET BASE
        =============================== */
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          max-width: 100vw;
          height: 100%;
          overflow-x: hidden !important;
          box-sizing: border-box;
        }

        /* Safety constraint for all elements when using original EPUB styles */
        * {
          max-width: 100% !important;
          box-sizing: border-box;
        }

        body {
          font-family: Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Times New Roman', serif;
          font-size: ${fontSizeValue}px;
          line-height: ${lineHeight}px;
          /* Critical overrides to maintain Alexandria theme (use !important) */
          color: ${themeColors.text} !important;
          background: ${themeColors.surface} !important;
          background-color: ${themeColors.surface} !important;
          padding: 40px 28px 200px 28px;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          letter-spacing: 0.2px;
        }

        /* ===============================
           TYPOGRAPHY
        =============================== */
        p,
        [class*="Body"],
        [class*="Text"],
        [class*="Para"] {
          margin: 0;
          text-align: justify;
          text-indent: 24px;
          line-height: ${lineHeight}px;
          hyphens: auto;
          -webkit-hyphens: auto;
          -ms-hyphens: auto;
        }

        /* No indent for first paragraph or after headings */
        h1 + p, h2 + p, h3 + p,
        body > p:first-of-type,
        [class*="Heading"] + p,
        [class*="Chapter"] + p {
          text-indent: 0;
        }

        /* ===============================
           HEADINGS
        =============================== */
        h1, h2, h3, h4, h5, h6,
        [class*="Chapter"], [class*="Heading"], [class*="Title"] {
          font-family: Georgia, 'Iowan Old Style', serif;
          color: ${themeColors.text};
          font-weight: 700;
          text-indent: 0;
          hyphens: none;
          margin-bottom: 0;
        }

        /* Chapter Titles */
        h1, [class*="Chapter"], [class*="Title"] {
          font-size: ${fontSizeValue * 1.5}px;
          line-height: ${fontSizeValue * 1.8}px;
          margin: 48px 0 32px 0;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: 700;
        }

        /* Subheadings */
        h2, [class*="Heading2"] {
          font-size: ${fontSizeValue * 1.25}px;
          line-height: ${fontSizeValue * 1.5}px;
          margin: 40px 0 24px 0;
          text-align: center;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        h3 {
          font-size: ${fontSizeValue * 1.1}px;
          margin: 32px 0 16px 0;
          font-weight: 600;
        }

        /* ===============================
           BLOCKQUOTES
        =============================== */
        blockquote, [class*="Quote"] {
          margin: 24px 0;
          padding: 16px 0 16px 20px;
          border-left: 4px solid ${Colors.gold};
          color: ${themeColors.text}DD;
          font-style: italic;
          background: ${themeColors.text}05;
          border-radius: 0 4px 4px 0;
        }

        blockquote p {
          text-indent: 0;
          margin: 8px 0;
        }

        /* ===============================
           IMAGES
        =============================== */
        img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 24px auto;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* ===============================
           LISTS
        =============================== */
        ul, ol {
          margin: 16px 0;
          padding-left: 40px;
        }

        li {
          margin: 8px 0;
        }

        /* ===============================
           CODE
        =============================== */
        code {
          font-family: 'Courier New', Courier, monospace;
          background-color: ${themeColors.text}10;
          padding: 2px 6px;
          border-radius: 4px;
        }

        /* ===============================
           TABLES
        =============================== */
        table {
          border-collapse: collapse;
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          display: block;
          margin: 20px 0;
          font-size: ${fontSizeValue * 0.95}px;
        }

        th, td {
          border: 1px solid ${themeColors.text}20;
          padding: 10px 12px;
          text-align: left;
        }

        th {
          background-color: ${themeColors.text}10;
          font-weight: 600;
        }

        /* ===============================
           PAGE INDICATOR
        =============================== */
        .page-number {
          text-align: center;
          font-size: ${fontSizeValue * 0.85}px;
          color: ${themeColors.text}60;
          margin-top: 60px;
          padding: 20px 0;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      ${html}
      <div class="page-number">•</div>
    </body>
  </html>`;
};

export default wrapHtmlContentAppleBooks;
