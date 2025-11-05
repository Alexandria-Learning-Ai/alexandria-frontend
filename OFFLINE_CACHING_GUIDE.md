# Offline Caching Architecture

## Overview

Alexandria uses a **unified offline caching approach** that combines React Query with OfflineManager to provide seamless offline functionality across the app.

## Architecture

### Key Components

1. **OfflineManager** (`utils/OfflineManager.js`)
   - Core offline management system
   - Handles cache persistence to AsyncStorage
   - Manages offline action queue
   - Monitors network status

2. **React Query** (`config/queryClient.ts`)
   - Data fetching and caching layer
   - Optimistic updates
   - Automatic background refetching
   - Mutation management

3. **Integration Layer**
   - Query cache subscriber → Persists to OfflineManager
   - Mutation cache subscriber → Queues failed actions when offline
   - Network listener → Syncs when connection restored

## How It Works

### Data Flow

```
┌─────────────────┐
│   Component     │
│   (uses hook)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  React Query    │◄──────┐
│  Hook (useXXX)  │       │
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│  Query Client   │       │
│  (Cache Layer)  │       │
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│ OfflineManager  │       │
│  (Persistence)  │───────┘
└─────────────────┘
      │
      ▼
┌─────────────────┐
│  AsyncStorage   │
└─────────────────┘
```

### Cache Persistence

React Query's cache is automatically persisted to OfflineManager:

```typescript
// In queryClient.ts
queryClient.getQueryCache().subscribe((event) => {
  if (event?.type === 'updated' && event?.query?.state?.data) {
    const queryKey = event.query.queryKey;
    const data = event.query.state.data;
    const cacheKey = getOfflineManagerKey(queryKey);

    // Automatically save to OfflineManager
    OfflineManager.cacheData(cacheKey, data);
  }
});
```

### Cache Hydration

On app startup, React Query cache is hydrated from OfflineManager:

```typescript
export const hydrateQueryCache = async () => {
  // Load user profile
  const userProfile = await OfflineManager.getCachedData(
    OfflineManager.CACHE_KEYS.USER_PROFILE
  );
  if (userProfile) {
    queryClient.setQueryData(queryKeys.user.profile, userProfile);
  }

  // Load quiz history
  const quizHistory = await OfflineManager.getCachedData(
    OfflineManager.CACHE_KEYS.QUIZ_HISTORY
  );
  if (quizHistory) {
    queryClient.setQueryData(queryKeys.quiz.history, quizHistory);
  }
};
```

### Offline Queue

Failed mutations are automatically queued when offline:

```typescript
// In queryClient.ts - Mutation cache subscriber
queryClient.getMutationCache().subscribe((event) => {
  if (event?.type === 'updated' && mutation.state.status === 'error') {
    if (!OfflineManager.isOnline) {
      // Queue the failed mutation
      OfflineManager.queueOfflineAction({
        type: 'QUIZ_COMPLETED', // or other action types
        data: variables,
        mutationKey,
      });
    }
  }
});
```

## Usage in Hooks

### Query Hooks

Use OfflineManager's `getDataWithFallback` for unified offline handling:

```typescript
// Example: useQuizHistory
const fetchFromBackend = async () => {
  const response = await BackendSyncService.getQuizHistory(...);
  return response?.history || null;
};

const { data, source } = await OfflineManager.getDataWithFallback(
  OfflineManager.CACHE_KEYS.QUIZ_HISTORY,
  fetchFromBackend
);
```

**Benefits:**
- Automatically tries network first when online
- Falls back to cache when offline or network fails
- Returns data source ('network', 'cache', 'none')

### Mutation Hooks

Add mutation keys and queue offline actions:

```typescript
// Example: useSaveQuiz
const saveQuizMutation = useMutation({
  mutationKey: ['saveQuiz'], // ✅ Important for tracking
  mutationFn: async (quizData) => {
    // Queue for offline sync if offline
    if (!OfflineManager.isOnline) {
      await OfflineManager.queueOfflineAction({
        type: 'QUIZ_COMPLETED',
        data: formattedQuiz,
      });
    }

    // Cache using OfflineManager
    await OfflineManager.cacheData(
      OfflineManager.CACHE_KEYS.QUIZ_HISTORY,
      updatedHistory
    );

    return formattedQuiz;
  },
  // ... optimistic updates
});
```

## Network Handling

### Network Status Monitoring

```typescript
// Initialize in App.tsx or root component
await setupNetworkMonitoring();
```

This will:
1. Initialize OfflineManager
2. Hydrate React Query cache from OfflineManager
3. Set up network listeners
4. Process offline queue when connection restored

### Connection Restoration

When the device comes back online:
1. React Query resumes paused mutations
2. React Query refetches active queries
3. OfflineManager processes queued offline actions

## Cache Keys

OfflineManager uses predefined cache keys for consistency:

```javascript
OfflineManager.CACHE_KEYS = {
  USER_PROFILE: 'cached_user_profile',
  QUIZ_HISTORY: 'cached_quiz_history',
  FLASHCARDS: 'cached_flashcards',
  EXAM_SCHEDULE: 'cached_exam_schedule',
  APP_CONFIG: 'cached_app_config',
  OFFLINE_ACTIONS: 'offline_actions_queue',
  LAST_SYNC: 'last_sync_timestamp',
  NETWORK_STATUS: 'network_status'
};
```

## Best Practices

### ✅ DO

1. **Always use mutation keys** for proper tracking
   ```typescript
   useMutation({
     mutationKey: ['saveQuiz'],
     // ...
   });
   ```

2. **Use OfflineManager for all caching**
   ```typescript
   await OfflineManager.cacheData(key, data);
   const data = await OfflineManager.getCachedData(key);
   ```

3. **Queue offline actions in mutations**
   ```typescript
   if (!OfflineManager.isOnline) {
     await OfflineManager.queueOfflineAction({
       type: 'ACTION_TYPE',
       data: actionData,
     });
   }
   ```

4. **Use getDataWithFallback for queries**
   ```typescript
   const { data, source } = await OfflineManager.getDataWithFallback(
     cacheKey,
     fetchFunction
   );
   ```

### ❌ DON'T

1. **Don't use AsyncStorage directly** - Use OfflineManager instead
   ```typescript
   // ❌ Bad
   await AsyncStorage.setItem('key', JSON.stringify(data));

   // ✅ Good
   await OfflineManager.cacheData(key, data);
   ```

2. **Don't create custom caching logic** - Use the unified system
   ```typescript
   // ❌ Bad - Custom caching
   const cache = new Map();
   cache.set(key, value);

   // ✅ Good - Use OfflineManager
   await OfflineManager.cacheData(key, value);
   ```

3. **Don't skip mutation keys** - They're needed for tracking
   ```typescript
   // ❌ Bad
   useMutation({ mutationFn: ... });

   // ✅ Good
   useMutation({
     mutationKey: ['actionName'],
     mutationFn: ...
   });
   ```

## Debugging

### Check Cache Status

```typescript
// Get cache statistics
const stats = await OfflineManager.getCacheStats();
console.log('Cache stats:', stats);
// {
//   totalCacheEntries: 5,
//   validEntries: 4,
//   expiredEntries: 1,
//   totalSize: 12450
// }
```

### Check Offline Queue

```typescript
// View queued actions
const queue = OfflineManager.offlineQueue;
console.log('Queued actions:', queue);
```

### Network Status

```typescript
// Check if online
const isOnline = OfflineManager.isOnline;

// Get detailed network status
const status = await OfflineManager.getNetworkStatus();
console.log('Network status:', status);
```

### Clear Cache

```typescript
// Clear specific cache
await OfflineManager.clearCache(OfflineManager.CACHE_KEYS.QUIZ_HISTORY);

// Clear all cache
await OfflineManager.clearAllCache();

// Clean up expired entries
await OfflineManager.cleanupExpiredCache();
```

## Migration from Old Approach

If you have existing code using AsyncStorage directly:

### Before (Old Approach)
```typescript
// Query
const data = await AsyncStorage.getItem('key');
const parsed = data ? JSON.parse(data) : null;

// Save
await AsyncStorage.setItem('key', JSON.stringify(value));
```

### After (New Unified Approach)
```typescript
// Query
const data = await OfflineManager.getCachedData(key);

// Save
await OfflineManager.cacheData(key, value);
```

## Cache Expiry

OfflineManager automatically handles cache expiry:

```javascript
CACHE_EXPIRY = {
  USER_PROFILE: 24 * 60 * 60 * 1000,    // 24 hours
  QUIZ_HISTORY: 7 * 24 * 60 * 60 * 1000, // 7 days
  FLASHCARDS: 24 * 60 * 60 * 1000,      // 24 hours
  EXAM_SCHEDULE: 12 * 60 * 60 * 1000,   // 12 hours
};
```

Custom expiry can be set:
```typescript
await OfflineManager.cacheData(key, data, 30 * 60 * 1000); // 30 minutes
```

## Integration Checklist

When creating a new feature with offline support:

- [ ] Use React Query hooks (`useQuery` / `useMutation`)
- [ ] Add mutation key to all mutations
- [ ] Use `OfflineManager.cacheData()` for caching
- [ ] Use `OfflineManager.getDataWithFallback()` for queries
- [ ] Queue offline actions with `OfflineManager.queueOfflineAction()`
- [ ] Implement optimistic updates in mutations
- [ ] Test offline behavior
- [ ] Test online → offline → online transitions

## Summary

The unified offline caching approach provides:

✅ **Automatic cache persistence** - React Query cache automatically saves to OfflineManager
✅ **Offline queue** - Failed mutations queued and retried when online
✅ **Cache hydration** - Instant data on app startup from persisted cache
✅ **Network awareness** - Automatic behavior based on connection status
✅ **Optimistic updates** - Immediate UI feedback with rollback on errors
✅ **Single source of truth** - OfflineManager handles all persistence

No more duplicate caching logic across hooks! 🎉
