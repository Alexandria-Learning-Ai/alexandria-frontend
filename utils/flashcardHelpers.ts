/**
 * Flashcard Helper Functions
 * Utility functions for flashcard display and processing
 */

import logger from './logger';

/**
 * Enhanced text display helper
 * Safely displays text content with HTML entity decoding
 */
export const safeDisplayText = (text: any): string => {
  if (!text) return 'No content available';

  if (typeof text === 'object') {
    return text.text || text.content || text.value || text.label || JSON.stringify(text);
  }

  if (typeof text !== 'string') {
    return String(text);
  }

  try {
    return text
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (error) {
    logger.warn('Error formatting text:', error);
    return text;
  }
};
