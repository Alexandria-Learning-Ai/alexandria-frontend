# Testing Guide - Alexandria App

## Overview

The Alexandria app uses **Jest** and **React Native Testing Library** for comprehensive unit and integration testing.

## Setup

### Install Dependencies

```bash
npm install
```

All testing dependencies are already configured in `package.json`:
- `jest` - Test runner
- `jest-expo` - Expo-specific Jest preset
- `@testing-library/react-native` - React Native testing utilities
- `@testing-library/jest-native` - Additional matchers for React Native
- `react-test-renderer` - Required for React Native testing

### Configuration Files

- **`jest.config.js`** - Jest configuration
- **`jest.setup.js`** - Test setup and mocks
- **`__tests__/`** - Test files directory

## Running Tests

### Run All Tests

```bash
npm test
```

### Watch Mode (Re-run on Changes)

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

This generates a coverage report in `coverage/` directory.

## Writing Tests

### Test File Structure

Place test files in `__tests__/` directory, matching the source structure:

```
alexandria-app/
├── components/
│   └── SubjectSelector.js
├── services/
│   └── FlashcardService.js
├── utils/
│   └── FormValidator.js
└── __tests__/
    ├── components/
    │   └── SubjectSelector.test.js
    ├── services/
    │   └── FlashcardService.test.js
    └── utils/
        └── FormValidator.test.js
```

### Component Testing Example

```javascript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MyComponent from '../../components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('handles button press', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<MyComponent onPress={mockOnPress} />);

    const button = getByText('Press Me');
    fireEvent.press(button);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('handles async operations', async () => {
    const { getByText } = render(<MyComponent />);

    fireEvent.press(getByText('Load Data'));

    await waitFor(() => {
      expect(getByText('Data Loaded')).toBeTruthy();
    });
  });
});
```

### Service Testing Example

```javascript
import MyService from '../../services/MyService';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('MyService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('saves data correctly', async () => {
    await MyService.saveData('test-user', { value: 'test' });

    const saved = await AsyncStorage.getItem('myService_test-user');
    expect(saved).toBeDefined();
    expect(JSON.parse(saved).value).toBe('test');
  });
});
```

### Utility/Function Testing Example

```javascript
import { formatDate, validateEmail } from '../../utils/helpers';

describe('Helpers', () => {
  describe('formatDate', () => {
    it('formats dates correctly', () => {
      const date = new Date('2025-01-15');
      expect(formatDate(date)).toBe('January 15, 2025');
    });
  });

  describe('validateEmail', () => {
    it('validates correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
    });
  });
});
```

## Available Mocks

### Pre-configured Mocks (in `jest.setup.js`)

1. **AsyncStorage** - Mocked for data persistence testing
2. **Firebase** - Mock auth and database
3. **React Navigation** - Mock navigation hooks
4. **Expo Notifications** - Mock notification permissions and scheduling
5. **Expo File System** - Mock file operations
6. **Expo Document Picker** - Mock document selection
7. **i18next** - Mock translations
8. **React Native Purchases** - Mock subscription functionality

### Using Mocks in Tests

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebaseConfig';

test('saves to AsyncStorage', async () => {
  await AsyncStorage.setItem('key', 'value');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('key', 'value');

  const value = await AsyncStorage.getItem('key');
  expect(value).toBe('value');
});

test('gets current user', () => {
  expect(auth.currentUser.uid).toBe('test-user-id');
  expect(auth.currentUser.email).toBe('test@example.com');
});
```

## Testing Best Practices

### 1. Follow AAA Pattern

**Arrange, Act, Assert**

```javascript
it('adds two numbers', () => {
  // Arrange
  const a = 2;
  const b = 3;

  // Act
  const result = add(a, b);

  // Assert
  expect(result).toBe(5);
});
```

### 2. Test User Behavior, Not Implementation

✅ **Good:**
```javascript
it('displays error message when form is invalid', () => {
  const { getByText, getByPlaceholderText } = render(<LoginForm />);

  fireEvent.changeText(getByPlaceholderText('Email'), 'invalid');
  fireEvent.press(getByText('Submit'));

  expect(getByText('Invalid email')).toBeTruthy();
});
```

❌ **Bad:**
```javascript
it('sets isValid state to false', () => {
  const wrapper = shallow(<LoginForm />);
  wrapper.instance().setState({ email: 'invalid' });
  expect(wrapper.state('isValid')).toBe(false);
});
```

### 3. Use Descriptive Test Names

✅ **Good:**
```javascript
describe('FlashcardService', () => {
  describe('saveFlashcard', () => {
    it('saves a new flashcard successfully', () => {});
    it('throws error when userId is missing', () => {});
    it('throws error when flashcard data is invalid', () => {});
  });
});
```

❌ **Bad:**
```javascript
describe('FlashcardService', () => {
  it('test 1', () => {});
  it('test 2', () => {});
  it('works', () => {});
});
```

### 4. Clean Up After Each Test

```javascript
describe('MyService', () => {
  beforeEach(async () => {
    // Clean up before each test
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test if needed
    jest.restoreAllMocks();
  });
});
```

### 5. Test Edge Cases

```javascript
describe('calculateScore', () => {
  it('calculates score for normal input', () => {
    expect(calculateScore(8, 10)).toBe(80);
  });

  it('handles zero total questions', () => {
    expect(calculateScore(0, 0)).toBe(0);
  });

  it('handles negative numbers', () => {
    expect(calculateScore(-1, 10)).toBe(0);
  });

  it('handles more correct than total', () => {
    expect(calculateScore(15, 10)).toBe(100);
  });
});
```

## Debugging Tests

### Run Single Test File

```bash
npm test -- SubjectSelector.test.js
```

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="validates email"
```

### Enable Verbose Output

```bash
npm test -- --verbose
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Coverage Goals

Target coverage thresholds:

- **Statements**: 70%+
- **Branches**: 65%+
- **Functions**: 70%+
- **Lines**: 70%+

### View Coverage Report

After running `npm run test:coverage`, open:
```
coverage/lcov-report/index.html
```

## Common Testing Patterns

### Testing Async Functions

```javascript
it('loads data asynchronously', async () => {
  const { getByText } = render(<MyComponent />);

  await waitFor(() => {
    expect(getByText('Data Loaded')).toBeTruthy();
  });
});
```

### Testing Navigation

```javascript
import { useNavigation } from '@react-navigation/native';

it('navigates to detail screen on press', () => {
  const navigate = jest.fn();
  useNavigation.mockReturnValue({ navigate });

  const { getByText } = render(<MyScreen />);

  fireEvent.press(getByText('View Details'));

  expect(navigate).toHaveBeenCalledWith('Details', { id: 123 });
});
```

### Testing API Calls

```javascript
import axios from 'axios';

jest.mock('axios');

it('fetches quiz data from API', async () => {
  const mockData = { quiz: { id: 1, questions: [] } };
  axios.post.mockResolvedValue({ data: mockData });

  const result = await QuizService.generateQuiz('Math');

  expect(axios.post).toHaveBeenCalledWith(
    expect.stringContaining('/generate-quiz'),
    expect.objectContaining({ subject: 'Math' })
  );
  expect(result).toEqual(mockData);
});
```

### Testing Error Handling

```javascript
it('displays error message when API fails', async () => {
  axios.post.mockRejectedValue(new Error('Network error'));

  const { getByText } = render(<MyComponent />);

  await waitFor(() => {
    expect(getByText(/error/i)).toBeTruthy();
  });
});
```

## Continuous Integration

To integrate with CI/CD:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
        with:
          files: ./coverage/lcov.info
```

## Next Steps

1. **Add more test coverage**
   - Aim for 70%+ code coverage
   - Focus on critical paths first

2. **Integration tests**
   - Test complete user flows
   - Test API integration

3. **E2E tests**
   - Consider Detox or Appium for full app testing

4. **Visual regression testing**
   - Consider tools like Percy or Chromatic

---

**Testing Status**: ✅ Infrastructure complete, initial tests added
**Coverage Goal**: 70%+
**Current Coverage**: Run `npm run test:coverage` to check
