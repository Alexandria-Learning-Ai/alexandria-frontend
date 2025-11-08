# Math Components Testing Guide

**Phase 2: Math Intelligence Upgrade - Frontend Components**

This guide provides comprehensive testing instructions for the new math rendering components in Alexandria. Follow these steps to validate the MathRenderer and GraphDisplay components across different platforms and scenarios.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Component Overview](#component-overview)
3. [Automated Testing](#automated-testing)
4. [Manual Testing](#manual-testing)
5. [Platform-Specific Testing](#platform-specific-testing)
6. [Performance Validation](#performance-validation)
7. [Troubleshooting](#troubleshooting)
8. [Test Coverage Report](#test-coverage-report)

---

## Quick Start

### Prerequisites

- Expo Go app installed on iOS/Android device
- Node.js and npm installed
- Alexandria app dependencies installed (`npm install`)

### Run All Tests

```bash
cd alexandria-app
npm test
```

### Start Development Server

```bash
npm start
```

Then scan QR code with Expo Go.

---

## Component Overview

### 1. MathRenderer

**Location:** `components/shared/MathRenderer.tsx`

**Purpose:** Renders LaTeX mathematical expressions using KaTeX in a WebView

**Key Features:**
- Beautiful LaTeX rendering
- Inline and display modes
- Alexandria theme colors
- Auto-adjusting height
- Loading and error states
- Screen reader accessibility

### 2. GraphDisplay

**Location:** `components/exam/GraphDisplay.tsx`

**Purpose:** Displays base64-encoded PNG graph images

**Key Features:**
- Base64 PNG rendering
- Responsive sizing
- Loading states
- Error handling
- Optional titles
- Accessibility support

### 3. Enhanced MathQuestion

**Location:** `components/exam/QuestionTypes/MathQuestion.tsx`

**Purpose:** Math question type with integrated LaTeX rendering

**Changes:**
- Automatic LaTeX detection
- MathRenderer integration
- Beautiful math display in questions and answers
- Maintains all existing functionality

---

## Automated Testing

### Run Jest Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test:coverage

# Run in watch mode
npm test:watch

# Run specific test file
npm test MathRenderer.test.tsx
npm test GraphDisplay.test.tsx
```

### Expected Test Results

#### MathRenderer Tests
```
✓ Basic Rendering (6 tests)
  ✓ renders without crashing
  ✓ displays loading state initially
  ✓ renders simple polynomial formula
  ✓ renders fraction formula
  ✓ renders integral formula
  ✓ renders summation formula

✓ Display Modes (4 tests)
✓ Styling Props (4 tests)
✓ Callbacks (2 tests)
✓ Error Handling (2 tests)
✓ Accessibility (3 tests)
✓ Complex Formulas (5 tests)
✓ Edge Cases (5 tests)
✓ Performance (3 tests)

Total: 34 tests passing
```

#### GraphDisplay Tests
```
✓ Basic Rendering (4 tests)
✓ Title Display (4 tests)
✓ Sizing (4 tests)
✓ Loading State (3 tests)
✓ Error Handling (4 tests)
✓ Callbacks (2 tests)
✓ Accessibility (4 tests)
✓ Image Properties (2 tests)
✓ Edge Cases (5 tests)
✓ Performance (3 tests)
✓ Aspect Ratio Calculation (2 tests)

Total: 37 tests passing
```

### Coverage Goals

- **Statements:** >80%
- **Branches:** >75%
- **Functions:** >80%
- **Lines:** >80%

---

## Manual Testing

### Test Scenario 1: MathRenderer - Simple Formulas

**Objective:** Verify basic LaTeX rendering

**Steps:**
1. Create a test screen with these formulas:
   ```tsx
   <MathRenderer formula="x^2 + 3x + 1" />
   <MathRenderer formula="y = mx + b" />
   <MathRenderer formula="a^2 + b^2 = c^2" />
   ```

2. Open app in Expo Go

**Expected Results:**
- ✅ All formulas render with proper superscripts
- ✅ Text is white/parchment color (Alexandria theme)
- ✅ Math symbols are crisp and clear
- ✅ No loading spinner after <200ms
- ✅ No scrollbars visible

**Pass/Fail:** ______

---

### Test Scenario 2: MathRenderer - Complex Formulas

**Objective:** Test advanced LaTeX features

**Test Formulas:**
```tsx
// Fractions
<MathRenderer formula="\frac{x^2 + 1}{x - 3}" />

// Integrals
<MathRenderer formula="\int_0^1 x^2 dx" />

// Summations
<MathRenderer formula="\sum_{i=1}^{n} i^2" />

// Square roots
<MathRenderer formula="\sqrt{x^2 + y^2}" />

// Greek letters
<MathRenderer formula="\alpha + \beta + \gamma = \pi" />
```

**Expected Results:**
- ✅ Fractions display correctly (numerator over denominator)
- ✅ Integral symbol renders with proper limits
- ✅ Summation symbol shows correct subscript/superscript
- ✅ Square root encompasses entire expression
- ✅ Greek letters render as symbols (not text)

**Pass/Fail:** ______

---

### Test Scenario 3: MathRenderer - Inline vs Display Mode

**Objective:** Verify different rendering modes

**Steps:**
1. Test inline mode:
   ```tsx
   <Text style={styles.text}>
     The equation <MathRenderer formula="E = mc^2" inline={true} />
     is Einstein's famous formula.
   </Text>
   ```

2. Test display mode:
   ```tsx
   <MathRenderer formula="E = mc^2" inline={false} />
   ```

**Expected Results:**
- ✅ Inline mode: Math appears within text flow, smaller height
- ✅ Display mode: Math appears centered, larger and more prominent
- ✅ Both modes render correctly without layout issues

**Pass/Fail:** ______

---

### Test Scenario 4: MathRenderer - Error Handling

**Objective:** Test invalid LaTeX handling

**Steps:**
1. Render invalid LaTeX:
   ```tsx
   <MathRenderer formula="\invalid{markup" />
   <MathRenderer formula="\frac{incomplete" />
   ```

**Expected Results:**
- ✅ Error state displays (red background)
- ✅ Error message shows "Math Error"
- ✅ Original formula is visible in error
- ✅ App does not crash
- ✅ Other valid math still renders

**Pass/Fail:** ______

---

### Test Scenario 5: GraphDisplay - Valid Base64 Image

**Objective:** Test graph image rendering

**Test Data:**
```tsx
// Valid 1x1 transparent PNG
const VALID_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

<GraphDisplay
  imageBase64={VALID_BASE64}
  title="Test Graph"
/>
```

**Expected Results:**
- ✅ Loading spinner appears briefly
- ✅ Image renders (even if tiny)
- ✅ Title displays above image
- ✅ Image is centered in container
- ✅ Alexandria theme styling applied (dark card background)

**Pass/Fail:** ______

---

### Test Scenario 6: GraphDisplay - Error Handling

**Objective:** Test invalid base64 handling

**Steps:**
1. Render invalid base64:
   ```tsx
   <GraphDisplay imageBase64="invalid-data-here" />
   ```

**Expected Results:**
- ✅ Loading spinner appears initially
- ✅ Error state displays after load failure
- ✅ Error message: "Failed to Load Graph"
- ✅ Help text: "The graph image could not be displayed..."
- ✅ Graph icon (📊) shows in error state
- ✅ App does not crash

**Pass/Fail:** ______

---

### Test Scenario 7: GraphDisplay - Sizing and Responsiveness

**Objective:** Verify responsive sizing

**Steps:**
1. Test default sizing:
   ```tsx
   <GraphDisplay imageBase64={VALID_BASE64} />
   ```

2. Test custom sizing:
   ```tsx
   <GraphDisplay
     imageBase64={VALID_BASE64}
     width={300}
     height={200}
   />
   ```

3. Rotate device (if physical device)

**Expected Results:**
- ✅ Default: Image fits screen width minus padding
- ✅ Custom: Image uses specified dimensions
- ✅ Aspect ratio maintained (3:2 default)
- ✅ Image does not overflow container
- ✅ Responsive to device rotation

**Pass/Fail:** ______

---

### Test Scenario 8: MathQuestion Integration

**Objective:** Test MathRenderer in MathQuestion component

**Steps:**
1. Navigate to Exam Generator
2. Create a math exam (or use existing)
3. Start exam with math questions

**Test Questions:**
- Question with LaTeX: `Solve for x: x^2 + 5x + 6 = 0`
- Question without LaTeX: `What is 2 + 2?`

**Expected Results:**
- ✅ LaTeX questions render with MathRenderer
- ✅ Plain text questions render as text
- ✅ Math input still works (operator buttons)
- ✅ Review screen shows answers with LaTeX
- ✅ Correct answers show with LaTeX rendering
- ✅ No performance degradation

**Pass/Fail:** ______

---

### Test Scenario 9: Performance - Multiple Math Renders

**Objective:** Verify performance with many formulas

**Steps:**
1. Create screen with 10+ MathRenderer components
2. Scroll through list
3. Monitor frame rate and responsiveness

**Expected Results:**
- ✅ All formulas render within 200ms each
- ✅ Scrolling remains smooth (60fps)
- ✅ No memory leaks
- ✅ No jank or stuttering
- ✅ Loading spinners appear/disappear smoothly

**Pass/Fail:** ______

---

### Test Scenario 10: Accessibility - Screen Reader

**Objective:** Test screen reader compatibility

**Steps (iOS VoiceOver):**
1. Enable VoiceOver (Settings > Accessibility > VoiceOver)
2. Navigate to screen with MathRenderer
3. Tap on rendered math

**Steps (Android TalkBack):**
1. Enable TalkBack (Settings > Accessibility > TalkBack)
2. Navigate to screen with MathRenderer
3. Tap on rendered math

**Expected Results:**
- ✅ Screen reader announces "Math expression: [formula]"
- ✅ Formula is read as text (e.g., "x squared plus 3x plus 1")
- ✅ GraphDisplay announces "Mathematical function graph"
- ✅ Error states are announced
- ✅ Loading states are announced

**Pass/Fail:** ______

---

## Platform-Specific Testing

### iOS Testing (Expo Go)

**Device Requirements:**
- iPhone 8 or newer (iOS 14+)
- iPad (any recent model)

**Test Checklist:**
- [ ] MathRenderer displays correctly
- [ ] GraphDisplay loads images
- [ ] WebView renders KaTeX properly
- [ ] No crashes on formula rendering
- [ ] Touch interactions work (tap, scroll)
- [ ] VoiceOver accessibility works
- [ ] Performance is smooth (<200ms)
- [ ] Dark mode theme looks correct

**Known iOS Issues:**
- None reported yet

---

### Android Testing (Expo Go)

**Device Requirements:**
- Android 10+ device
- Minimum 2GB RAM

**Test Checklist:**
- [ ] MathRenderer displays correctly
- [ ] GraphDisplay loads images
- [ ] WebView renders KaTeX properly
- [ ] No crashes on formula rendering
- [ ] Touch interactions work (tap, scroll)
- [ ] TalkBack accessibility works
- [ ] Performance is smooth (<200ms)
- [ ] Dark mode theme looks correct

**Known Android Issues:**
- None reported yet

---

## Performance Validation

### Performance Metrics

**MathRenderer:**
- Initial render: <200ms (from mounting to display)
- Re-render (prop change): <100ms
- Memory usage: <5MB per component
- CPU usage: <10% during render

**GraphDisplay:**
- Image load time: <500ms (depends on image size)
- Memory usage: <2MB per image
- CPU usage: <5% during render

### Performance Testing Steps

1. **Measure Initial Render Time:**
   ```tsx
   const start = performance.now();
   <MathRenderer formula="x^2" onRenderComplete={() => {
     console.log('Render time:', performance.now() - start);
   }} />
   ```

2. **Monitor Memory:**
   - Open React Native Debugger
   - Go to Performance tab
   - Watch heap size during test

3. **Check Frame Rate:**
   - Enable "Show FPS Monitor" in Expo Dev Menu
   - Should maintain 60fps during scrolling

**Performance Goals:**
- ✅ <200ms initial render (MathRenderer)
- ✅ <500ms image load (GraphDisplay)
- ✅ 60fps scrolling with multiple components
- ✅ No memory leaks over time

---

## Troubleshooting

### Issue: MathRenderer shows blank/white screen

**Possible Causes:**
- WebView not loading KaTeX CDN
- Network connectivity issues
- Invalid LaTeX syntax

**Solutions:**
1. Check internet connection
2. Verify formula syntax
3. Check console for errors
4. Try simpler formula first (`x`)

---

### Issue: GraphDisplay shows error immediately

**Possible Causes:**
- Invalid base64 string
- Missing `data:image/png;base64,` prefix (component adds this)
- Corrupted image data

**Solutions:**
1. Verify base64 string is valid PNG
2. Test with known-good base64 string
3. Check console for detailed error

---

### Issue: Performance is slow (>200ms)

**Possible Causes:**
- Too many concurrent renders
- Complex formulas
- Low-end device

**Solutions:**
1. Limit concurrent MathRenderer instances
2. Use React.memo() for optimization
3. Simplify formulas if possible
4. Test on better device

---

### Issue: WebView not displaying in Android

**Possible Causes:**
- Missing WebView in Android emulator
- Outdated Android System WebView

**Solutions:**
1. Use physical device instead of emulator
2. Update Android System WebView from Play Store
3. Use newer emulator image

---

## Test Coverage Report

### Run Coverage Report

```bash
npm test:coverage
```

### Expected Coverage

**MathRenderer.tsx:**
```
Statements   : 85.71% ( 42/49 )
Branches     : 78.57% ( 22/28 )
Functions    : 90.00% ( 9/10 )
Lines        : 85.71% ( 42/49 )
```

**GraphDisplay.tsx:**
```
Statements   : 88.24% ( 45/51 )
Branches     : 80.00% ( 24/30 )
Functions    : 91.67% ( 11/12 )
Lines        : 88.24% ( 45/51 )
```

**MathQuestion.tsx:**
```
Statements   : 82.35% ( 56/68 )
Branches     : 75.00% ( 18/24 )
Functions    : 85.71% ( 12/14 )
Lines        : 82.35% ( 56/68 )
```

---

## Test Results Summary

### Automated Tests

| Component | Total Tests | Passing | Failing | Coverage |
|-----------|-------------|---------|---------|----------|
| MathRenderer | 34 | __ | __ | __%  |
| GraphDisplay | 37 | __ | __ | __%  |
| **Total** | **71** | **__** | **__** | **__%** |

### Manual Tests (iOS)

| Scenario | Pass | Fail | Notes |
|----------|------|------|-------|
| Simple Formulas | [ ] | [ ] | |
| Complex Formulas | [ ] | [ ] | |
| Inline/Display Mode | [ ] | [ ] | |
| Error Handling | [ ] | [ ] | |
| Graph Display | [ ] | [ ] | |
| Graph Errors | [ ] | [ ] | |
| Sizing | [ ] | [ ] | |
| Integration | [ ] | [ ] | |
| Performance | [ ] | [ ] | |
| Accessibility | [ ] | [ ] | |

### Manual Tests (Android)

| Scenario | Pass | Fail | Notes |
|----------|------|------|-------|
| Simple Formulas | [ ] | [ ] | |
| Complex Formulas | [ ] | [ ] | |
| Inline/Display Mode | [ ] | [ ] | |
| Error Handling | [ ] | [ ] | |
| Graph Display | [ ] | [ ] | |
| Graph Errors | [ ] | [ ] | |
| Sizing | [ ] | [ ] | |
| Integration | [ ] | [ ] | |
| Performance | [ ] | [ ] | |
| Accessibility | [ ] | [ ] | |

---

## Screenshots/Videos

### Expected Visual Results

**MathRenderer - Simple Formula:**
```
┌─────────────────────────┐
│                         │
│    x² + 3x + 1          │
│                         │
└─────────────────────────┘
White text on dark background
```

**MathRenderer - Fraction:**
```
┌─────────────────────────┐
│                         │
│       x² + 1            │
│      ───────            │
│       x - 3             │
│                         │
└─────────────────────────┘
```

**GraphDisplay - Loaded:**
```
┌─────────────────────────┐
│  Graph of f(x) = x²     │
├─────────────────────────┤
│                         │
│   [Graph Image Here]    │
│                         │
└─────────────────────────┘
Dark card with border
```

**GraphDisplay - Error:**
```
┌─────────────────────────┐
│                         │
│         📊              │
│  Failed to Load Graph   │
│  The graph image could  │
│  not be displayed.      │
│                         │
└─────────────────────────┘
Red tinted background
```

---

## Submission Checklist

Before marking Phase 2 complete:

### Code
- [ ] MathRenderer.tsx created and working
- [ ] GraphDisplay.tsx created and working
- [ ] MathQuestion.tsx updated with integration
- [ ] All TypeScript types defined
- [ ] No console.log statements
- [ ] Follows Alexandria coding standards

### Tests
- [ ] Jest tests pass (71/71)
- [ ] Coverage meets goals (>80%)
- [ ] Manual tests completed on iOS
- [ ] Manual tests completed on Android
- [ ] Performance validation passed
- [ ] Accessibility tested with screen readers

### Documentation
- [ ] This testing guide complete
- [ ] Accessibility audit complete
- [ ] Code comments and JSDoc added
- [ ] Component usage examples provided

### Cross-Platform
- [ ] Works on iOS Expo Go
- [ ] Works on Android Expo Go
- [ ] No platform-specific crashes
- [ ] Consistent behavior across platforms

---

## Next Steps (Phase 3)

After Phase 2 is validated:

1. Backend integration (math problem generation)
2. Real graph data from backend
3. Math problem solver integration
4. Advanced LaTeX features (matrices, etc.)
5. Math equation editor (bonus)

---

## Support & Resources

**Documentation:**
- KaTeX Documentation: https://katex.org/docs/supported.html
- React Native WebView: https://github.com/react-native-webview/react-native-webview
- Expo Documentation: https://docs.expo.dev/

**Testing Tools:**
- Jest: https://jestjs.io/
- React Testing Library: https://testing-library.com/react-native
- Expo Go: Available on App Store / Play Store

**Alexandria Contacts:**
- Frontend Lead: [Your Contact]
- Backend Team: [Backend Contact]
- QA Team: [QA Contact]

---

**Last Updated:** November 7, 2025
**Version:** 1.0
**Author:** Alexandria Frontend Team
