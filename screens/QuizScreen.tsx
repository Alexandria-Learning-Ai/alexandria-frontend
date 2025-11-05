/**
 * QuizScreen.tsx - Type-Safe Wrapper for QuizScreen
 *
 * This file provides TypeScript type safety for the QuizScreen component
 * while the main implementation remains in QuizScreen.js during the gradual migration.
 *
 * Strategy:
 * 1. Import the JS component
 * 2. Add proper TypeScript types for props and navigation
 * 3. Re-export with type safety
 *
 * This allows gradual migration:
 * - Other TypeScript files can import from QuizScreen.tsx
 * - Get type safety at the boundaries
 * - Refactor the 2,309-line JS file incrementally
 */

import React from 'react';
import type {
  QuizScreenProps,
  QuizState,
  QuizMetadataState,
  ThemeState,
  AnalyticsState,
  Question,
  UserAnswersMap,
  ThemeColors,
} from '../types';

// Import the JavaScript implementation
// @ts-ignore - Importing JS file temporarily during migration
import QuizScreenJS from './QuizScreen.js';

/**
 * Type-safe QuizScreen component
 *
 * This wrapper provides TypeScript type safety while the implementation
 * is gradually migrated from JavaScript.
 *
 * @param props - QuizScreenProps with typed route params and navigation
 * @returns QuizScreen component
 */
const QuizScreen: React.FC<QuizScreenProps> = (props) => {
  return <QuizScreenJS {...props} />;
};

export default QuizScreen;

/**
 * Type Exports for Testing and Mocking
 */
export type {
  QuizScreenProps,
  QuizState,
  QuizMetadataState,
  ThemeState,
  AnalyticsState,
  Question,
  UserAnswersMap,
  ThemeColors,
};

/**
 * TODO: Gradual Migration Plan
 *
 * Phase 1: Type Definitions (DONE ✅)
 * - Added QuizState, QuizMetadataState, ThemeState, etc. to types/index.ts
 * - Created this wrapper file for type safety
 *
 * Phase 2: Extract Components (Next)
 * - QuestionCard component (handles question rendering)
 * - ProgressBar component (shows quiz progress)
 * - AnswerOption component (renders answer choices)
 * - QuizHeader component (title, timer, score)
 * - NavigationButtons component (next/previous/submit)
 *
 * Phase 3: Convert Extracted Components to TypeScript
 * - Each extracted component becomes .tsx
 * - Full type safety for props, state, handlers
 *
 * Phase 4: Convert Main QuizScreen Logic
 * - Once components are extracted, convert core logic
 * - QuizScreen.js becomes QuizScreen.tsx
 * - Remove this wrapper file
 *
 * Benefits of This Approach:
 * ✅ Immediate type safety at component boundaries
 * ✅ Can use QuizScreen in TypeScript files now
 * ✅ Gradual migration - no big bang rewrite
 * ✅ Tests can be written with proper types
 * ✅ IDE autocomplete and error checking
 */

