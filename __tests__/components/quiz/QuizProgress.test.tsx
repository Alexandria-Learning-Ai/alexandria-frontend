/**
 * QuizProgress.test.tsx
 *
 * Comprehensive tests for the QuizProgress component.
 * Tests progress calculation, rendering, and animations.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import QuizProgress from '../../../components/quiz/QuizProgress';
import type { ThemeColors } from '../../../types';

describe('QuizProgress Component', () => {
  // Mock theme colors
  const mockThemeColors: ThemeColors = {
    alexandriaGold: '#D4AF37',
    alexandriaBronze: '#CD7F32',
    alexandriaSilver: '#C0C0C0',
    alexandriaNavy: '#1A2C5B',
    alexandriaCream: '#F8F4E3',
    success: '#28a745',
    error: '#dc3545',
    warning: '#FFD700',
    info: '#3498DB',
    background: '#F8F4E3',
    surface: '#FFFFFF',
    surfaceSecondary: '#F8F9FA',
    text: '#1A2C5B',
    textSecondary: '#4A5568',
    textTertiary: '#718096',
    border: 'rgba(26, 44, 91, 0.2)',
    borderSecondary: 'rgba(26, 44, 91, 0.1)',
    overlay: 'rgba(255, 255, 255, 0.9)',
    shadow: '#1A2C5B',
  };

  const mockProgressAnim = new Animated.Value(0);
  const mockTranslate = (key: string) => key.split('.').pop() || key;

  const defaultProps = {
    themeColors: mockThemeColors,
    progressAnim: mockProgressAnim,
    translate: mockTranslate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Progress Display', () => {
    it('renders progress for first question', () => {
      const { getByText, getAllByText } = render(
        <QuizProgress
          currentQuestionIndex={0}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      expect(getByText(/trial/)).toBeTruthy();
      expect(getAllByText(/1/).length).toBeGreaterThan(0);
      expect(getByText(/of/)).toBeTruthy();
      expect(getByText(/10%/)).toBeTruthy();
      expect(getByText(/complete/)).toBeTruthy();
    });

    it('renders progress for middle question', () => {
      const { getByText, getAllByText } = render(
        <QuizProgress
          currentQuestionIndex={4}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      expect(getByText(/trial/)).toBeTruthy();
      expect(getAllByText(/5/).length).toBeGreaterThan(0);
      expect(getByText(/of/)).toBeTruthy();
      expect(getByText(/50%/)).toBeTruthy();
    });

    it('renders progress for last question', () => {
      const { getByText, getAllByText } = render(
        <QuizProgress
          currentQuestionIndex={9}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      expect(getByText(/trial/)).toBeTruthy();
      expect(getAllByText(/10/).length).toBeGreaterThan(0);
      expect(getByText(/of/)).toBeTruthy();
      expect(getByText(/100%/)).toBeTruthy();
    });

    it('renders progress for single question quiz', () => {
      const { getByText, getAllByText } = render(
        <QuizProgress
          currentQuestionIndex={0}
          totalQuestions={1}
          {...defaultProps}
        />
      );

      expect(getByText(/trial/)).toBeTruthy();
      expect(getAllByText(/1/).length).toBeGreaterThan(0);
      expect(getByText(/of/)).toBeTruthy();
      expect(getByText(/100%/)).toBeTruthy();
    });
  });

  describe('Percentage Calculation', () => {
    it('calculates 0% for first question of 100', () => {
      const { getByText } = render(
        <QuizProgress
          currentQuestionIndex={0}
          totalQuestions={100}
          {...defaultProps}
        />
      );

      expect(getByText(/1%/)).toBeTruthy(); // 1/100 = 1%
    });

    it('calculates 25% correctly', () => {
      const { getByText } = render(
        <QuizProgress
          currentQuestionIndex={4}
          totalQuestions={20}
          {...defaultProps}
        />
      );

      expect(getByText(/25%/)).toBeTruthy();
    });

    it('calculates 33% correctly (rounds)', () => {
      const { getByText } = render(
        <QuizProgress
          currentQuestionIndex={0}
          totalQuestions={3}
          {...defaultProps}
        />
      );

      expect(getByText(/33%/)).toBeTruthy(); // 1/3 = 0.333... rounds to 33%
    });

    it('calculates 67% correctly (rounds)', () => {
      const { getByText } = render(
        <QuizProgress
          currentQuestionIndex={1}
          totalQuestions={3}
          {...defaultProps}
        />
      );

      expect(getByText(/67%/)).toBeTruthy(); // 2/3 = 0.666... rounds to 67%
    });

    it('calculates 75% correctly', () => {
      const { getByText } = render(
        <QuizProgress
          currentQuestionIndex={2}
          totalQuestions={4}
          {...defaultProps}
        />
      );

      expect(getByText(/75%/)).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero total questions gracefully', () => {
      const { getByText, getAllByText } = render(
        <QuizProgress
          currentQuestionIndex={0}
          totalQuestions={0}
          {...defaultProps}
        />
      );

      expect(getAllByText(/1/).length).toBeGreaterThan(0);
      expect(getAllByText(/0/).length).toBeGreaterThan(0);
      expect(getByText(/0%/)).toBeTruthy();
    });

    it('handles large question counts', () => {
      const { getByText } = render(
        <QuizProgress
          currentQuestionIndex={499}
          totalQuestions={1000}
          {...defaultProps}
        />
      );

      expect(getByText(/500/)).toBeTruthy();
      expect(getByText(/1000/)).toBeTruthy();
      expect(getByText(/50%/)).toBeTruthy();
    });

    it('handles index out of bounds (should not crash)', () => {
      const { getByText } = render(
        <QuizProgress
          currentQuestionIndex={10}
          totalQuestions={5}
          {...defaultProps}
        />
      );

      // Should render without crashing
      expect(getByText(/11/)).toBeTruthy();
      expect(getByText(/5/)).toBeTruthy();
      expect(getByText(/220%/)).toBeTruthy(); // 11/5 = 2.2 = 220%
    });
  });

  describe('Translation Support', () => {
    it('uses translate function when provided', () => {
      const customTranslate = jest.fn((key: string) => {
        const translations: Record<string, string> = {
          'quiz.trial': 'Question',
          'quiz.of': 'out of',
          'quiz.complete': 'Done',
        };
        return translations[key] || key;
      });

      const { getByText } = render(
        <QuizProgress
          currentQuestionIndex={0}
          totalQuestions={10}
          themeColors={mockThemeColors}
          progressAnim={mockProgressAnim}
          translate={customTranslate}
        />
      );

      expect(getByText(/Question/)).toBeTruthy();
      expect(getByText(/out of/)).toBeTruthy();
      expect(getByText(/Done/)).toBeTruthy();
      expect(customTranslate).toHaveBeenCalledWith('quiz.trial');
      expect(customTranslate).toHaveBeenCalledWith('quiz.of');
      expect(customTranslate).toHaveBeenCalledWith('quiz.complete');
    });

    it('falls back to default text when translate is not provided', () => {
      const { getByText } = render(
        <QuizProgress
          currentQuestionIndex={0}
          totalQuestions={10}
          themeColors={mockThemeColors}
          progressAnim={mockProgressAnim}
        />
      );

      expect(getByText(/trial/)).toBeTruthy();
      expect(getByText(/of/)).toBeTruthy();
      expect(getByText(/complete/)).toBeTruthy();
    });
  });

  describe('Theming', () => {
    it('applies theme colors correctly', () => {
      const { getByText } = render(
        <QuizProgress
          currentQuestionIndex={0}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      const percentageText = getByText(/10%/);
      expect(percentageText.props.style).toContainEqual(
        expect.objectContaining({ color: mockThemeColors.alexandriaGold })
      );
    });

    it('uses dark mode colors when provided', () => {
      const darkThemeColors: ThemeColors = {
        ...mockThemeColors,
        surface: '#1A2C5B',
        surfaceSecondary: '#2C3E50',
        text: '#F8F4E3',
      };

      const { getByText } = render(
        <QuizProgress
          currentQuestionIndex={0}
          totalQuestions={10}
          themeColors={darkThemeColors}
          progressAnim={mockProgressAnim}
        />
      );

      const questionText = getByText(/trial/);
      expect(questionText.props.style).toContainEqual(
        expect.objectContaining({ color: darkThemeColors.text })
      );
    });
  });

  describe('Progress Bar', () => {
    it('renders progress bar container', () => {
      const { UNSAFE_getByType } = render(
        <QuizProgress
          currentQuestionIndex={0}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      // Progress bar should exist (we can't easily test Animated.View width)
      expect(UNSAFE_getByType(Animated.View)).toBeTruthy();
    });

    it('updates when current question changes', () => {
      const { rerender, getByText } = render(
        <QuizProgress
          currentQuestionIndex={0}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      expect(getByText(/10%/)).toBeTruthy();

      rerender(
        <QuizProgress
          currentQuestionIndex={4}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      expect(getByText(/50%/)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('provides clear progress information', () => {
      const { getByText } = render(
        <QuizProgress
          currentQuestionIndex={2}
          totalQuestions={5}
          {...defaultProps}
        />
      );

      // Both question count and percentage should be visible
      expect(getByText(/3/)).toBeTruthy();
      expect(getByText(/5/)).toBeTruthy();
      expect(getByText(/60%/)).toBeTruthy();
    });

    it('shows human-readable progress', () => {
      const { getByText, getAllByText } = render(
        <QuizProgress
          currentQuestionIndex={0}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      // All progress text parts should be present and readable
      expect(getByText(/trial/)).toBeTruthy();
      expect(getAllByText(/1/).length).toBeGreaterThan(0);
      expect(getByText(/of/)).toBeTruthy();
      expect(getAllByText(/10/).length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('handles rapid updates without crashing', () => {
      const { rerender, getByText, getAllByText } = render(
        <QuizProgress
          currentQuestionIndex={0}
          totalQuestions={100}
          {...defaultProps}
        />
      );

      // Simulate rapid question navigation
      for (let i = 1; i < 10; i++) {
        rerender(
          <QuizProgress
            currentQuestionIndex={i}
            totalQuestions={100}
            {...defaultProps}
          />
        );
      }

      // Should still render correctly after rapid updates
      expect(getByText(/trial/)).toBeTruthy();
      expect(getAllByText(/10/).length).toBeGreaterThan(0);
      expect(getAllByText(/100/).length).toBeGreaterThan(0);
      expect(getByText(/10%/)).toBeTruthy();
      expect(getByText(/complete/i)).toBeTruthy();
    });
  });
});
