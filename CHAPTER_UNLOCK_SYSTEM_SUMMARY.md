# Progressive Chapter Unlock System - Implementation Summary

## Overview

The Progressive Chapter Unlock System ensures users read and understand material sequentially by requiring quiz completion before unlocking subsequent chapters.

## Implementation Status

### ✅ Completed

1. **Chapter Lock State Utility** (`utils/chapterLockUtils.ts`)
   - Determines if a chapter is locked based on:
     - Chapter 1 is always unlocked
     - Previous chapter must be completed
     - Previous chapter quiz must be passed (70% threshold)
   - Provides lock state with detailed reasons
   - Generates user-friendly messages and alert dialogs
   - Helper functions for UI indicators

2. **Chapter Quiz Results Hook** (`hooks/useChapterQuizResults.ts`)
   - Tracks quiz results per chapter
   - Stores results in AsyncStorage (offline-first)
   - Tracks pass/fail status (70% passing threshold)
   - Provides functions to save, retrieve, and clear results
   - Auto-loads on mount

3. **BookDetailScreen Integration** (Partial)
   - Imported lock state utilities
   - Imported useChapterQuizResults hook
   - Added quiz results tracking to component

### 🚧 In Progress

4. **BookDetailScreen UI Updates** (Remaining)
   - Need to update renderChapterItem to:
     - Show lock icons for locked chapters
     - Display lock messages
     - Disable navigation to locked chapters
     - Show alert dialogs explaining why chapters are locked
     - Add visual indicators (greyed out, opacity changes)

### ⏳ Pending

5. **ChapterReaderScreen Updates**
   - Add "Take Quiz" button at end of chapters
   - Navigate to quiz for current chapter
   - Handle quiz completion and unlock logic

6. **QuizView Integration**
   - Save quiz results with chapter context
   - Trigger chapter unlock on quiz pass
   - Show congratulations message when unlocking chapters

## How It Works

### Lock Logic Flow

```
1. Chapter 1: Always unlocked
2. Chapter N (N > 1):
   a. Check if user has read Chapter N-1
      - If NO: Locked (reason: 'not_started')
   b. Check if user passed quiz for Chapter N-1
      - If NO QUIZ: Locked (reason: 'quiz_required')
      - If FAILED (< 70%): Locked (reason: 'quiz_failed')
      - If PASSED (>= 70%): Unlocked
```

### Data Storage

**Quiz Results** (AsyncStorage):
```typescript
{
  [chapterIndex: number]: {
    chapterId: string,
    chapterIndex: number,
    score: number,
    totalQuestions: number,
    percentage: number,
    passed: boolean,
    completedAt: string
  }
}
```

## Components Created

### 1. `utils/chapterLockUtils.ts`

**Key Functions:**
- `getChapterLockState()` - Determines lock state for a chapter
- `getLockMessage()` - Returns short message for UI
- `getLockAlertTitle()` - Returns alert dialog title
- `getLockAlertMessage()` - Returns detailed alert message
- `getLockIconName()` - Returns FontAwesome5 icon name
- `areAllChaptersUnlocked()` - Checks if all chapters unlocked
- `getNextLockedChapter()` - Finds next locked chapter

**Types:**
```typescript
interface ChapterQuizResult {
  chapterId: string;
  chapterIndex: number;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
}

type ChapterQuizResultsMap = Record<number, ChapterQuizResult>;

interface ChapterLockState {
  isLocked: boolean;
  reason?: 'not_started' | 'quiz_required' | 'quiz_failed';
  requiredQuizScore?: number;
  userQuizScore?: number;
  previousChapterTitle?: string;
}
```

### 2. `hooks/useChapterQuizResults.ts`

**Hook Interface:**
```typescript
interface UseChapterQuizResultsReturn {
  quizResults: ChapterQuizResultsMap;
  isLoading: boolean;
  saveQuizResult: (chapterId, chapterIndex, score, totalQuestions) => Promise<void>;
  hasPassedChapterQuiz: (chapterIndex: number) => boolean;
  getQuizResult: (chapterIndex: number) => ChapterQuizResult | null;
  clearAllResults: () => Promise<void>;
  clearChapterResult: (chapterIndex: number) => Promise<void>;
}
```

**Usage:**
```typescript
const {
  quizResults,
  saveQuizResult,
  hasPassedChapterQuiz,
} = useChapterQuizResults(materialId);

// Save quiz result
await saveQuizResult(chapterId, chapterIndex, score, totalQuestions);

// Check if passed
const passed = hasPassedChapterQuiz(2); // Check chapter 2
```

## Remaining Implementation

### BookDetailScreen - renderChapterItem

```typescript
const renderChapterItem = useCallback(({ item, index }: { item: any; index: number }) => {
  const statusInfo = getChapterStatusInfo(item.id);
  const estimatedReadTime = Math.max(1, Math.ceil(item.word_count / 200));

  // Get previous chapter title for lock messages
  const previousChapter = material?.chapters[item.index - 2];
  const previousChapterTitle = previousChapter?.title;

  // Check lock state
  const lockState = getChapterLockState(
    item.index,
    material?.chapters.length || 0,
    progressData,
    chapterQuizResults,
    previousChapterTitle
  );

  const handlePress = () => {
    if (lockState.isLocked) {
      // Show lock alert
      Alert.alert(
        getLockAlertTitle(lockState),
        getLockAlertMessage(lockState),
        [{ text: 'OK' }]
      );
    } else {
      handleChapterPress(item.id, item.index);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.chapterItem,
        {
          backgroundColor: lockState.isLocked ? themeColors.background : themeColors.surface,
          opacity: lockState.isLocked ? 0.6 : 1,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Lock icon overlay */}
      {lockState.isLocked && (
        <View style={styles.lockIconContainer}>
          <FontAwesome5
            name={getLockIconName(lockState)}
            size={20}
            color={themeColors.textSecondary}
          />
        </View>
      )}

      <View style={styles.chapterHeader}>
        <View style={styles.chapterTitleContainer}>
          <Text
            style={[
              styles.chapterNumber,
              { color: lockState.isLocked ? themeColors.textSecondary : themeColors.accent },
            ]}
          >
            {item.index}.
          </Text>
          <Text
            style={[
              styles.chapterTitle,
              { color: lockState.isLocked ? themeColors.textSecondary : themeColors.text },
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.title}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusInfo.backgroundColor },
          ]}
        >
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      {/* Lock message */}
      {lockState.isLocked && lockState.reason && (
        <View style={styles.lockMessageContainer}>
          <Text style={[styles.lockMessageText, { color: themeColors.textSecondary }]}>
            {lockState.reason === 'not_started' && 'Complete previous chapter first'}
            {lockState.reason === 'quiz_required' && 'Quiz required to unlock'}
            {lockState.reason === 'quiz_failed' && `Need ${lockState.requiredQuizScore}% to unlock`}
          </Text>
        </View>
      )}

      {/* Meta info */}
      <View style={styles.chapterMeta}>
        <FontAwesome5
          name="clock"
          size={12}
          color={themeColors.textSecondary}
          style={styles.metaIcon}
        />
        <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
          {estimatedReadTime} min read
        </Text>

        <View style={styles.metaSeparator} />

        <FontAwesome5
          name="file-word"
          size={12}
          color={themeColors.textSecondary}
          style={styles.metaIcon}
        />
        <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
          {item.word_count.toLocaleString()} words
        </Text>
      </View>

      <View style={styles.chevronContainer}>
        <FontAwesome5
          name={lockState.isLocked ? 'lock' : 'chevron-right'}
          size={16}
          color={themeColors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
}, [handleChapterPress, progressMap, themeColors, material, progressData, chapterQuizResults]);
```

**Add to styles:**
```typescript
lockIconContainer: {
  position: 'absolute',
  top: 16,
  left: 16,
  zIndex: 10,
},
lockMessageContainer: {
  marginTop: 8,
  paddingTop: 8,
  borderTopWidth: 1,
  borderTopColor: Colors.border,
},
lockMessageText: {
  fontSize: 12,
  fontWeight: '500',
  fontStyle: 'italic',
},
```

### ChapterReaderScreen - Quiz Button

Add at end of chapter content (before ActionBar):

```typescript
{/* Quiz Button for Chapter Unlock */}
{chapterIndex < totalChapters - 1 && (
  <View style={styles.quizButtonContainer}>
    <Text style={[styles.quizPromptText, { color: themeColors.text }]}>
      Complete the quiz to unlock the next chapter
    </Text>
    <TouchableOpacity
      style={[styles.quizButton, { backgroundColor: themeColors.accent }]}
      onPress={() => {
        // Navigate to quiz for this chapter
        navigation.navigate('Quiz', {
          materialId,
          chapterId,
          chapterIndex,
          source: 'chapter_unlock',
        });
      }}
      activeOpacity={0.8}
    >
      <FontAwesome5 name="clipboard-check" size={20} color={Colors.white} />
      <Text style={styles.quizButtonText}>Take Quiz</Text>
    </TouchableOpacity>
  </View>
)}
```

**Add to styles:**
```typescript
quizButtonContainer: {
  paddingVertical: 24,
  paddingHorizontal: 20,
  alignItems: 'center',
  borderTopWidth: 2,
  borderTopColor: Colors.border,
  marginTop: 32,
},
quizPromptText: {
  fontSize: 16,
  fontWeight: '600',
  marginBottom: 16,
  textAlign: 'center',
},
quizButton: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 14,
  paddingHorizontal: 32,
  borderRadius: 12,
  gap: 12,
  shadowColor: Colors.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 5,
},
quizButtonText: {
  color: Colors.white,
  fontSize: 16,
  fontWeight: '700',
},
```

### QuizView - Save Results on Completion

Update QuizView to save results when quiz completes:

```typescript
import { useChapterQuizResults } from '../../hooks/useChapterQuizResults';

// In QuizView component
interface QuizViewProps {
  quiz: QuizData | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
  // Add these props:
  chapterId?: string;
  chapterIndex?: number;
  materialId?: string;
  onQuizComplete?: (passed: boolean) => void;
}

const QuizView: React.FC<QuizViewProps> = ({
  quiz,
  loading,
  error,
  onGenerate,
  chapterId,
  chapterIndex,
  materialId,
  onQuizComplete,
}) => {
  const { saveQuizResult } = useChapterQuizResults(materialId || '');

  // When quiz completes (in handleNext when showing results)
  const handleNext = async () => {
    if (quiz && currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);

      // Save quiz result if chapter context provided
      if (chapterId && chapterIndex !== undefined && materialId) {
        const totalQuestions = quiz?.questions.length || 0;
        await saveQuizResult(chapterId, chapterIndex, score, totalQuestions);

        const percentage = (score / totalQuestions) * 100;
        const passed = percentage >= 70;

        if (onQuizComplete) {
          onQuizComplete(passed);
        }

        if (passed) {
          // Show success message
          Alert.alert(
            'Chapter Unlocked!',
            `You scored ${percentage.toFixed(0)}% and unlocked the next chapter!`,
            [{ text: 'Continue Reading' }]
          );
        }
      }
    }
  };
};
```

## User Experience Flow

1. **User opens book**
   - Sees Chapter 1 unlocked
   - Sees other chapters locked with clear messaging

2. **User reads Chapter 1**
   - Progress is tracked
   - At end of chapter, sees "Take Quiz" button

3. **User takes quiz for Chapter 1**
   - Completes quiz
   - If score >= 70%:
     - Result is saved
     - Chapter 2 unlocks
     - Alert shows "Chapter Unlocked!"
   - If score < 70%:
     - Result is saved
     - Chapter 2 remains locked
     - User can retake quiz

4. **User navigates back to book**
   - Chapter 2 now shows as unlocked
   - Can navigate to Chapter 2
   - Process repeats

## Configuration

**Passing Score Threshold:**
```typescript
// utils/chapterLockUtils.ts
export const QUIZ_PASSING_SCORE = 70; // 70% to pass
```

Change this constant to adjust the passing threshold.

## Testing Checklist

- [ ] Chapter 1 is always unlocked
- [ ] Chapter 2 is locked before reading Chapter 1
- [ ] Chapter 2 is locked after reading Chapter 1 but before quiz
- [ ] Chapter 2 remains locked if quiz score < 70%
- [ ] Chapter 2 unlocks when quiz score >= 70%
- [ ] Lock icons display correctly
- [ ] Lock messages are clear and helpful
- [ ] Alert dialogs provide detailed explanations
- [ ] Quiz results persist across app restarts
- [ ] Multiple quiz attempts are allowed
- [ ] Last quiz score is used for unlock status
- [ ] UI is responsive and visually consistent

## Next Steps

1. Complete BookDetailScreen renderChapterItem with lock UI
2. Add quiz button to ChapterReaderScreen
3. Integrate quiz results saving in QuizView
4. Test complete flow end-to-end
5. Add analytics tracking for unlock events
6. Consider backend sync for quiz results (optional)

## Files Modified/Created

### Created:
- `utils/chapterLockUtils.ts` - Lock state logic and utilities
- `hooks/useChapterQuizResults.ts` - Quiz results management hook
- `CHAPTER_UNLOCK_SYSTEM_SUMMARY.md` - This documentation

### Modified:
- `screens/BookDetailScreen.tsx` - Added imports and hook usage (partial)

### To Modify:
- `screens/BookDetailScreen.tsx` - Complete renderChapterItem UI updates
- `screens/ChapterReaderScreen.tsx` - Add quiz button
- `components/artifacts/QuizView.tsx` - Add result saving logic
