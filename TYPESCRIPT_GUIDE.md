# 📘 TypeScript Migration Guide - Alexandria App

## Overview

TypeScript has been successfully configured for the Alexandria app. This guide covers everything you need to know to work with TypeScript in the project.

**Status**: ✅ **CONFIGURED** - Ready for development
**Date Configured**: 2025-09-30
**TypeScript Version**: 5.9.2

---

## ✅ What's Been Set Up

### 1. Dependencies Installed
```json
{
  "typescript": "~5.9.2",
  "@types/react": "~19.1.10",
  "@types/react-native": "^0.73.0"
}
```

### 2. Configuration Files Created

**tsconfig.json** - TypeScript compiler configuration
- Strict mode enabled for type safety
- Path mappings configured (`@components/*`, `@utils/*`, etc.)
- Extends `expo/tsconfig.base`

**babel.config.js** - Babel configuration for TypeScript
- Uses `babel-preset-expo` (includes TypeScript support)

**jest.config.js** - Updated for TypeScript testing
- Supports `.ts` and `.tsx` test files
- Path mappings configured

### 3. Type Definitions Created

**types/index.ts** - Common type definitions
- `ThemeStyles`, `Performance`, `Quiz`, `Question`
- `User`, `StudentProfile`, `Analytics`
- `RootStackParamList` for navigation
- And more...

### 4. First TypeScript Component

**components/results/ScoreCard.tsx** - Migrated from JavaScript
- Full type safety with interfaces
- Typed props with `React.FC<Props>`
- Typed styles with `StyleSheet.create<Styles>`

---

## 🚀 Quick Start

### Running TypeScript Type Checking

```bash
# Check for type errors (doesn't build, just checks)
npx tsc --noEmit

# Watch mode (checks on save)
npx tsc --noEmit --watch
```

### Creating New TypeScript Components

```typescript
// components/MyComponent.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MyComponentProps {
  title: string;
  count?: number; // Optional prop
  onPress: () => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, count = 0, onPress }) => {
  return (
    <View style={styles.container}>
      <Text>{title} - {count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});

export default MyComponent;
```

### Using Path Aliases

```typescript
// Instead of:
import ScoreCard from '../../../components/results/ScoreCard';
import { formatDate } from '../../../utils/helpers';

// Use:
import ScoreCard from '@components/results/ScoreCard';
import { formatDate } from '@utils/helpers';
```

Available aliases:
- `@components/*` → `./components/*`
- `@screens/*` → `./screens/*`
- `@services/*` → `./services/*`
- `@utils/*` → `./utils/*`
- `@navigation/*` → `./navigation/*`
- `@config/*` → `./config/*`
- `@contexts/*` → `./contexts/*`
- `@types/*` → `./types/*`

---

## 📝 TypeScript Patterns

### 1. Component Props

```typescript
interface ButtonProps {
  // Required props
  title: string;
  onPress: () => void;

  // Optional props
  disabled?: boolean;
  loading?: boolean;

  // Props with default values
  variant?: 'primary' | 'secondary' | 'outline';

  // Style props
  style?: ViewStyle | ViewStyle[];

  // Children
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  children,
}) => {
  // Implementation
};
```

### 2. State with TypeScript

```typescript
// Simple state
const [count, setCount] = useState<number>(0);
const [name, setName] = useState<string>('');
const [isLoading, setIsLoading] = useState<boolean>(false);

// Object state
interface FormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

const [form, setForm] = useState<FormState>({
  email: '',
  password: '',
  rememberMe: false,
});

// Array state
const [items, setItems] = useState<string[]>([]);
const [users, setUsers] = useState<User[]>([]);

// Nullable state
const [user, setUser] = useState<User | null>(null);
const [error, setError] = useState<Error | null>(null);
```

### 3. Event Handlers

```typescript
// Button press
const handlePress = (): void => {
  console.log('Button pressed');
};

// Text input
const handleTextChange = (text: string): void => {
  setInputValue(text);
};

// With event object
import { NativeSyntheticEvent, TextInputChangeEventData } from 'react-native';

const handleChange = (event: NativeSyntheticEvent<TextInputChangeEventData>): void => {
  const { text } = event.nativeEvent;
  setInputValue(text);
};
```

### 4. Async Functions

```typescript
// Basic async function
const fetchData = async (): Promise<void> => {
  const data = await api.getData();
  setData(data);
};

// Async function with return value
const fetchUser = async (userId: string): Promise<User> => {
  const response = await api.getUser(userId);
  return response.data;
};

// Async function with error handling
const saveData = async (data: FormData): Promise<{ success: boolean; message: string }> => {
  try {
    await api.save(data);
    return { success: true, message: 'Saved successfully' };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};
```

### 5. Custom Hooks

```typescript
interface UseCounterReturn {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

const useCounter = (initialValue: number = 0): UseCounterReturn => {
  const [count, setCount] = useState<number>(initialValue);

  const increment = (): void => setCount(c => c + 1);
  const decrement = (): void => setCount(c => c - 1);
  const reset = (): void => setCount(initialValue);

  return { count, increment, decrement, reset };
};

// Usage
const { count, increment } = useCounter(0);
```

### 6. Navigation Types

```typescript
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@types';

// Screen props
type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
type QuizScreenProps = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

// In component
const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, route }) => {
  // Navigate with typed params
  navigation.navigate('Quiz', {
    quizId: '123',
    questions: [...],
  });
};
```

### 7. Styled Components

```typescript
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

interface Styles {
  container: ViewStyle;
  title: TextStyle;
  image: ImageStyle;
  button: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  image: {
    width: 100,
    height: 100,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
});
```

---

## 🔄 Migration Strategy

### Phase 1: New Components (Current)
✅ All new components written in TypeScript
✅ Use `.tsx` extension for components
✅ Use `.ts` extension for utilities/services

### Phase 2: Extract & Migrate
As we extract components from large files:
1. Create new `.tsx` file
2. Define proper interfaces
3. Add type safety
4. Write tests

### Phase 3: Gradual Conversion
Convert existing files incrementally:
1. Start with utilities and services (`.ts`)
2. Then convert components (`.tsx`)
3. Finally convert screens

### Phase 4: Strict Mode
Once most files are TypeScript:
- Enable stricter compiler options
- Remove `any` types
- Add comprehensive type coverage

---

## 🎯 TypeScript Best Practices

### Do's ✅

```typescript
// ✅ Define clear interfaces
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Use type inference when obvious
const count = 0; // TypeScript infers number

// ✅ Use optional chaining
const userName = user?.profile?.name;

// ✅ Use nullish coalescing
const displayName = user?.name ?? 'Guest';

// ✅ Use union types for variants
type Status = 'idle' | 'loading' | 'success' | 'error';

// ✅ Type your props properly
interface ButtonProps {
  title: string;
  onPress: () => void;
}
```

### Don'ts ❌

```typescript
// ❌ Don't use any
const data: any = fetchData(); // Bad

// ✅ Better alternatives
const data: unknown = fetchData();
const data = fetchData() as User;
const data: User = fetchData();

// ❌ Don't ignore TypeScript errors
// @ts-ignore
const broken = somethingWrong();

// ✅ Fix the underlying issue instead

// ❌ Don't use overly complex types
type ComplexType<T, U, V> = T extends U ? V : never; // Hard to understand

// ✅ Keep types simple and readable

// ❌ Don't duplicate type definitions
// Define once in types/index.ts and import
```

---

## 🧪 Testing with TypeScript

```typescript
// __tests__/MyComponent.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MyComponent from '@components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <MyComponent title="Test" onPress={mockOnPress} />
    );

    expect(getByText('Test')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <MyComponent title="Test" onPress={mockOnPress} />
    );

    fireEvent.press(getByText('Test'));

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
```

---

## 🔧 Common Issues & Solutions

### Issue: "Cannot find module '@components/...'"

**Solution**: Restart TypeScript server in VS Code
- Press `Ctrl+Shift+P`
- Type "TypeScript: Restart TS Server"
- Or restart VS Code

### Issue: "Property '...' does not exist on type"

**Solution**: Add proper type definitions
```typescript
// Before
const user = {};
user.name = 'John'; // Error

// After
interface User {
  name?: string;
}
const user: User = {};
user.name = 'John'; // OK
```

### Issue: "Type 'null' is not assignable to type 'User'"

**Solution**: Use union types
```typescript
// Before
const [user, setUser] = useState<User>(); // Error

// After
const [user, setUser] = useState<User | null>(null); // OK
```

### Issue: Style types not working

**Solution**: Define style interfaces
```typescript
import { ViewStyle, TextStyle } from 'react-native';

interface Styles {
  container: ViewStyle;
  text: TextStyle;
}

const styles = StyleSheet.create<Styles>({ ... });
```

---

## 📊 Migration Progress

| Category | Total | Migrated | Progress |
|----------|-------|----------|----------|
| Components | ~50 | 1 | 2% |
| Screens | 26 | 0 | 0% |
| Services | 18 | 0 | 0% |
| Utils | 30 | 0 | 0% |
| **Total** | **~124** | **1** | **<1%** |

### Priority Order

1. ✅ **New components** - Write in TypeScript from start
2. ⏳ **Extracted components** - Convert during refactoring
3. ⏳ **Utilities** - Small, easy to convert
4. ⏳ **Services** - Medium complexity
5. ⏳ **Screens** - Large, convert last

---

## 📚 Resources

### Official Documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [React Native TypeScript](https://reactnative.dev/docs/typescript)

### VS Code Extensions
- **TypeScript and JavaScript Language Features** (built-in)
- **ESLint** - For linting TypeScript
- **Prettier** - For formatting

### Type Definitions
- [@types/react](https://www.npmjs.com/package/@types/react)
- [@types/react-native](https://www.npmjs.com/package/@types/react-native)
- [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped)

---

## ✅ Checklist for TypeScript Component

When creating a new TypeScript component:

- [ ] Use `.tsx` extension
- [ ] Define prop interface
- [ ] Type component as `React.FC<Props>`
- [ ] Type all state variables
- [ ] Type event handlers
- [ ] Define style interface if needed
- [ ] Add JSDoc comments
- [ ] Write tests
- [ ] Run type check: `npx tsc --noEmit`

---

**Status**: ✅ **READY FOR USE**
**Next Steps**:
1. Run `npm install` to install TypeScript dependencies
2. Start writing new components in TypeScript
3. Convert existing components during refactoring
4. Aim for 100% TypeScript coverage over time

---

**Last Updated**: 2025-09-30
**TypeScript Version**: 5.9.2
**Strict Mode**: Enabled ✅
