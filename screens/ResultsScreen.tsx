/**
 * ResultsScreen.tsx - Type-Safe Wrapper for ResultsScreen
 *
 * This file provides TypeScript type safety for the ResultsScreen component
 * while the main implementation remains in ResultsScreen.js during the gradual migration.
 *
 * Strategy:
 * 1. Import the JS component
 * 2. Add proper TypeScript types for props and navigation
 * 3. Re-export with type safety
 *
 * This allows gradual migration:
 * - Other TypeScript files can import from ResultsScreen.tsx
 * - Get type safety at the boundaries
 * - Refactor the 4,093-line JS file incrementally
 */

import React from 'react';
import type {
  ResultsScreenProps,
  Question,
  QuizMetadata,
  PerformanceLevel,
  SubjectPerformance,
  DetailedAnalytics,
} from '../types';

// Import the JavaScript implementation
// @ts-ignore - Importing JS file temporarily during migration
import ResultsScreenJS from './ResultsScreen.js';

/**
 * Type-safe ResultsScreen component
 *
 * This wrapper provides TypeScript type safety while the implementation
 * is gradually migrated from JavaScript.
 *
 * @param props - ResultsScreenProps with typed route params (score, questions, etc.)
 * @returns ResultsScreen component
 */
const ResultsScreen: React.FC<ResultsScreenProps> = (props) => {
  return <ResultsScreenJS {...props} />;
};

export default ResultsScreen;

/**
 * Type Exports for Testing and Mocking
 */
export type {
  ResultsScreenProps,
  Question,
  QuizMetadata,
  PerformanceLevel,
  SubjectPerformance,
  DetailedAnalytics,
};

/**
 * TODO: Gradual Migration Plan
 *
 * Phase 1: Type Definitions (DONE ✅)
 * - Added ResultsScreenRouteParams, PerformanceLevel, etc. to types/index.ts
 * - Created this wrapper file for type safety
 *
 * Phase 2: Extract Components (Next - High Priority)
 * - ScoreCard component (DONE ✅ - already extracted)
 * - PerformanceChart component (shows score breakdown)
 * - QuestionReview component (review incorrect answers)
 * - SubjectBreakdown component (performance by subject)
 * - AnalyticsInsights component (strengths/weaknesses)
 * - ShareResults component (sharing functionality)
 * - ActionButtons component (retake, home, flashcards)
 *
 * Phase 3: Convert Extracted Components to TypeScript
 * - Each extracted component becomes .tsx
 * - Full type safety for props, state, handlers
 *
 * Phase 4: Convert Main ResultsScreen Logic
 * - Once components are extracted, convert core logic
 * - ResultsScreen.js becomes ResultsScreen.tsx
 * - Remove this wrapper file
 *
 * Current Status:
 * - ScoreCard: ✅ Extracted and converted to TypeScript
 * - Remaining: 7 components to extract from 4,093 lines
 *
 * Benefits of This Approach:
 * ✅ Immediate type safety at component boundaries
 * ✅ Can use ResultsScreen in TypeScript files now
 * ✅ Gradual migration - no big bang rewrite
 * ✅ Tests can be written with proper types
 * ✅ IDE autocomplete and error checking
 * ✅ Prevents runtime crashes from invalid route params
 */
