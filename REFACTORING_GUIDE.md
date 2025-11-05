# 🔨 Refactoring Guide - Alexandria App

## Overview

This guide tracks the refactoring of large screen files into smaller, maintainable components.

**Started**: 2025-09-30
**Goal**: Break down 4,000+ line files into modular, testable components
**Target File Size**: < 300 lines per file

---

## 📊 Refactoring Progress

### ResultsScreen.js (4,093 lines → Target: ~500 lines)

**Status**: 🟡 **IN PROGRESS** (1/8 components extracted)

| Component | Lines | Status | Location |
|-----------|-------|--------|----------|
| ScoreCard | ~250 | ✅ Complete | `components/results/ScoreCard.js` |
| QuestionResultsList | ~400 | ⏳ Pending | `components/results/QuestionResultsList.js` |
| QuestionResultItem | ~200 | ⏳ Pending | `components/results/QuestionResultItem.js` |
| PerformanceChart | ~150 | ⏳ Pending | `components/results/PerformanceChart.js` |
| WeaknessAnalysisSection | ~300 | ⏳ Pending | `components/results/WeaknessAnalysisSection.js` |
| CoachFeedbackSection | ~200 | ⏳ Pending | `components/results/CoachFeedbackSection.js` |
| AnalyticsSection | ~500 | ⏳ Pending | `components/results/AnalyticsSection.js` |
| SubjectCorrectionModal | ~200 | ⏳ Pending | `components/results/SubjectCorrectionModal.js` |

**Extracted Components**: 1/8 (12.5%)
**Remaining Work**: ~2,800 lines to extract

---

### QuizScreen.js (2,309 lines → Target: ~400 lines)

**Status**: ⏳ **NOT STARTED**

| Component | Lines | Status | Location |
|-----------|-------|--------|----------|
| QuizHeader | ~100 | ⏳ Pending | `components/quiz/QuizHeader.js` |
| ProgressBar | ~80 | ⏳ Pending | `components/quiz/ProgressBar.js` |
| QuestionDisplay | ~200 | ⏳ Pending | `components/quiz/QuestionDisplay.js` |
| AnswerOptions | ~300 | ⏳ Pending | `components/quiz/AnswerOptions.js` |
| NavigationControls | ~150 | ⏳ Pending | `components/quiz/NavigationControls.js` |
| TimerDisplay | ~100 | ⏳ Pending | `components/quiz/TimerDisplay.js` |

**Extracted Components**: 0/6 (0%)

---

### HomeScreen.js (2,304 lines → Target: ~400 lines)

**Status**: ⏳ **NOT STARTED**

| Component | Lines | Status | Location |
|-----------|-------|--------|----------|
| HomeHeader | ~150 | ⏳ Pending | `components/home/HomeHeader.js` |
| QuickActions | ~200 | ⏳ Pending | `components/home/QuickActions.js` |
| StatsOverview | ~250 | ⏳ Pending | `components/home/StatsOverview.js` |
| RecentQuizzes | ~300 | ⏳ Pending | `components/home/RecentQuizzes.js` |
| StudyRecommendations | ~250 | ⏳ Pending | `components/home/StudyRecommendations.js` |
| ExamCountdown | ~150 | ⏳ Pending | `components/home/ExamCountdown.js` |
| AchievementBadges | ~200 | ⏳ Pending | `components/home/AchievementBadges.js` |

**Extracted Components**: 0/7 (0%)

---

### AppNavigator.js (1,458 lines → Target: ~300 lines)

**Status**: ⏳ **NOT STARTED**

| File | Lines | Status | Location |
|------|-------|--------|----------|
| AuthNavigator | ~200 | ⏳ Pending | `navigation/AuthNavigator.js` |
| MainNavigator | ~250 | ⏳ Pending | `navigation/MainNavigator.js` |
| ProfileNavigator | ~150 | ⏳ Pending | `navigation/ProfileNavigator.js` |
| navigationConfig | ~100 | ⏳ Pending | `navigation/navigationConfig.js` |
| DeepLinkingConfig | ~150 | ⏳ Pending | `navigation/DeepLinkingConfig.js` |

**Extracted Components**: 0/5 (0%)

---

## ✅ Completed Components

### 1. ScoreCard (ResultsScreen.js)

**File**: `components/results/ScoreCard.js`
**Lines**: 250 (extracted from 4,093-line file)
**Test**: `__tests__/components/results/ScoreCard.test.js`

**Features**:
- Displays quiz score with animated percentage
- Performance badge with color-coded levels
- Progress bar with gradient colors
- Correct/incorrect stats
- Motivational messages
- Analytics summary
- Dark mode support

**Props**:
```javascript
{
  score: number,
  totalQuestions: number,
  percentage: number,
  animatedPercentageValue: string | number,
  performance: { level, emoji, color },
  correctCount: number,
  incorrectCount: number,
  metadata: { updatedStats },
  currentThemeStyles: object,
  isDarkMode: boolean
}
```

**Test Coverage**: 9 test cases
- ✅ Renders correctly with all props
- ✅ Displays motivational messages (excellent/good/poor)
- ✅ Shows analytics when available
- ✅ Handles edge cases (zero score, perfect score)
- ✅ Dark mode styling

**Integration Steps**:
1. Import component in ResultsScreen.js
2. Replace inline ScoreCard JSX with component
3. Pass required props
4. Remove old ScoreCard definition
5. Test thoroughly

---

## 📋 Refactoring Checklist

### For Each Component Extraction

- [ ] **Plan**
  - [ ] Identify component boundaries
  - [ ] List all props needed
  - [ ] Identify dependencies (utilities, styles)

- [ ] **Extract**
  - [ ] Create new component file
  - [ ] Copy JSX and logic
  - [ ] Define PropTypes
  - [ ] Add default props
  - [ ] Extract related styles
  - [ ] Extract helper functions

- [ ] **Test**
  - [ ] Create test file
  - [ ] Write unit tests
  - [ ] Test edge cases
  - [ ] Aim for >80% coverage

- [ ] **Integrate**
  - [ ] Import in parent file
  - [ ] Replace old JSX with component
  - [ ] Pass props correctly
  - [ ] Remove old code
  - [ ] Test in app

- [ ] **Document**
  - [ ] Add JSDoc comments
  - [ ] Document props
  - [ ] Add usage examples
  - [ ] Update this guide

---

## 🎯 Refactoring Principles

### 1. Single Responsibility
Each component should do ONE thing well.

✅ **Good**:
```javascript
// ScoreCard.js - Only displays score information
const ScoreCard = ({ score, totalQuestions, percentage }) => { ... };
```

❌ **Bad**:
```javascript
// ResultsScreen.js - Does everything
const ResultsScreen = () => {
  // Displays score
  // Generates explanations
  // Handles navigation
  // Manages state
  // ... 4000+ lines
};
```

### 2. Props Over State
Pass data down, not manage it everywhere.

✅ **Good**:
```javascript
<ScoreCard score={score} percentage={percentage} />
```

❌ **Bad**:
```javascript
// Component fetches its own data
const ScoreCard = () => {
  const [score, setScore] = useState();
  useEffect(() => { fetchScore(); }, []);
};
```

### 3. Reusability
Design components to be reused.

✅ **Good**:
```javascript
// Can use anywhere with different themes
<ScoreCard isDarkMode={isDarkMode} currentThemeStyles={theme} />
```

### 4. Testability
Make components easy to test.

✅ **Good**:
```javascript
// Pure component, easy to test
const ScoreCard = (props) => { ... };

// Test
render(<ScoreCard score={8} totalQuestions={10} />);
```

### 5. Keep Styles Separate
Co-locate styles with components.

✅ **Good**:
```javascript
// ScoreCard.js
const styles = StyleSheet.create({ ... });
export default ScoreCard;
```

---

## 🔄 Integration Pattern

### Before (ResultsScreen.js)
```javascript
const ResultsScreen = ({ route, navigation }) => {
  // 4000+ lines of code

  const ScoreCard = () => (
    <View>
      {/* 250 lines of score display */}
    </View>
  );

  return (
    <ScrollView>
      <ScoreCard />
      {/* More components... */}
    </ScrollView>
  );
};
```

### After (ResultsScreen.js)
```javascript
import ScoreCard from '../components/results/ScoreCard';

const ResultsScreen = ({ route, navigation }) => {
  // Much cleaner, ~500 lines

  return (
    <ScrollView>
      <ScoreCard
        score={score}
        totalQuestions={totalQuestions}
        percentage={percentage}
        {...otherProps}
      />
      {/* More components... */}
    </ScrollView>
  );
};
```

---

## 📈 Benefits of Refactoring

### Code Maintainability
- ✅ Easier to find and fix bugs
- ✅ Clearer code organization
- ✅ Faster development

### Testing
- ✅ Components can be tested in isolation
- ✅ Higher test coverage possible
- ✅ Easier to mock dependencies

### Performance
- ✅ Components can be memoized independently
- ✅ Smaller bundle sizes for code splitting
- ✅ Faster re-renders

### Collaboration
- ✅ Multiple developers can work on different components
- ✅ Easier code reviews
- ✅ Clearer git history

### Reusability
- ✅ Components can be used in other screens
- ✅ Easier to build design system
- ✅ Consistent UI across app

---

## 🚀 Next Steps

### Immediate (Next Component)
1. Extract **QuestionResultsList** from ResultsScreen.js
   - ~400 lines
   - Displays list of answered questions
   - Includes correct/incorrect indicators

### This Session
2. Extract **PerformanceChart** (~150 lines)
3. Extract **WeaknessAnalysisSection** (~300 lines)
4. Create integration tests

### Next Session
5. Continue with remaining ResultsScreen components
6. Start QuizScreen.js refactoring
7. Add Storybook for component showcase

---

## 📊 Overall Progress

| Screen | Original Lines | Target Lines | Extracted | Progress |
|--------|---------------|--------------|-----------|----------|
| ResultsScreen.js | 4,093 | 500 | 1/8 | 12.5% |
| QuizScreen.js | 2,309 | 400 | 0/6 | 0% |
| HomeScreen.js | 2,304 | 400 | 0/7 | 0% |
| AppNavigator.js | 1,458 | 300 | 0/5 | 0% |
| **Total** | **10,164** | **1,600** | **1/26** | **3.8%** |

**Total Reduction Target**: 10,164 → 1,600 lines (84% reduction)
**Components to Extract**: 26 total
**Completed**: 1 component
**Remaining**: 25 components

---

## 💡 Tips & Best Practices

### Naming Conventions
- Use descriptive names: `ScoreCard`, not `Card1`
- Suffix with purpose: `Section`, `Modal`, `List`, `Item`
- Be consistent across the app

### File Structure
```
components/
├── results/
│   ├── ScoreCard.js
│   ├── QuestionResultsList.js
│   └── ... (related components)
├── quiz/
│   ├── QuizHeader.js
│   └── ... (quiz components)
└── home/
    ├── HomeHeader.js
    └── ... (home components)
```

### Import Organization
```javascript
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. React Native imports
import { View, Text, StyleSheet } from 'react-native';

// 3. Third-party libraries
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';

// 4. Local components
import ScoreCard from '../components/results/ScoreCard';

// 5. Services and utilities
import { formatScore } from '../utils/helpers';

// 6. Styles (if separate file)
import styles from './ResultsScreen.styles';
```

### PropTypes Documentation
Always document your props:
```javascript
Component.propTypes = {
  /**
   * User's score out of total questions
   */
  score: PropTypes.number.isRequired,

  /**
   * Total number of questions in quiz
   */
  totalQuestions: PropTypes.number.isRequired,

  /**
   * Optional theme styles object
   */
  themeStyles: PropTypes.object,
};
```

---

**Last Updated**: 2025-09-30
**Status**: ✅ Started - First component extracted and tested
**Estimated Completion**: 20-25 hours remaining
