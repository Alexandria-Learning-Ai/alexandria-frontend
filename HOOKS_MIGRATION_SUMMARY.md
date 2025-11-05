# Hooks Migration Summary

## Overview

The app currently has a mix of legacy hooks using AsyncStorage directly and new React Query hooks using OfflineManager. This document summarizes the current state and migration path.

## Hook Categories

### ✅ Migrated to React Query + OfflineManager

These hooks use the unified offline caching system:

#### 1. Quiz History Management
**Location**: `hooks/api/useQuizHistory.ts`
- ✅ Uses React Query `useQuery`
- ✅ Backend-first with OfflineManager fallback
- ✅ Uses `OfflineManager.getDataWithFallback()`
- ✅ Optimistic updates for delete
- ✅ Mutation keys for tracking

**Features**:
```typescript
const {
  quizHistory,
  isLoading,
  refetch,
  deleteQuiz,
  clearAllHistory
} = useQuizHistory();
```

#### 2. Quiz Saving
**Location**: `hooks/api/useSaveQuiz.ts`
- ✅ Uses React Query `useMutation`
- ✅ Queues offline actions via OfflineManager
- ✅ Optimistic updates
- ✅ Automatic retry logic

**Features**:
```typescript
const {
  saveQuiz,
  isSaving,
  isSuccess
} = useSaveQuiz();
```

#### 3. User Profile Management
**Location**: `hooks/api/useUserProfile.ts`
- ✅ Uses React Query `useQuery` + `useMutation`
- ✅ OfflineManager cache
- ✅ Optimistic updates
- ✅ Course management (add/remove)

**Features**:
```typescript
const {
  profile,
  updateProfile,
  addCourse,
  removeCourse
} = useUserProfile();
```

### ⚠️ Legacy Hooks Using AsyncStorage

These hooks still use AsyncStorage directly (may or may not need migration):

#### Quiz-Related Hooks

1. **`useQuizHistoryActions.ts`**
   - Direct AsyncStorage usage for quiz history
   - Delete/clear operations
   - **Status**: Duplicate of useQuizHistory functionality
   - **Action**: Can be deprecated in favor of useQuizHistory

2. **`useQuizHistoryData.ts`**
   - Fetches quiz history from AsyncStorage
   - **Status**: Duplicate of useQuizHistory functionality
   - **Action**: Can be deprecated in favor of useQuizHistory

3. **`useQuizSaving.ts`**
   - Saves quizzes to AsyncStorage
   - **Status**: Duplicate of useSaveQuiz functionality
   - **Action**: Can be deprecated in favor of useSaveQuiz

4. **`useQuizStats.ts`**
   - Computes stats from AsyncStorage quiz history
   - **Status**: Should use React Query data
   - **Action**: Update to use useQuizHistory data

5. **`useQuizHandlers.ts`**
   - Saves challenge history
   - **Status**: Specialized use case
   - **Action**: Keep as-is or migrate to OfflineManager

6. **`useQuizInitialization.ts`**
   - Loads shared quiz data
   - **Status**: Specialized use case
   - **Action**: Keep as-is or migrate to OfflineManager

7. **`useResultsActions.ts`**
   - Saves quiz results
   - **Status**: May duplicate useSaveQuiz
   - **Action**: Review and potentially deprecate

8. **`useProgressAnalytics.js`**
   - Loads quiz history for analytics
   - **Status**: Should use React Query data
   - **Action**: Update to use useQuizHistory data

#### UI Preference Hooks (OK to keep AsyncStorage)

1. **`useFlashcardSession.ts`**
   - Loads flashcard preferences (dark mode, etc.)
   - **Status**: UI preferences only
   - **Action**: ✅ Keep as-is (UI preferences appropriate for AsyncStorage)

2. **`useProfileData.ts`**
   - Profile completion flags, language preferences
   - **Status**: UI state and flags
   - **Action**: ✅ Keep as-is (UI state appropriate for AsyncStorage)

3. **`useTheme.ts`**
   - Theme preferences (dark/light mode)
   - **Status**: UI preference
   - **Action**: ✅ Keep as-is (UI preferences appropriate for AsyncStorage)

## Migration Strategy

### Phase 1: Immediate (Completed ✅)
- ✅ Core data hooks migrated (quiz, profile)
- ✅ React Query + OfflineManager integration
- ✅ Backend sync methods implemented

### Phase 2: Deprecation (Recommended)

Mark the following hooks as deprecated and update screens to use new hooks:

1. **Replace useQuizHistoryActions** → **useQuizHistory**
   ```typescript
   // Old
   import { useQuizHistoryActions } from '../hooks/useQuizHistoryActions';
   const { deleteQuiz } = useQuizHistoryActions(...);

   // New
   import { useQuizHistory } from '../hooks/api/useQuizHistory';
   const { deleteQuiz } = useQuizHistory();
   ```

2. **Replace useQuizHistoryData** → **useQuizHistory**
   ```typescript
   // Old
   import { useQuizHistoryData } from '../hooks/useQuizHistoryData';
   const { history, loading } = useQuizHistoryData();

   // New
   import { useQuizHistory } from '../hooks/api/useQuizHistory';
   const { quizHistory, isLoading } = useQuizHistory();
   ```

3. **Replace useQuizSaving** → **useSaveQuiz**
   ```typescript
   // Old
   import { useQuizSaving } from '../hooks/useQuizSaving';
   const { saveQuiz } = useQuizSaving();

   // New
   import { useSaveQuiz } from '../hooks/api/useSaveQuiz';
   const { saveQuiz } = useSaveQuiz();
   ```

4. **Update useQuizStats** to use useQuizHistory data
   ```typescript
   // Update internally to use React Query data instead of AsyncStorage
   import { useQuizHistory } from '../hooks/api/useQuizHistory';

   export const useQuizStats = () => {
     const { quizHistory } = useQuizHistory();
     // Compute stats from quizHistory instead of loading from AsyncStorage
   };
   ```

5. **Update useProgressAnalytics** to use useQuizHistory data
   ```typescript
   // Similar to useQuizStats - use React Query data
   ```

### Phase 3: Optional Migrations

These hooks may or may not need migration depending on usage:

1. **useQuizHandlers** - If challenge history needs backend sync, migrate
2. **useQuizInitialization** - If shared quizzes need backend sync, migrate
3. **useResultsActions** - Review if it duplicates useSaveQuiz

## AsyncStorage Usage Guidelines

### ✅ Appropriate for AsyncStorage

- UI preferences (theme, dark mode)
- App state flags (onboarding completed, tutorial seen)
- User preferences (notifications, language)
- Temporary UI state

**Examples**:
```javascript
// Good - UI preference
await AsyncStorage.setItem('theme', 'dark');

// Good - App state flag
await AsyncStorage.setItem('onboardingCompleted', 'true');

// Good - User preference
await AsyncStorage.setItem('notificationsEnabled', 'true');
```

### ❌ Should Use OfflineManager

- User data (profile, quizzes, progress)
- App content (flashcards, study materials)
- Data that needs backend sync
- Data that needs cache expiry
- Data with offline queue requirements

**Examples**:
```javascript
// Bad - Use OfflineManager instead
await AsyncStorage.setItem('quizHistory', JSON.stringify(quizzes));

// Good - Use OfflineManager
await OfflineManager.cacheData(
  OfflineManager.CACHE_KEYS.QUIZ_HISTORY,
  quizzes
);
```

## Migration Checklist

For each hook that needs migration:

- [ ] Identify if it duplicates React Query hook functionality
- [ ] If yes, update screens to use React Query hook
- [ ] If no, decide if data needs backend sync
- [ ] If backend sync needed, add to OfflineManager
- [ ] Update hook to use OfflineManager for caching
- [ ] Add mutation key for React Query tracking
- [ ] Test offline behavior
- [ ] Update documentation

## Current Status

### Hooks Summary

| Hook | Type | Uses | Status | Action |
|------|------|------|--------|--------|
| useQuizHistory | Data | React Query + OfflineManager | ✅ Migrated | None |
| useSaveQuiz | Data | React Query + OfflineManager | ✅ Migrated | None |
| useUserProfile | Data | React Query + OfflineManager | ✅ Migrated | None |
| useQuizHistoryActions | Data | AsyncStorage | ⚠️ Legacy | Deprecate → useQuizHistory |
| useQuizHistoryData | Data | AsyncStorage | ⚠️ Legacy | Deprecate → useQuizHistory |
| useQuizSaving | Data | AsyncStorage | ⚠️ Legacy | Deprecate → useSaveQuiz |
| useQuizStats | Data | AsyncStorage | ⚠️ Legacy | Update to use useQuizHistory |
| useQuizHandlers | Data | AsyncStorage | ⚙️ Specialized | Review |
| useQuizInitialization | Data | AsyncStorage | ⚙️ Specialized | Review |
| useResultsActions | Data | AsyncStorage | ⚠️ Legacy | Review |
| useProgressAnalytics | Data | AsyncStorage | ⚠️ Legacy | Update to use useQuizHistory |
| useFlashcardSession | UI | AsyncStorage | ✅ OK | Keep as-is |
| useProfileData | UI | AsyncStorage | ✅ OK | Keep as-is |
| useTheme | UI | AsyncStorage | ✅ OK | Keep as-is |

### Next Steps

1. **Screen Audit**: Review all screens to see which hooks are being used
2. **Gradual Migration**: Update one screen at a time to use new hooks
3. **Testing**: Test each screen after migration
4. **Documentation**: Update screen documentation with new hooks
5. **Deprecation**: Mark old hooks as deprecated
6. **Removal**: After all screens migrated, remove deprecated hooks

## Benefits of Migration

### Before (Legacy Hooks)
```typescript
// Multiple hooks, inconsistent patterns
const { history } = useQuizHistoryData();
const { deleteQuiz } = useQuizHistoryActions({...});
const { saveQuiz } = useQuizSaving();

// Manual AsyncStorage management
await AsyncStorage.setItem('quizHistory_${uid}', ...);

// No offline queue
// No automatic retries
// No backend sync
```

### After (React Query Hooks)
```typescript
// Single unified hook
const {
  quizHistory,
  deleteQuiz,
  clearAllHistory,
  isLoading
} = useQuizHistory();

const { saveQuiz } = useSaveQuiz();

// Automatic:
// ✅ OfflineManager caching
// ✅ Offline queue
// ✅ Auto retries (5x)
// ✅ Backend sync
// ✅ Optimistic updates
// ✅ Cache hydration
```

## Conclusion

The core data management hooks have been successfully migrated to React Query + OfflineManager. The remaining task is to:

1. Audit screens for legacy hook usage
2. Migrate screens to use new hooks
3. Deprecate/remove legacy hooks
4. Keep UI preference hooks using AsyncStorage (appropriate use case)

The new system provides a robust, unified approach to offline caching with automatic sync, retry logic, and optimistic updates.
