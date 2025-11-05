# 📊 Monitoring Guide - Alexandria Frontend

Complete guide for Firebase Performance Monitoring and Sentry error tracking in the Alexandria mobile app.

## Overview

The app uses two monitoring systems:
1. **Firebase Performance Monitoring** - Track app performance, screen loads, and API response times
2. **Sentry** - Capture errors, crashes, and track user context for debugging

---

## 🔥 Firebase Performance Monitoring

### Configuration

Firebase Performance is configured in `utils/PerformanceMonitoring.ts` and automatically initializes with the app.

**Location**: `App.js:38`
```javascript
PerformanceMonitoring.setPerformanceCollectionEnabled(true);
```

### Usage Examples

#### 1. Track Screen Load Time

```typescript
import PerformanceMonitoring, { TraceNames } from '@utils/PerformanceMonitoring';

const HomeScreen = () => {
  useEffect(() => {
    const trace = PerformanceMonitoring.newTrace(TraceNames.SCREEN_HOME);

    const loadScreen = async () => {
      await trace.start();

      // Your screen loading logic
      await loadUserData();
      await loadQuizHistory();

      await trace.stop();
    };

    loadScreen();
  }, []);

  return <View>...</View>;
};
```

#### 2. Track Async Operations

```typescript
import PerformanceMonitoring, { TraceNames } from '@utils/PerformanceMonitoring';

const generateQuiz = async (file) => {
  return await PerformanceMonitoring.measureAsync(
    TraceNames.QUIZ_GENERATION,
    async () => {
      const response = await fetch('https://api.example.com/generate-quiz', {
        method: 'POST',
        body: file
      });
      return response.json();
    }
  );
};
```

#### 3. Track HTTP Requests

```typescript
import PerformanceMonitoring from '@utils/PerformanceMonitoring';

const fetchUserProfile = async (userId) => {
  const metric = PerformanceMonitoring.newHttpMetric(
    'https://alexandria-api.onrender.com/api/profile',
    'GET'
  );

  await metric.start();

  try {
    const response = await fetch(`https://alexandria-api.onrender.com/api/profile/${userId}`);
    const data = await response.json();

    await metric.stop(response.status, JSON.stringify(data).length);

    return data;
  } catch (error) {
    await metric.stop(0); // 0 indicates failure
    throw error;
  }
};
```

#### 4. Add Custom Metrics

```typescript
const trace = PerformanceMonitoring.newTrace('quiz_completion');
await trace.start();

// Add custom metrics
trace.putMetric('questions_answered', 10);
trace.putMetric('time_spent_seconds', 120);
trace.putAttribute('quiz_difficulty', 'hard');
trace.putAttribute('topic', 'mathematics');

await trace.stop();
```

### Predefined Trace Names

Use these constants from `TraceNames` for consistency:

```typescript
// Quiz operations
QUIZ_GENERATION: 'quiz_generation'
QUIZ_COMPLETION: 'quiz_completion'
QUIZ_LOAD: 'quiz_load'

// Screen loads
SCREEN_HOME: 'screen_home_load'
SCREEN_QUIZ: 'screen_quiz_load'
SCREEN_RESULTS: 'screen_results_load'
SCREEN_PROFILE: 'screen_profile_load'

// API calls
API_GENERATE_QUIZ: 'api_generate_quiz'
API_SAVE_RESULTS: 'api_save_results'
API_GET_PROFILE: 'api_get_profile'
API_GET_ANALYTICS: 'api_get_analytics'

// Data operations
FLASHCARD_LOAD: 'flashcard_load'
FLASHCARD_SAVE: 'flashcard_save'
ANALYTICS_CALCULATION: 'analytics_calculation'

// File operations
FILE_UPLOAD: 'file_upload'
PDF_PROCESSING: 'pdf_processing'
IMAGE_PROCESSING: 'image_processing'
```

---

## 🛡️ Sentry Error Tracking

### Configuration

Sentry is configured in `utils/SentryConfig.ts` and initializes automatically with the app.

**Location**: `App.js:37`
```javascript
initializeSentry();
```

**Features**:
- ✅ Automatic error capture
- ✅ User context tracking (logged in/out users)
- ✅ Breadcrumb tracking for debugging
- ✅ Error boundaries for crash recovery
- ✅ Sensitive data filtering (passwords, tokens, etc.)
- ✅ Development mode filtering (errors not sent in dev)

### Usage Examples

#### 1. Capture Exceptions

```typescript
import { captureException, ErrorLevels, ErrorTags } from '@utils/SentryConfig';

try {
  const result = await generateQuiz(file);
  return result;
} catch (error) {
  captureException(error, {
    tags: {
      [ErrorTags.SERVICE]: 'quiz_generation',
      screen: 'Upload',
    },
    extra: {
      fileSize: file.size,
      fileName: file.name,
      userId: user?.uid,
    },
    level: ErrorLevels.ERROR,
  });

  throw error; // Re-throw to handle in UI
}
```

#### 2. Add Breadcrumbs

```typescript
import { addBreadcrumb } from '@utils/SentryConfig';

const handleQuizStart = (quizId) => {
  addBreadcrumb(
    `User started quiz: ${quizId}`,
    'user_action',
    'info',
    { quizId, timestamp: Date.now() }
  );

  startQuiz(quizId);
};
```

#### 3. Set Custom Context

```typescript
import { setContext } from '@utils/SentryConfig';

useEffect(() => {
  if (user) {
    setContext('subscription', {
      tier: user.subscriptionTier || 'free',
      expiresAt: user.subscriptionExpiry,
      quizzesRemaining: user.quizzesRemaining,
    });
  }
}, [user]);
```

#### 4. Capture Messages (Non-Errors)

```typescript
import { captureMessage, ErrorLevels } from '@utils/SentryConfig';

const handleUnusualBehavior = () => {
  captureMessage(
    'User attempted to access premium feature without subscription',
    ErrorLevels.WARNING,
    {
      tags: { feature: 'pdf_upload', tier: 'free' },
      extra: { userId: user.uid, attemptedAt: Date.now() },
    }
  );
};
```

#### 5. Set Tags

```typescript
import { setTag, setTags } from '@utils/SentryConfig';

// Single tag
setTag('app_version', '3.3.0');

// Multiple tags
setTags({
  'user_tier': 'premium',
  'device_type': 'android',
  'app_language': 'en',
});
```

### Error Boundaries

The app is wrapped with a Sentry error boundary that catches React errors:

**Location**: `App.js:382-403`

```typescript
<SentryErrorBoundary
  fallback={({ error, resetError }) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Oops! Something went wrong</Text>
      <Text>{error?.message}</Text>
      <Button title="Try Again" onPress={resetError} />
    </View>
  )}
>
  <App />
</SentryErrorBoundary>
```

**To add error boundaries to specific screens:**

```typescript
import { ErrorBoundary } from '@utils/SentryConfig';

const QuizScreen = () => {
  return (
    <ErrorBoundary fallback={<ErrorFallbackComponent />}>
      <QuizContent />
    </ErrorBoundary>
  );
};
```

### User Context Tracking

User context is automatically set/cleared on authentication state changes:

**Location**: `App.js:76-92`

```typescript
auth.onAuthStateChanged((firebaseUser) => {
  if (firebaseUser) {
    setSentryUser({
      id: firebaseUser.uid,
      email: firebaseUser.email,
      username: firebaseUser.displayName || firebaseUser.email
    });
  } else {
    clearSentryUser();
  }
});
```

This allows you to:
- See which users are experiencing errors
- Filter errors by user attributes
- Track error patterns across user segments

---

## 📈 Monitoring Dashboard Access

### Firebase Performance

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your Alexandria project
3. Navigate to **Performance** in the left sidebar
4. View:
   - App start time
   - Screen rendering performance
   - Network request latency
   - Custom traces

### Sentry

1. Go to [Sentry Dashboard](https://sentry.io)
2. Select your Alexandria project
3. Navigate to **Issues** to see errors
4. View:
   - Error frequency and trends
   - User impact
   - Stack traces with breadcrumbs
   - User context and device info

---

## 🎯 What to Monitor

### Critical Metrics

**Performance**:
- ⚡ App start time (< 3 seconds)
- ⚡ Screen load time (< 1 second)
- ⚡ Quiz generation API response (< 10 seconds)
- ⚡ File upload time (< 5 seconds for 5MB)

**Reliability**:
- 🛡️ Crash-free rate (> 99.5%)
- 🛡️ Error rate (< 0.1% of sessions)
- 🛡️ API success rate (> 98%)

**User Experience**:
- 📱 Time to first quiz
- 📱 Quiz completion rate
- 📱 Navigation flow success rate

### Alerts to Set Up

1. **Critical Errors** - Alert when error rate > 1% in 5 minutes
2. **Performance Degradation** - Alert when API response > 15 seconds
3. **Crash Rate** - Alert when crash rate > 1% in 1 hour
4. **User Impact** - Alert when > 10 users affected by same error

---

## 🔧 Environment Variables

Add to your `.env` or `app.json`:

```json
{
  "expo": {
    "extra": {
      "sentryDsn": "https://your-sentry-dsn@sentry.io/project-id",
      "firebaseConfig": {
        "apiKey": "your-api-key",
        "authDomain": "your-project.firebaseapp.com",
        "projectId": "your-project-id"
      }
    }
  }
}
```

**Security Note**: Never commit DSN keys to version control. Use environment variables or Expo's secure storage.

---

## 🧪 Testing Monitoring

### Test Firebase Performance

```typescript
// Test trace
const trace = PerformanceMonitoring.newTrace('test_trace');
await trace.start();
await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate work
await trace.stop();

// Check Firebase Console > Performance > Custom Traces
```

### Test Sentry Error Tracking

```typescript
import { captureException } from '@utils/SentryConfig';

// Test error capture
try {
  throw new Error('Test error - ignore this!');
} catch (error) {
  captureException(error, {
    tags: { test: 'true' },
    extra: { testReason: 'Verifying Sentry integration' }
  });
}

// Check Sentry Dashboard > Issues
```

---

## 📝 Best Practices

### DO ✅

- **DO** add traces to all major user flows (quiz creation, results viewing, etc.)
- **DO** track API response times with HttpMetric
- **DO** add breadcrumbs before important operations
- **DO** set user context when available
- **DO** add meaningful tags and context to errors
- **DO** filter sensitive data (passwords, tokens, personal info)
- **DO** test monitoring in staging before production

### DON'T ❌

- **DON'T** track every single function (adds overhead)
- **DON'T** send errors in development (configured automatically)
- **DON'T** include sensitive user data in error context
- **DON'T** create too many custom traces (Firebase has limits)
- **DON'T** forget to stop traces (memory leaks!)
- **DON'T** capture expected errors (validation failures, etc.)

---

## 🚀 Quick Start Checklist

- [ ] Configure SENTRY_DSN in app.json or .env
- [ ] Verify Firebase Performance is enabled in Firebase Console
- [ ] Add traces to 3-5 key screens (Home, Upload, Quiz, Results)
- [ ] Test error capture with a throw statement
- [ ] Set up Sentry alerts for critical errors
- [ ] Monitor Firebase Performance dashboard for baseline metrics
- [ ] Add HttpMetric to API calls
- [ ] Document any custom traces for team

---

## 📚 Additional Resources

- [Firebase Performance Docs](https://firebase.google.com/docs/perf-mon)
- [Sentry React Native Docs](https://docs.sentry.io/platforms/react-native/)
- [Alexandria Monitoring Architecture](./FINAL_PROGRESS_SUMMARY.md)

---

**Last Updated**: 2025-09-30
**Status**: ✅ Production Ready
**Coverage**: Firebase Performance + Sentry Error Tracking
