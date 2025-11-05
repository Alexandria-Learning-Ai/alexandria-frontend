/**
 * Mock Test for All Refactored Screens
 * Tests that all extracted components, hooks, utilities, and styles are properly integrated
 */

const fs = require('fs');
const path = require('path');

describe('ResultsScreen Refactoring', () => {
  test('should have extracted styles file', () => {
    const stylesPath = path.join(__dirname, '..', 'styles', 'ResultsScreenStyles.ts');
    expect(fs.existsSync(stylesPath)).toBe(true);
  });

  test('should import styles correctly', () => {
    const screenPath = path.join(__dirname, '..', 'screens', 'ResultsScreen.js');
    const content = fs.readFileSync(screenPath, 'utf8');
    expect(content).toContain("import { styles, newAnalyticsStyles, lightStyles, darkStyles } from '../styles/ResultsScreenStyles'");
  });

  test('should have extracted utility files', () => {
    const explanationUtils = path.join(__dirname, '..', 'utils', 'explanationGenerators.ts');
    const shareUtils = path.join(__dirname, '..', 'utils', 'shareUtilities.ts');
    const coachUtils = path.join(__dirname, '..', 'utils', 'coachMessageGenerators.ts');

    expect(fs.existsSync(explanationUtils)).toBe(true);
    expect(fs.existsSync(shareUtils)).toBe(true);
    expect(fs.existsSync(coachUtils)).toBe(true);
  });

  test('should be significantly reduced in size', () => {
    const screenPath = path.join(__dirname, '..', 'screens', 'ResultsScreen.js');
    const content = fs.readFileSync(screenPath, 'utf8');
    const lineCount = content.split('\n').length;

    // Original: 4093 lines, Target: < 1300 lines
    expect(lineCount).toBeLessThan(1300);
    console.log(`✅ ResultsScreen: ${lineCount} lines (from 4,093)`);
  });
});

describe('QuizScreen Refactoring', () => {
  test('should have extracted styles file', () => {
    const stylesPath = path.join(__dirname, '..', 'styles', 'QuizScreenStyles.ts');
    expect(fs.existsSync(stylesPath)).toBe(true);
  });

  test('should import styles correctly', () => {
    const screenPath = path.join(__dirname, '..', 'screens', 'QuizScreen.js');
    const content = fs.readFileSync(screenPath, 'utf8');
    expect(content).toContain("import { styles } from '../styles/QuizScreenStyles'");
  });

  test('should have extracted theme utilities', () => {
    const themeUtils = path.join(__dirname, '..', 'utils', 'themeColors.ts');
    expect(fs.existsSync(themeUtils)).toBe(true);
  });

  test('should have extracted quiz helpers', () => {
    const quizHelpers = path.join(__dirname, '..', 'utils', 'quizHelpers.ts');
    expect(fs.existsSync(quizHelpers)).toBe(true);
  });

  test('should import utilities correctly', () => {
    const screenPath = path.join(__dirname, '..', 'screens', 'QuizScreen.js');
    const content = fs.readFileSync(screenPath, 'utf8');
    expect(content).toContain("import { getThemeColors } from '../utils/themeColors'");
    expect(content).toContain("import {\n  evaluateAnswer,\n  getQuestionIcon,\n  getDifficultyInfo,\n  processQuestionOptions\n} from '../utils/quizHelpers'");
  });

  test('should be significantly reduced in size', () => {
    const screenPath = path.join(__dirname, '..', 'screens', 'QuizScreen.js');
    const content = fs.readFileSync(screenPath, 'utf8');
    const lineCount = content.split('\n').length;

    // Original: 1785 lines, Target: < 1150 lines
    expect(lineCount).toBeLessThan(1150);
    console.log(`✅ QuizScreen: ${lineCount} lines (from 1,785)`);
  });
});

describe('UploadScreen Refactoring', () => {
  test('should have extracted styles file', () => {
    const stylesPath = path.join(__dirname, '..', 'styles', 'UploadScreenStyles.ts');
    expect(fs.existsSync(stylesPath)).toBe(true);
  });

  test('should import styles correctly', () => {
    const screenPath = path.join(__dirname, '..', 'screens', 'UploadScreen.js');
    const content = fs.readFileSync(screenPath, 'utf8');
    expect(content).toContain("import { styles } from '../styles/UploadScreenStyles'");
  });

  test('should have extracted CustomDropdown component', () => {
    const componentPath = path.join(__dirname, '..', 'components', 'upload', 'CustomDropdown.tsx');
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  test('should have extracted constants', () => {
    const constantsPath = path.join(__dirname, '..', 'constants', 'uploadOptions.ts');
    expect(fs.existsSync(constantsPath)).toBe(true);
  });

  test('should import components and constants correctly', () => {
    const screenPath = path.join(__dirname, '..', 'screens', 'UploadScreen.js');
    const content = fs.readFileSync(screenPath, 'utf8');
    expect(content).toContain("import CustomDropdown from '../components/upload/CustomDropdown'");
    expect(content).toContain("import { predefinedSubjects, quizTypeOptions, difficultyOptions } from '../constants/uploadOptions'");
  });

  test('should be significantly reduced in size', () => {
    const screenPath = path.join(__dirname, '..', 'screens', 'UploadScreen.js');
    const content = fs.readFileSync(screenPath, 'utf8');
    const lineCount = content.split('\n').length;

    // Original: 2933 lines, Target: < 1750 lines
    expect(lineCount).toBeLessThan(1750);
    console.log(`✅ UploadScreen: ${lineCount} lines (from 2,933)`);
  });
});

describe('Overall Refactoring Success', () => {
  test('should have created all new utility files', () => {
    const files = [
      'styles/ResultsScreenStyles.ts',
      'styles/QuizScreenStyles.ts',
      'styles/UploadScreenStyles.ts',
      'utils/explanationGenerators.ts',
      'utils/shareUtilities.ts',
      'utils/coachMessageGenerators.ts',
      'utils/themeColors.ts',
      'utils/quizHelpers.ts',
      'components/upload/CustomDropdown.tsx',
      'constants/uploadOptions.ts',
    ];

    files.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('should have maintained all original screen files', () => {
    const screens = [
      'ResultsScreen.js',
      'QuizScreen.js',
      'UploadScreen.js',
    ];

    screens.forEach(screen => {
      const screenPath = path.join(__dirname, '..', 'screens', screen);
      expect(fs.existsSync(screenPath)).toBe(true);
    });
  });

  test('should show total line reduction', () => {
    const screens = [
      { name: 'ResultsScreen', original: 4093 },
      { name: 'QuizScreen', original: 1785 },
      { name: 'UploadScreen', original: 2933 },
    ];

    let totalOriginal = 0;
    let totalCurrent = 0;

    screens.forEach(({ name, original }) => {
      const screenPath = path.join(__dirname, '..', 'screens', `${name}.js`);
      const content = fs.readFileSync(screenPath, 'utf8');
      const current = content.split('\n').length;

      totalOriginal += original;
      totalCurrent += current;

      console.log(`${name}: ${original} → ${current} lines`);
    });

    const reduction = Math.round(((totalOriginal - totalCurrent) / totalOriginal) * 100);
    console.log(`\n🎯 Total Reduction: ${totalOriginal} → ${totalCurrent} lines (${reduction}% reduction)`);

    // We should have reduced by at least 40% overall
    expect(totalCurrent).toBeLessThan(totalOriginal * 0.6);
  });
});

console.log('\n📊 Refactored Screens Test Suite\n');
