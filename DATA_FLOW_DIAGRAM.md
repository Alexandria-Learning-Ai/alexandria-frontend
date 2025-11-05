# Data Flow & Backend Architecture

## Where Does The Data Go?

All synced data goes to your **Render.com backend server**:

```
🌐 Backend API URL: https://alexandria-api-ywcw.onrender.com
```

Configured in: `config/api.js`

## Complete Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     MOBILE APP                              │
│                   (React Native)                            │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Firebase Auth Token
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  REACT QUERY LAYER                          │
│  - useQuizHistory, useSaveQuiz, useUserProfile              │
│  - Optimistic updates                                        │
│  - Cache management                                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  OFFLINEMANAGER                             │
│  - Queues offline actions                                   │
│  - AsyncStorage persistence                                 │
│  - Retry logic (5x)                                         │
│  - Cache with expiry                                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKENDSYNCSERVICE                             │
│  - syncQuizCompletion()                                     │
│  - updateUserProfile()                                      │
│  - updateFlashcardProgress()                                │
│  - updateExamSchedule()                                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS + Bearer Token
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              RENDER.COM BACKEND                             │
│     https://alexandria-api-ywcw.onrender.com                │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │         FASTAPI APPLICATION                  │          │
│  │  - Python/FastAPI backend                    │          │
│  │  - JWT token validation (Firebase)           │          │
│  │  - Business logic                            │          │
│  └──────────────────────────────────────────────┘          │
│                      ▼                                      │
│  ┌──────────────────────────────────────────────┐          │
│  │         POSTGRESQL DATABASE                  │          │
│  │  - User profiles                             │          │
│  │  - Quiz history                              │          │
│  │  - Progress tracking                         │          │
│  │  - Learning analytics                        │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints Used

### 1. Quiz History
**POST** `/api/quiz-history/save`
```json
{
  "quiz_id": "quiz_123",
  "subject_key": "mathematics",
  "topic": "Calculus",
  "difficulty": "medium",
  "questions_total": 10,
  "questions_correct": 8,
  "accuracy": 80,
  "time_taken": 300
}
```
**Stored in**: `quiz_completions` table

---

### 2. Progress Update
**POST** `/api/progress/update`
```json
{
  "quiz_completed": true,
  "questions_answered": 10,
  "questions_correct": 8,
  "study_time_seconds": 300,
  "subject": "mathematics",
  "difficulty": "medium"
}
```
**Stored in**: `user_learning_profiles` table

---

### 3. User Profile
**PUT** `/api/profile/{user_id}`
```json
{
  "name": "John Doe",
  "education_level": "undergraduate",
  "year": "sophomore",
  "program": "Computer Science",
  "courses": [...],
  "learning_styles": ["visual"],
  "pain_points": ["time_management"]
}
```
**Stored in**: `student_profiles` table

---

### 4. Flashcard Progress
**POST** `/api/progress/update`
```json
{
  "quiz_completed": false,
  "questions_answered": 20,
  "questions_correct": 15,
  "study_time_seconds": 600,
  "subject": "flashcards",
  "session_data": {
    "flashcard_set_id": "set_123",
    "session_type": "flashcard_review"
  }
}
```
**Stored in**: `user_learning_profiles` table (session_data field)

---

### 5. Exam Schedule
**PUT** `/api/profile/{user_id}`
```json
{
  "notes": "{\"type\":\"exam_schedule\",\"exam\":{...}}"
}
```
**Stored in**: `student_profiles` table (notes field)

## Authentication Flow

```
User Action
    ↓
Firebase Auth (currentUser)
    ↓
Get ID Token: await user.getIdToken()
    ↓
Add to Headers: Authorization: Bearer <token>
    ↓
Send to Backend
    ↓
Backend Validates Token with Firebase
    ↓
Extract user_id from token
    ↓
Process Request
```

## Database Tables on Render Backend

### Main Tables

1. **`student_profiles`**
   - User demographic info
   - Courses
   - Learning preferences
   - Study goals

2. **`quiz_completions`**
   - Quiz results
   - Performance metrics
   - Question details
   - Timestamps

3. **`user_learning_profiles`**
   - Progress tracking
   - Streaks
   - Subject accuracies
   - Study time
   - Achievement points

4. **`user_achievements`**
   - Earned achievements
   - Points
   - Badges

5. **`learning_insight_records`**
   - AI-generated insights
   - Recommendations
   - Analytics

## Data Persistence Strategy

### Layer 1: Local (Instant)
**AsyncStorage** (via OfflineManager)
- Immediate cache
- Survives app restarts
- Works offline
- Cache expiry (7 days for quiz history, 24h for profile)

### Layer 2: React Query Cache (Fast)
**In-Memory Cache**
- Fast access (no disk I/O)
- Auto-hydrated from OfflineManager on startup
- Automatic background refetch
- Optimistic updates

### Layer 3: Backend (Authoritative)
**Render PostgreSQL**
- Source of truth
- Persistent across devices
- Analytics and insights
- Backup and recovery

## Offline → Online Sync Process

```
1. User completes quiz OFFLINE
   └─> Saved to AsyncStorage immediately
   └─> Added to offline_actions_queue

2. User goes ONLINE
   └─> Network listener detects connection
   └─> OfflineManager.processOfflineQueue()

3. Process Queue
   └─> For each queued action:
       ├─> syncQuizCompletion(data)
       ├─> BackendSyncService.syncQuizCompletion()
       ├─> POST to https://alexandria-api-ywcw.onrender.com/api/quiz-history/save
       └─> If success: Remove from queue
       └─> If fail: Retry (up to 5 times)

4. Backend Processing
   └─> Validate Firebase token
   └─> Save to PostgreSQL
   └─> Update learning profile
   └─> Generate insights
   └─> Return success

5. Update React Query Cache
   └─> Refresh quiz history
   └─> Update UI
```

## Configuration Options

### Change Backend URL

**Option 1**: Environment Variable (app.json)
```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "https://your-new-backend.com"
    }
  }
}
```

**Option 2**: Direct Change (config/api.js)
```javascript
export const API_BASE_URL = 'https://your-new-backend.com';
```

### Development vs Production

You can use different URLs for different environments:

```javascript
// config/api.js
const DEV_API = 'http://localhost:8000';
const PROD_API = 'https://alexandria-api-ywcw.onrender.com';

export const API_BASE_URL = __DEV__ ? DEV_API : PROD_API;
```

## Data Security

### In Transit
- ✅ HTTPS encryption
- ✅ Bearer token authentication
- ✅ Firebase token validation

### At Rest
- ✅ AsyncStorage (encrypted on iOS, keychain)
- ✅ PostgreSQL (Render's managed database)
- ✅ Firebase Auth (secure token storage)

### Access Control
- ✅ User can only access their own data
- ✅ Token required for all requests
- ✅ User ID extracted from verified token
- ✅ No direct database access from app

## Monitoring & Logs

### App-Side Logging
```javascript
logger.info('📊 Quiz synced to backend');
logger.error('❌ Sync failed:', error);
```

### Backend-Side Logging
- FastAPI request logs
- Database query logs
- Error tracking
- Performance metrics

## Summary

**Current Setup:**
- 📱 App: React Native (Expo)
- 🔄 Sync: OfflineManager + React Query
- 🌐 Backend: Render.com (https://alexandria-api-ywcw.onrender.com)
- 🗄️ Database: PostgreSQL (managed by Render)
- 🔐 Auth: Firebase Authentication

**Data Destinations:**
1. **Immediate**: AsyncStorage (local device)
2. **Fast**: React Query cache (in-memory)
3. **Permanent**: Render PostgreSQL (cloud)

All data is encrypted in transit (HTTPS) and authenticated via Firebase tokens! 🔒
