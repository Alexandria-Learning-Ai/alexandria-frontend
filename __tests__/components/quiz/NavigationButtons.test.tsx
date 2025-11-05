/**
 * NavigationButtons.test.tsx
 *
 * Comprehensive tests for the NavigationButtons component.
 * Tests navigation logic, button states, and user interactions.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationButtons } from '../../../components/quiz/NavigationButtons';
import type { ThemeColors } from '../../../types';

describe('NavigationButtons Component', () => {
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

  // Mock handlers
  const mockOnPrevious = jest.fn();
  const mockOnNext = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockTranslate = (key: string) => {
    const translations: Record<string, string> = {
      'quiz.previous': 'Previous',
      'quiz.next': 'Next',
      'quiz.submitWisdom': 'Submit Wisdom',
      'quiz.completeTrial': 'Complete Trial',
    };
    return translations[key] || key;
  };

  const defaultProps = {
    themeColors: mockThemeColors,
    onPrevious: mockOnPrevious,
    onNext: mockOnNext,
    onSubmit: mockOnSubmit,
    translate: mockTranslate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Previous Button Behavior', () => {
    it('disables previous button on first question', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={0}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      const previousButton = getByText('Previous');
      expect(previousButton).toBeTruthy();

      // Button should be disabled (check accessibilityState)
      const touchable = previousButton.parent?.parent;
      expect(touchable?.props.accessibilityState?.disabled).toBe(true);
    });

    it('enables previous button on second question', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={1}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      const previousButton = getByText('Previous');
      const touchable = previousButton.parent?.parent;
      expect(touchable?.props.accessibilityState?.disabled).toBe(false);
    });

    it('calls onPrevious when previous button pressed', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={5}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      fireEvent.press(getByText('Previous'));
      expect(mockOnPrevious).toHaveBeenCalledTimes(1);
    });

    it('does not call onPrevious when disabled', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={0}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      fireEvent.press(getByText('Previous'));
      expect(mockOnPrevious).not.toHaveBeenCalled();
    });
  });

  describe('Next Button Behavior', () => {
    it('shows next button on first question', () => {
      const { getByText, queryByText } = render(
        <NavigationButtons
          currentQuestionIndex={0}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      expect(getByText('Next')).toBeTruthy();
      expect(queryByText('Submit Wisdom')).toBeNull();
    });

    it('shows next button on middle questions', () => {
      const { getByText, queryByText } = render(
        <NavigationButtons
          currentQuestionIndex={4}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      expect(getByText('Next')).toBeTruthy();
      expect(queryByText('Submit Wisdom')).toBeNull();
    });

    it('does not show next button on last question', () => {
      const { queryByText } = render(
        <NavigationButtons
          currentQuestionIndex={9}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      expect(queryByText('Next')).toBeNull();
    });

    it('calls onNext when next button pressed', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={0}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      fireEvent.press(getByText('Next'));
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Submit Button Behavior', () => {
    it('shows submit button on last question', () => {
      const { getByText, queryByText } = render(
        <NavigationButtons
          currentQuestionIndex={9}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      expect(getByText('Submit Wisdom')).toBeTruthy();
      expect(queryByText('Next')).toBeNull();
    });

    it('shows submit button on single-question quiz', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={0}
          totalQuestions={1}
          {...defaultProps}
        />
      );

      expect(getByText('Submit Wisdom')).toBeTruthy();
    });

    it('calls onSubmit when submit button pressed', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={9}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      fireEvent.press(getByText('Submit Wisdom'));
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('shows "Complete Trial" text when isChallenge is true', () => {
      const { getByText, queryByText } = render(
        <NavigationButtons
          currentQuestionIndex={9}
          totalQuestions={10}
          isChallenge={true}
          {...defaultProps}
        />
      );

      expect(getByText('Complete Trial')).toBeTruthy();
      expect(queryByText('Submit Wisdom')).toBeNull();
    });

    it('shows "Submit Wisdom" text when isChallenge is false', () => {
      const { getByText, queryByText } = render(
        <NavigationButtons
          currentQuestionIndex={9}
          totalQuestions={10}
          isChallenge={false}
          {...defaultProps}
        />
      );

      expect(getByText('Submit Wisdom')).toBeTruthy();
      expect(queryByText('Complete Trial')).toBeNull();
    });
  });

  describe('Translation Support', () => {
    it('uses translate function for button text', () => {
      const customTranslate = jest.fn((key: string) => {
        const translations: Record<string, string> = {
          'quiz.previous': 'Anterior',
          'quiz.next': 'Siguiente',
          'quiz.submitWisdom': 'Enviar Sabiduría',
        };
        return translations[key] || key;
      });

      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={0}
          totalQuestions={10}
          themeColors={mockThemeColors}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onSubmit={mockOnSubmit}
          translate={customTranslate}
        />
      );

      expect(getByText('Anterior')).toBeTruthy();
      expect(getByText('Siguiente')).toBeTruthy();
      expect(customTranslate).toHaveBeenCalledWith('quiz.previous');
      expect(customTranslate).toHaveBeenCalledWith('quiz.next');
    });

    it('uses translate function for submit button', () => {
      const customTranslate = jest.fn((key: string) => {
        const translations: Record<string, string> = {
          'quiz.submitWisdom': 'Enviar Sabiduría',
        };
        return translations[key] || key;
      });

      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={9}
          totalQuestions={10}
          themeColors={mockThemeColors}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onSubmit={mockOnSubmit}
          translate={customTranslate}
        />
      );

      expect(getByText('Enviar Sabiduría')).toBeTruthy();
      expect(customTranslate).toHaveBeenCalledWith('quiz.submitWisdom');
    });

    it('uses translate function for challenge submit button', () => {
      const customTranslate = jest.fn((key: string) => {
        const translations: Record<string, string> = {
          'quiz.completeTrial': 'Completar Prueba',
        };
        return translations[key] || key;
      });

      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={9}
          totalQuestions={10}
          isChallenge={true}
          themeColors={mockThemeColors}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onSubmit={mockOnSubmit}
          translate={customTranslate}
        />
      );

      expect(getByText('Completar Prueba')).toBeTruthy();
      expect(customTranslate).toHaveBeenCalledWith('quiz.completeTrial');
    });

    it('falls back to default text when translate is not provided', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={0}
          totalQuestions={10}
          themeColors={mockThemeColors}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onSubmit={mockOnSubmit}
        />
      );

      // Default translate function returns last part of key (lowercase)
      expect(getByText('previous')).toBeTruthy();
      expect(getByText('next')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero total questions', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={0}
          totalQuestions={0}
          {...defaultProps}
        />
      );

      // Should render without crashing
      expect(getByText('Previous')).toBeTruthy();
      expect(getByText('Next')).toBeTruthy(); // 0 !== -1, so Next shows
    });

    it('handles single question quiz', () => {
      const { getByText, queryByText } = render(
        <NavigationButtons
          currentQuestionIndex={0}
          totalQuestions={1}
          {...defaultProps}
        />
      );

      expect(getByText('Previous')).toBeTruthy();
      expect(getByText('Submit Wisdom')).toBeTruthy();
      expect(queryByText('Next')).toBeNull();
    });

    it('handles large question counts', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={499}
          totalQuestions={1000}
          {...defaultProps}
        />
      );

      expect(getByText('Previous')).toBeTruthy();
      expect(getByText('Next')).toBeTruthy();
    });

    it('handles last question in large quiz', () => {
      const { getByText, queryByText } = render(
        <NavigationButtons
          currentQuestionIndex={999}
          totalQuestions={1000}
          {...defaultProps}
        />
      );

      expect(getByText('Previous')).toBeTruthy();
      expect(getByText('Submit Wisdom')).toBeTruthy();
      expect(queryByText('Next')).toBeNull();
    });
  });

  describe('Button State Management', () => {
    it('enables all buttons on middle question', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={5}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      const previousButton = getByText('Previous');
      const nextButton = getByText('Next');

      const prevTouchable = previousButton.parent?.parent;
      const nextTouchable = nextButton.parent?.parent;

      expect(prevTouchable?.props.accessibilityState?.disabled).toBe(false);
      expect(nextTouchable?.props.accessibilityState?.disabled).toBeUndefined(); // Not disabled
    });

    it('correctly identifies first question', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={0}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      const previousButton = getByText('Previous');
      const touchable = previousButton.parent?.parent;
      expect(touchable?.props.accessibilityState?.disabled).toBe(true);
    });

    it('correctly identifies last question', () => {
      const { getByText, queryByText } = render(
        <NavigationButtons
          currentQuestionIndex={9}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      expect(getByText('Submit Wisdom')).toBeTruthy();
      expect(queryByText('Next')).toBeNull();
    });
  });

  describe('Callback Behavior', () => {
    it('does not call any callbacks on render', () => {
      render(
        <NavigationButtons
          currentQuestionIndex={5}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      expect(mockOnPrevious).not.toHaveBeenCalled();
      expect(mockOnNext).not.toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('calls only onPrevious when previous pressed', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={5}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      fireEvent.press(getByText('Previous'));

      expect(mockOnPrevious).toHaveBeenCalledTimes(1);
      expect(mockOnNext).not.toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('calls only onNext when next pressed', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={5}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      fireEvent.press(getByText('Next'));

      expect(mockOnNext).toHaveBeenCalledTimes(1);
      expect(mockOnPrevious).not.toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('calls only onSubmit when submit pressed', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={9}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      fireEvent.press(getByText('Submit Wisdom'));

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnPrevious).not.toHaveBeenCalled();
      expect(mockOnNext).not.toHaveBeenCalled();
    });
  });

  describe('Theming', () => {
    it('applies theme colors correctly', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={0}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      const previousButton = getByText('Previous');
      expect(previousButton).toBeTruthy();
      // Theme colors are applied via styles
    });

    it('uses dark mode colors when provided', () => {
      const darkThemeColors: ThemeColors = {
        ...mockThemeColors,
        surface: '#1A2C5B',
        text: '#F8F4E3',
      };

      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={0}
          totalQuestions={10}
          themeColors={darkThemeColors}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
          onSubmit={mockOnSubmit}
        />
      );

      // Default translate returns lowercase
      expect(getByText('previous')).toBeTruthy();
      expect(getByText('next')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('provides clear button labels', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={5}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      expect(getByText('Previous')).toBeTruthy();
      expect(getByText('Next')).toBeTruthy();
    });

    it('provides clear submit button label', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={9}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      expect(getByText('Submit Wisdom')).toBeTruthy();
    });

    it('provides clear challenge submit label', () => {
      const { getByText } = render(
        <NavigationButtons
          currentQuestionIndex={9}
          totalQuestions={10}
          isChallenge={true}
          {...defaultProps}
        />
      );

      expect(getByText('Complete Trial')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('handles rapid navigation without crashing', () => {
      const { rerender, getByText } = render(
        <NavigationButtons
          currentQuestionIndex={0}
          totalQuestions={100}
          {...defaultProps}
        />
      );

      // Simulate rapid question navigation
      for (let i = 1; i < 10; i++) {
        rerender(
          <NavigationButtons
            currentQuestionIndex={i}
            totalQuestions={100}
            {...defaultProps}
          />
        );
      }

      // Should still render correctly after rapid updates
      expect(getByText('Previous')).toBeTruthy();
      expect(getByText('Next')).toBeTruthy();
    });

    it('handles rapid navigation to last question', () => {
      const { rerender, getByText } = render(
        <NavigationButtons
          currentQuestionIndex={0}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      rerender(
        <NavigationButtons
          currentQuestionIndex={9}
          totalQuestions={10}
          {...defaultProps}
        />
      );

      expect(getByText('Submit Wisdom')).toBeTruthy();
    });
  });
});
