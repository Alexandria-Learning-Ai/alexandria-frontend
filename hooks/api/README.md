# React Query API Hooks

This directory contains all React Query hooks for data fetching and mutations with caching, optimistic updates, and offline support.

## 🎯 Benefits

- **Automatic Caching**: Data is cached and reused across components
- **Background Refetching**: Automatically refetches stale data
- **Optimistic Updates**: Instant UI feedback before server confirmation
- **Offline Support**: Works offline with local storage fallback
- **Network-Aware**: Pauses/resumes based on connectivity
- **Retry Logic**: Automatic retries with exponential backoff

---

## 📚 Available Hooks

### `useQuizHistory()`

Manages quiz history with caching and optimistic updates.

```typescript
import { useQuizHistory } from '../hooks/api/useQuizHistory';

function QuizHistoryScreen() {
  const {
    quizHistory,        // Array of quiz history items
    isLoading,          // Initial load state
    isFetching,         // Background refetch state
    isError,            // Error state
    error,              // Error object
    refetch,            // Manual refetch function
    deleteQuiz,         // Delete single quiz (optimistic)
    isDeletingQuiz,     // Delete loading state
    clearAllHistory,    // Clear all history
    isClearingHistory,  // Clear loading state
  } = useQuizHistory();

  return (
    <View>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        quizHistory.map(quiz => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            onDelete={() => deleteQuiz(quiz.id)}
            deleting={isDeletingQuiz}
          />
        ))
      )}
    </View>
  );
}
```

**Features:**
- Auto-fetches from backend with local fallback
- Optimistic delete (instant UI update)
- Background refetching every 2 minutes
- Cached for 10 minutes

---

### `useUserProfile()`

Manages user profile with optimistic updates for courses and preferences.

```typescript
import { useUserProfile } from '../hooks/api/useUserProfile';

function ProfileScreen() {
  const {
    profile,             // User profile object
    isLoading,           // Loading state
    updateProfile,       // Update profile fields
    isUpdatingProfile,   // Update loading state
    addCourse,           // Add course (optimistic)
    isAddingCourse,      // Add course loading
    removeCourse,        // Remove course (optimistic)
    isRemovingCourse,    // Remove course loading
  } = useUserProfile();

  const handleUpdateGoals = (newGoals) => {
    updateProfile({ studyGoals: newGoals });
    // UI updates instantly, syncs in background
  };

  const handleAddCourse = (course) => {
    addCourse(course);
    // Course appears in UI immediately
  };

  return (
    <View>
      <Text>Goals: {profile?.studyGoals}</Text>
      <Button
        title="Update Goals"
        onPress={() => handleUpdateGoals('Pass all finals!')}
        loading={isUpdatingProfile}
      />
    </View>
  );
}
```

**Features:**
- Optimistic updates for instant UX
- Cached for 10 minutes
- Automatic local storage sync

---

### `useSaveQuiz()`

Saves quiz results with optimistic updates and background sync.

```typescript
import { useSaveQuiz } from '../hooks/api/useSaveQuiz';

function ResultsScreen({ route }) {
  const { questions, userAnswers, score } = route.params;

  const {
    saveQuiz,      // Save quiz function
    isSaving,      // Saving state
    isSuccess,     // Success state
    isError,       // Error state
  } = useSaveQuiz();

  const handleSaveQuiz = () => {
    saveQuiz({
      questions,
      userAnswers,
      score,
      totalQuestions: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      metadata: {
        title: 'Math Quiz',
        subject: 'Mathematics',
        difficulty: 'medium',
      },
    });
    // Quiz appears in history instantly
    // Syncs to backend in background
  };

  return (
    <Button
      title="Save Quiz"
      onPress={handleSaveQuiz}
      loading={isSaving}
      disabled={isSaving}
    />
  );
}
```

**Features:**
- Optimistic update (appears in history instantly)
- Background sync to backend
- Retry logic (3 attempts with exponential backoff)
- Works offline (queues for later sync)

---

## 🔄 Optimistic Updates Pattern

All mutations support optimistic updates for instant UX:

```typescript
// 1. User clicks delete
deleteQuiz(quizId);

// 2. UI updates INSTANTLY (optimistic)
// - Quiz removed from list immediately
// - User sees instant feedback

// 3. Background sync happens
// - Deletes from backend
// - Updates local storage

// 4. If sync fails, rollback
// - Quiz reappears in list
// - Error message shown
```

---

## 📡 Network-Aware Behavior

Hooks automatically handle network status:

```typescript
// ONLINE:
- Fetches from backend
- Syncs mutations to backend
- Refetches on reconnect

// OFFLINE:
- Uses local cache
- Queues mutations for later
- Shows cached data
- Automatically syncs when back online
```

---

## 🎛️ Cache Configuration

Default cache settings (configured in `config/queryClient.ts`):

```typescript
{
  staleTime: 5 * 60 * 1000,      // 5 minutes (data stays fresh)
  gcTime: 10 * 60 * 1000,        // 10 minutes (cache lifetime)
  refetchOnWindowFocus: true,     // Refetch when app focused
  refetchOnReconnect: true,       // Refetch when back online
  retry: 3,                       // Retry failed requests
  networkMode: 'online',          // Only run when online
}
```

---

## 🚀 Best Practices

### 1. Use Loading States

```typescript
const { data, isLoading, isFetching } = useQuizHistory();

// isLoading = initial fetch
// isFetching = background refetch

{isLoading && <Skeleton />}
{isFetching && <RefreshIndicator />}
{data && <Content data={data} />}
```

### 2. Handle Errors

```typescript
const { data, isError, error } = useQuizHistory();

if (isError) {
  return <ErrorMessage message={error.message} />;
}
```

### 3. Optimistic Updates for Instant UX

```typescript
// ✅ Good - Instant feedback
deleteQuiz(id);  // UI updates immediately

// ❌ Bad - Wait for server
await deleteQuizAsync(id);  // UI waits for server
```

### 4. Manual Refetch When Needed

```typescript
const { refetch } = useQuizHistory();

// Pull to refresh
<ScrollView refreshControl={
  <RefreshControl onRefresh={refetch} />
} />
```

---

## 🔍 Debugging

Enable React Query DevTools (development only):

```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  {__DEV__ && <ReactQueryDevtools />}
</QueryClientProvider>
```

---

## 📝 Migration Guide

### Before (Manual Caching)

```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchData() {
    setLoading(true);
    try {
      const result = await API.fetch();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, []);
```

### After (React Query)

```typescript
const { data, isLoading } = useQuizHistory();
// That's it! Caching, refetching, error handling all automatic
```

---

## 🎓 Learn More

- [React Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [Offline Support](https://tanstack.com/query/latest/docs/react/guides/mutations)
