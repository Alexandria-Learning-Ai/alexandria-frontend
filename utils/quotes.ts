/**
 * quotes.ts - Academic motivation quotes
 *
 * Provides a collection of inspirational academic quotes with i18n support.
 * Used throughout the app to motivate students.
 */

import { TFunction } from 'i18next';

export interface Quote {
  text: string;
  author: string;
}

/**
 * Get all academic quotes with translation support
 *
 * @param t - Translation function from i18next
 * @returns Array of quotes with translated text
 */
export const getAcademicQuotes = (t?: TFunction): Quote[] => {
  // Safety guard during language transitions
  if (!t || typeof t !== 'function') {
    return [
      { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
      { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
      { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" }
    ];
  }

  return [
    {
      text: t('quotes.quote1.text') || "The expert in anything was once a beginner.",
      author: t('quotes.quote1.author') || "Helen Hayes"
    },
    {
      text: t('quotes.quote2.text') || "Education is the most powerful weapon which you can use to change the world.",
      author: t('quotes.quote2.author') || "Nelson Mandela"
    },
    {
      text: t('quotes.quote3.text') || "The beautiful thing about learning is that no one can take it away from you.",
      author: t('quotes.quote3.author') || "B.B. King"
    },
    {
      text: t('quotes.quote4.text') || "Live as if you were to die tomorrow. Learn as if you were to live forever.",
      author: t('quotes.quote4.author') || "Mahatma Gandhi"
    },
    {
      text: t('quotes.quote5.text') || "The more that you read, the more things you will know.",
      author: t('quotes.quote5.author') || "Dr. Seuss"
    },
    {
      text: t('quotes.quote6.text') || "Learning never exhausts the mind.",
      author: t('quotes.quote6.author') || "Leonardo da Vinci"
    },
    {
      text: t('quotes.quote7.text') || "Education is not preparation for life; education is life itself.",
      author: t('quotes.quote7.author') || "John Dewey"
    },
    {
      text: t('quotes.quote8.text') || "The capacity to learn is a gift; the ability to learn is a skill.",
      author: t('quotes.quote8.author') || "Brian Herbert"
    },
    {
      text: t('quotes.quote9.text') || "Tell me and I forget, teach me and I may remember, involve me and I learn.",
      author: t('quotes.quote9.author') || "Benjamin Franklin"
    },
    {
      text: t('quotes.quote10.text') || "The mind is not a vessel to be filled, but a fire to be kindled.",
      author: t('quotes.quote10.author') || "Plutarch"
    },
    {
      text: t('quotes.quote11.text') || "Knowledge is power.",
      author: t('quotes.quote11.author') || "Francis Bacon"
    }
  ];
};

/**
 * Get a random academic quote
 *
 * @param t - Translation function from i18next
 * @returns A random quote
 */
export const getRandomQuote = (t?: TFunction): Quote => {
  const quotes = getAcademicQuotes(t);
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
};

/**
 * Get quote of the day (deterministic based on date)
 *
 * @param t - Translation function from i18next
 * @param date - Optional date (defaults to today)
 * @returns Quote of the day
 */
export const getQuoteOfTheDay = (t?: TFunction, date: Date = new Date()): Quote => {
  const quotes = getAcademicQuotes(t);
  // Use day of year as seed for deterministic quote
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % quotes.length;
  return quotes[index];
};

export default {
  getAcademicQuotes,
  getRandomQuote,
  getQuoteOfTheDay,
};
