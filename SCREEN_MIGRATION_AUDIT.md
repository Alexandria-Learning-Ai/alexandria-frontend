# Screen Migration Audit

## Screens Using Legacy Hooks

### 🔴 QuizHistoryScreen.js
**Current Hooks:**
- `useQuizHistoryData` - Loads quiz history from AsyncStorage
- `useQuizHistoryActions` - Deletes/clears quizzes from AsyncStorage

**Migration Plan:**
- ✅ Replace both with `useQuizHistory` from `hooks/api/useQuizHistory.ts`
- This single hook provides: `quizHistory`, `deleteQuiz`, `clearAllHistory`, `isLoading`

**Impact:** Low - Direct replacement, same functionality

---

### 🔴 ResultsScreen.js
**Current Hooks:**
- `useQuizSaving` - Saves quiz to AsyncStorage
- `useResultsActions` - Additional save/retry logic

**Migration Plan:**
- ✅ Replace with `useSaveQuiz` from `hooks/api/useSaveQuiz.ts`
- Provides: `saveQuiz`, `isSaving`, `isSuccess`
- Automatically queues for offline sync

**Impact:** Low - Direct replacement with better offline support

---

### 🟡 HomeScreen.js
**Current Hooks:**
- `useQuizStats` - Computes stats from AsyncStorage quiz history
- `useUserProfile` - ✅ Already migrated!

**Migration Plan:**
- ✅ Update `useQuizStats` to consume data from `useQuizHistory`
- Keep hook but change data source from AsyncStorage to React Query

**Impact:** Medium - Need to update useQuizStats implementation

---

## Migration Priority

### Phase 1: Direct Replacements (Easy)
1. ✅ QuizHistoryScreen - Replace 2 hooks with 1
2. ✅ ResultsScreen - Replace 2 hooks with 1

### Phase 2: Hook Updates (Medium)
3. ✅ Update useQuizStats to use React Query data instead of AsyncStorage

### Phase 3: Deprecation
4. ✅ Add console warnings to deprecated hooks
5. ✅ Update docs

## Detailed Migration Steps

### 1. QuizHistoryScreen.js

**Before:**
```javascript
import { useQuizHistoryData } from '../hooks/useQuizHistoryData';
import { useQuizHistoryActions } from '../hooks/useQuizHistoryActions';

const { history, loading, refetch } = useQuizHistoryData();
const { deleteQuiz, clearAllHistory } = useQuizHistoryActions({
  history,
  setHistory,
  ...
});
```

**After:**
```javascript
import { useQuizHistory } from '../hooks/api/useQuizHistory';

const {
  quizHistory,
  isLoading,
  refetch,
  deleteQuiz,
  clearAllHistory
} = useQuizHistory();
```

---

### 2. ResultsScreen.js

**Before:**
```javascript
import { useQuizSaving } from '../hooks/useQuizSaving';
import { useResultsActions } from '../hooks/useResultsActions';

const { saveQuiz } = useQuizSaving();
const { handleSaveQuiz } = useResultsActions(...);
```

**After:**
```javascript
import { useSaveQuiz } from '../hooks/api/useSaveQuiz';

const {
  saveQuiz,
  isSaving,
  isSuccess
} = useSaveQuiz();
```

---

### 3. useQuizStats (Hook Update)

**Before:**
```javascript
// Inside useQuizStats
const quizHistory = await AsyncStorage.getItem(`quizHistory_${user.uid}`);
const history = JSON.parse(quizHistory || '[]');
// Compute stats from history
```

**After:**
```javascript
import { useQuizHistory } from './api/useQuizHistory';

export const useQuizStats = () => {
  const { quizHistory } = useQuizHistory();
  // Compute stats from quizHistory (already loaded)
  // No AsyncStorage needed!
};
```

## Testing Checklist

After each screen migration:

- [ ] Screen loads without errors
- [ ] Data displays correctly
- [ ] Actions work (delete, save, etc.)
- [ ] Loading states show properly
- [ ] Error handling works
- [ ] Offline behavior works
- [ ] No AsyncStorage errors in logs

## Benefits After Migration

### Before
- 3 screens using 6 different legacy hooks
- Each screen manages its own AsyncStorage logic
- No offline sync
- No automatic retries
- Duplicate code across hooks

### After
- 3 screens using 2 unified React Query hooks
- Centralized data management
- Automatic offline sync
- Auto-retry with queue
- Single source of truth
- Optimistic updates
- Cache hydration on startup

## Risk Assessment

**Low Risk:**
- QuizHistoryScreen migration - Almost identical API
- ResultsScreen migration - Simplified API

**Medium Risk:**
- useQuizStats refactor - Changes internal implementation

**Mitigation:**
- Test each screen after migration
- Keep old hooks until all screens migrated
- Deploy gradually if possible
- Monitor error logs

## Timeline Estimate

- QuizHistoryScreen: 30-45 minutes
- ResultsScreen: 30-45 minutes
- useQuizStats refactor: 45-60 minutes
- Testing: 30 minutes
- Deprecation warnings: 15 minutes

**Total: ~3 hours**

## Success Criteria

✅ All 3 screens working with new hooks
✅ No AsyncStorage usage for quiz data
✅ Offline sync working
✅ No errors in logs
✅ Tests passing
✅ Legacy hooks deprecated
