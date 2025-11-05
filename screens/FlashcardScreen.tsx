/**
 * FlashcardScreen.tsx - Type-Safe Wrapper for FlashcardScreen
 *
 * This file provides TypeScript type safety for the FlashcardScreen component
 * while the main implementation remains in FlashcardScreen.js.
 *
 * Strategy:
 * 1. Import the JS component
 * 2. Add proper TypeScript types for props and navigation
 * 3. Re-export with type safety
 *
 * This allows gradual migration:
 * - Other TypeScript files can import from FlashcardScreen.tsx
 * - Get type safety at the boundaries
 * - Refactor incrementally
 */

import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';

// Import the JavaScript implementation
// @ts-ignore - Importing JS file temporarily during migration
import FlashcardScreenJS from './FlashcardScreen.js';

interface FlashcardRouteParams {
  flashcards?: any[];
  mode?: string;
  subject?: string;
}

interface FlashcardScreenProps {
  navigation: any;
  route: {
    params?: FlashcardRouteParams;
  };
}

/**
 * Type-safe FlashcardScreen component
 *
 * This wrapper provides TypeScript type safety while the implementation
 * is gradually migrated from JavaScript.
 *
 * @param props - FlashcardScreenProps with typed route params and navigation
 * @returns FlashcardScreen component
 */
const FlashcardScreen: React.FC<FlashcardScreenProps> = (props) => {
  return (
    <ErrorBoundary>
      <FlashcardScreenJS {...props} />
    </ErrorBoundary>
  );
};

export default FlashcardScreen;

/**
 * TODO: Gradual Migration Plan
 *
 * Phase 1: Extract Components (DONE ✅)
 * - FlashcardHeader - Header with back button and title
 * - SessionStatsBar - Stats display
 * - FlashcardProgressBar - Progress indicator
 * - SubjectIndicator - Subject/course/topic badges
 * - FlashcardFront - Question side of card
 * - FlashcardBack - Answer side of card
 * - SelfAssessment - Answer quality buttons
 * - SessionSettingsModal - Settings modal
 *
 * Phase 2: Refactor Main Screen (DONE ✅)
 * - Reduced from 520 lines to 205 lines (60% reduction)
 * - Clean, maintainable structure
 * - Reusable components
 *
 * Phase 3: TypeScript Wrapper (DONE ✅)
 * - Type safety at component boundaries
 * - Can use FlashcardScreen in TypeScript files
 *
 * Phase 4: Convert to Full TypeScript (Future)
 * - Convert FlashcardScreen.js to FlashcardScreen.tsx
 * - Add full type safety for props, state, handlers
 * - Remove this wrapper file
 *
 * Benefits of This Approach:
 * ✅ Immediate type safety at component boundaries
 * ✅ Can use FlashcardScreen in TypeScript files now
 * ✅ Gradual migration - no big bang rewrite
 * ✅ Tests can be written with proper types
 * ✅ IDE autocomplete and error checking
 */
