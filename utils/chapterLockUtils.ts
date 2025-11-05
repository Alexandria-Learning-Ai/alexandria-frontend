/**
 * chapterLockUtils - Chapter lock state logic for progressive unlock system
 *
 * Features:
 * - Determines if a chapter is locked based on:
 *   - Chapter 1 is always unlocked
 *   - User must complete previous chapter
 *   - User must pass quiz for previous chapter (70% threshold)
 * - Returns lock state with reason and metadata
 * - Provides user-friendly messages
 *
 * Lock Flow:
 * 1. Chapter 1: Always unlocked
 * 2. Subsequent chapters: Check if previous chapter completed AND quiz passed
 * 3. Show appropriate lock reason (not started, quiz required, quiz failed)
 */

/**
 * Individual chapter progress item from backend
 */
export interface ChapterProgressItem {
  chapter_id: string;
  read_pct: number;
  completed: boolean;
  last_opened: string;
}

/**
 * Progress response from backend /api/materials/{material_id}/progress
 */
export interface MaterialProgressResponse {
  material_id: string;
  overall_percentage: number;
  chapters_completed: number;
  total_chapters: number;
  last_opened_chapter_id: string | null;
  current_chapter_index: number; // 0-based index of chapter user should work on
  progress: ChapterProgressItem[];
}

/**
 * Quiz result for a specific chapter
 */
export interface ChapterQuizResult {
  chapterId: string;
  chapterIndex: number; // 0-based index (Chapter 1 = 0, Chapter 2 = 1, etc.)
  score: number; // Number of correct answers
  totalQuestions: number;
  percentage: number; // 0-100
  passed: boolean; // True if >= 70%
  completedAt: string;
}

/**
 * Chapter quiz results map (keyed by chapter index, 0-based)
 * - Chapter 1 quiz results are stored at key 0
 * - Chapter 2 quiz results are stored at key 1
 * - etc.
 */
export type ChapterQuizResultsMap = Record<number, ChapterQuizResult>;

/**
 * Chapter lock state
 */
export interface ChapterLockState {
  isLocked: boolean;
  reason?: 'not_started' | 'quiz_required' | 'quiz_failed';
  requiredQuizScore?: number; // Passing threshold (e.g., 70)
  userQuizScore?: number; // User's actual score
  previousChapterTitle?: string;
}

/**
 * Constants
 */
export const QUIZ_PASSING_SCORE = 70; // 70% to pass and unlock next chapter

/**
 * Determine if a chapter is locked
 *
 * INDEX CONVENTIONS:
 * - chapterIndex parameter is 1-based (Chapter 1, Chapter 2, etc.) from Chapter model
 * - Internally converts to 0-based for quiz results lookup
 * - Quiz results are stored with 0-based keys (Chapter 1 = key 0, Chapter 2 = key 1)
 * - current_chapter_index from progress is 0-based
 *
 * @param chapterIndex - Current chapter index (1-based: 1, 2, 3, ...)
 * @param totalChapters - Total number of chapters
 * @param materialProgress - User's progress in the material
 * @param chapterQuizResults - Map of quiz results by 0-based chapter index
 * @param previousChapterTitle - Title of previous chapter (for messaging)
 * @returns ChapterLockState with lock status and reason
 */
export function getChapterLockState(
  chapterIndex: number,
  totalChapters: number,
  materialProgress: MaterialProgressResponse | null,
  chapterQuizResults: ChapterQuizResultsMap,
  previousChapterTitle?: string
): ChapterLockState {
  // Chapter 1 is always unlocked
  if (chapterIndex === 1) {
    return { isLocked: false };
  }

  // Convert 1-based chapter index to 0-based for internal logic
  const chapterIndex0Based = chapterIndex - 1; // e.g., Chapter 2 (1-based) → 1 (0-based)
  const previousChapterIndex0Based = chapterIndex0Based - 1; // e.g., Chapter 1 → 0

  // Check if user has started reading the previous chapter
  // current_chapter_index is 0-based from the backend
  const currentChapterInProgress = materialProgress?.current_chapter_index ?? 0;
  const hasReadPreviousChapter = currentChapterInProgress >= chapterIndex0Based;

  if (!hasReadPreviousChapter) {
    return {
      isLocked: true,
      reason: 'not_started',
      previousChapterTitle,
    };
  }

  // Check if user passed quiz for previous chapter
  // Quiz results are keyed by 0-based index
  const previousQuizResult = chapterQuizResults[previousChapterIndex0Based];

  if (!previousQuizResult) {
    // No quiz result found - quiz not taken yet
    return {
      isLocked: true,
      reason: 'quiz_required',
      requiredQuizScore: QUIZ_PASSING_SCORE,
      previousChapterTitle,
    };
  }

  if (!previousQuizResult.passed || previousQuizResult.percentage < QUIZ_PASSING_SCORE) {
    // Quiz taken but failed (< 70%)
    return {
      isLocked: true,
      reason: 'quiz_failed',
      requiredQuizScore: QUIZ_PASSING_SCORE,
      userQuizScore: previousQuizResult.percentage,
      previousChapterTitle,
    };
  }

  // Chapter is unlocked!
  return { isLocked: false };
}

/**
 * Get user-friendly lock message
 *
 * @param lockState - Chapter lock state
 * @returns Human-readable message explaining why chapter is locked
 */
export function getLockMessage(lockState: ChapterLockState): string {
  if (!lockState.isLocked) {
    return '';
  }

  const chapterRef = lockState.previousChapterTitle
    ? `"${lockState.previousChapterTitle}"`
    : 'the previous chapter';

  switch (lockState.reason) {
    case 'not_started':
      return `Complete ${chapterRef} first to unlock this chapter`;

    case 'quiz_required':
      return `Take the quiz for ${chapterRef} to unlock this chapter (${lockState.requiredQuizScore}% required to pass)`;

    case 'quiz_failed':
      return `Score ${lockState.requiredQuizScore}% or higher on ${chapterRef}'s quiz to unlock (Current: ${lockState.userQuizScore}%)`;

    default:
      return 'This chapter is locked';
  }
}

/**
 * Get lock alert title
 *
 * @param lockState - Chapter lock state
 * @returns Alert dialog title
 */
export function getLockAlertTitle(lockState: ChapterLockState): string {
  if (!lockState.isLocked) {
    return '';
  }

  switch (lockState.reason) {
    case 'not_started':
      return 'Chapter Locked';

    case 'quiz_required':
      return 'Quiz Required';

    case 'quiz_failed':
      return 'Higher Score Required';

    default:
      return 'Chapter Locked';
  }
}

/**
 * Get lock alert message (detailed explanation)
 *
 * @param lockState - Chapter lock state
 * @returns Alert dialog message
 */
export function getLockAlertMessage(lockState: ChapterLockState): string {
  if (!lockState.isLocked) {
    return '';
  }

  const chapterRef = lockState.previousChapterTitle
    ? `"${lockState.previousChapterTitle}"`
    : 'the previous chapter';

  switch (lockState.reason) {
    case 'not_started':
      return `You need to read ${chapterRef} before you can access this chapter.\n\nThis ensures you learn the material in the correct order.`;

    case 'quiz_required':
      return `You need to take the quiz for ${chapterRef} and score at least ${lockState.requiredQuizScore}% to unlock this chapter.\n\nThis ensures you've mastered the material before moving forward.`;

    case 'quiz_failed':
      return `You scored ${lockState.userQuizScore}% on ${chapterRef}'s quiz, but you need ${lockState.requiredQuizScore}% to unlock this chapter.\n\nRetry the quiz to improve your score and unlock the next chapter.`;

    default:
      return 'This chapter is currently locked.';
  }
}

/**
 * Get lock icon name (FontAwesome5)
 *
 * @param lockState - Chapter lock state
 * @returns Icon name for lock state
 */
export function getLockIconName(lockState: ChapterLockState): string {
  if (!lockState.isLocked) {
    return 'unlock';
  }

  switch (lockState.reason) {
    case 'not_started':
      return 'lock';

    case 'quiz_required':
      return 'clipboard-list';

    case 'quiz_failed':
      return 'exclamation-triangle';

    default:
      return 'lock';
  }
}

/**
 * Check if all chapters are unlocked
 *
 * @param totalChapters - Total number of chapters
 * @param materialProgress - User's progress
 * @param chapterQuizResults - Quiz results map
 * @returns True if all chapters are unlocked
 */
export function areAllChaptersUnlocked(
  totalChapters: number,
  materialProgress: MaterialProgressResponse | null,
  chapterQuizResults: ChapterQuizResultsMap
): boolean {
  for (let i = 1; i <= totalChapters; i++) {
    const lockState = getChapterLockState(
      i,
      totalChapters,
      materialProgress,
      chapterQuizResults
    );
    if (lockState.isLocked) {
      return false;
    }
  }
  return true;
}

/**
 * Get next locked chapter index
 *
 * @param totalChapters - Total number of chapters
 * @param materialProgress - User's progress
 * @param chapterQuizResults - Quiz results map
 * @returns Next locked chapter index (1-based), or null if all unlocked
 */
export function getNextLockedChapter(
  totalChapters: number,
  materialProgress: MaterialProgressResponse | null,
  chapterQuizResults: ChapterQuizResultsMap
): number | null {
  for (let i = 1; i <= totalChapters; i++) {
    const lockState = getChapterLockState(
      i,
      totalChapters,
      materialProgress,
      chapterQuizResults
    );
    if (lockState.isLocked) {
      return i;
    }
  }
  return null;
}
