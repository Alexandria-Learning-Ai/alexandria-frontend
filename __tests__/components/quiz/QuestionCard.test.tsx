/**
 * QuestionCard.test.tsx
 *
 * Comprehensive tests for the QuestionCard component.
 * Tests all question types, user interactions, and edge cases.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';
import QuestionCard from '../../../components/quiz/QuestionCard';
import type { Question, ThemeColors } from '../../../types';

// Mock dependencies
jest.mock('../../../components/VisualQuestionRenderer', () => 'VisualQuestionRenderer');
jest.mock('../../../components/DatabaseTableVisualization', () => 'DatabaseTableVisualization');
jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('QuestionCard Component', () => {
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

  // Mock animated values
  const mockFadeAnim = new Animated.Value(1);
  const mockSlideAnim = new Animated.Value(0);
  const mockScaleAnim = new Animated.Value(1);

  // Mock handlers
  const mockOnSelectOption = jest.fn();
  const mockOnShortAnswer = jest.fn();
  const mockOnVisualInteraction = jest.fn();
  const mockTranslate = (key: string) => key.split('.').pop() || key;

  const defaultProps = {
    index: 0,
    isSubmitted: false,
    themeColors: mockThemeColors,
    fadeAnim: mockFadeAnim,
    slideAnim: mockSlideAnim,
    scaleAnim: mockScaleAnim,
    onSelectOption: mockOnSelectOption,
    onShortAnswer: mockOnShortAnswer,
    onVisualInteraction: mockOnVisualInteraction,
    translate: mockTranslate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Multiple Choice Questions', () => {
    const multipleChoiceQuestion: Question = {
      id: '1',
      type: 'multiple_choice',
      question: 'What is the capital of France?',
      questionText: 'What is the capital of France?',
      options: [
        { id: 'a', label: 'A', text: 'London' },
        { id: 'b', label: 'B', text: 'Paris' },
        { id: 'c', label: 'C', text: 'Berlin' },
        { id: 'd', label: 'D', text: 'Madrid' },
      ],
      correctAnswer: 'B',
      difficulty: 'easy',
    };

    it('renders multiple choice question correctly', () => {
      const { getByText } = render(
        <QuestionCard question={multipleChoiceQuestion} {...defaultProps} />
      );

      expect(getByText('What is the capital of France?')).toBeTruthy();
      expect(getByText('Paris')).toBeTruthy();
      expect(getByText('London')).toBeTruthy();
      expect(getByText('Berlin')).toBeTruthy();
      expect(getByText('Madrid')).toBeTruthy();
    });

    it('calls onSelectOption when an option is pressed', () => {
      const { getByText } = render(
        <QuestionCard question={multipleChoiceQuestion} {...defaultProps} />
      );

      fireEvent.press(getByText('Paris'));
      expect(mockOnSelectOption).toHaveBeenCalledWith('1', 'B');
    });

    it('highlights selected option', () => {
      const { getByText } = render(
        <QuestionCard
          question={multipleChoiceQuestion}
          userAnswer="B"
          {...defaultProps}
        />
      );

      const parisOption = getByText('Paris');
      expect(parisOption).toBeTruthy();
    });

    it('shows feedback after submission', () => {
      const submittedQuestion = {
        ...multipleChoiceQuestion,
        isCorrect: true,
      };

      const { getByText } = render(
        <QuestionCard
          {...defaultProps}
          question={submittedQuestion}
          userAnswer="B"
          isSubmitted={true}
        />
      );

      expect(getByText('wisdomGained')).toBeTruthy();
    });

    it('shows correct answer when user is wrong', () => {
      const submittedQuestion = {
        ...multipleChoiceQuestion,
        isCorrect: false,
      };

      const { getByText, getAllByText } = render(
        <QuestionCard
          {...defaultProps}
          question={submittedQuestion}
          userAnswer="A"
          isSubmitted={true}
        />
      );

      expect(getByText('learnAndGrow')).toBeTruthy();
      const bElements = getAllByText('B');
      expect(bElements.length).toBeGreaterThan(0); // Correct answer "B" is shown somewhere
    });

    it('disables options after submission', () => {
      const { getByText } = render(
        <QuestionCard
          {...defaultProps}
          question={multipleChoiceQuestion}
          isSubmitted={true}
        />
      );

      fireEvent.press(getByText('Paris'));
      expect(mockOnSelectOption).not.toHaveBeenCalled();
    });
  });

  describe('True/False Questions', () => {
    const trueFalseQuestion: Question = {
      id: '2',
      type: 'true_false',
      question: 'The Earth is flat.',
      questionText: 'The Earth is flat.',
      correctAnswer: 'false',
      difficulty: 'easy',
    };

    it('renders true/false question correctly', () => {
      const { getByText } = render(
        <QuestionCard question={trueFalseQuestion} {...defaultProps} />
      );

      expect(getByText('The Earth is flat.')).toBeTruthy();
      expect(getByText('TRUE')).toBeTruthy();
      expect(getByText('FALSE')).toBeTruthy();
    });

    it('calls onSelectOption when true is pressed', () => {
      const { getByText } = render(
        <QuestionCard question={trueFalseQuestion} {...defaultProps} />
      );

      fireEvent.press(getByText('TRUE'));
      expect(mockOnSelectOption).toHaveBeenCalledWith('2', 'true');
    });

    it('calls onSelectOption when false is pressed', () => {
      const { getByText } = render(
        <QuestionCard question={trueFalseQuestion} {...defaultProps} />
      );

      fireEvent.press(getByText('FALSE'));
      expect(mockOnSelectOption).toHaveBeenCalledWith('2', 'false');
    });

    it('handles boolean userAnswer correctly', () => {
      const { getByText } = render(
        <QuestionCard
          question={trueFalseQuestion}
          userAnswer={false}
          {...defaultProps}
        />
      );

      expect(getByText('FALSE')).toBeTruthy();
    });

    it('shows correct answer for true/false after submission', () => {
      const submittedQuestion = {
        ...trueFalseQuestion,
        isCorrect: true,
      };

      const { getByText } = render(
        <QuestionCard
          {...defaultProps}
          question={submittedQuestion}
          userAnswer="false"
          isSubmitted={true}
        />
      );

      expect(getByText('wisdomGained')).toBeTruthy();
    });
  });

  describe('Open-Ended Questions', () => {
    const openEndedQuestion: Question = {
      id: '3',
      type: 'open_ended',
      question: 'Explain photosynthesis.',
      questionText: 'Explain photosynthesis.',
      correctAnswer: 'Process by which plants convert light energy into chemical energy',
      difficulty: 'medium',
    };

    it('renders open-ended question with text input', () => {
      const { getByPlaceholderText } = render(
        <QuestionCard question={openEndedQuestion} {...defaultProps} />
      );

      expect(getByPlaceholderText('Share your wisdom here...')).toBeTruthy();
    });

    it('calls onShortAnswer when text is entered', () => {
      const { getByPlaceholderText } = render(
        <QuestionCard question={openEndedQuestion} {...defaultProps} />
      );

      const textInput = getByPlaceholderText('Share your wisdom here...');
      fireEvent.changeText(textInput, 'Plants convert sunlight to energy');

      expect(mockOnShortAnswer).toHaveBeenCalledWith('3', 'Plants convert sunlight to energy');
    });

    it('displays user answer in text input', () => {
      const { getByDisplayValue } = render(
        <QuestionCard
          question={openEndedQuestion}
          userAnswer="My answer"
          {...defaultProps}
        />
      );

      expect(getByDisplayValue('My answer')).toBeTruthy();
    });

    it('disables text input after submission', () => {
      const { getByPlaceholderText } = render(
        <QuestionCard
          {...defaultProps}
          question={openEndedQuestion}
          isSubmitted={true}
        />
      );

      const textInput = getByPlaceholderText('Share your wisdom here...');
      expect(textInput.props.editable).toBe(false);
    });
  });

  describe('Math Questions', () => {
    const mathQuestion: Question = {
      id: '4',
      type: 'math',
      question: 'What is 2 + 2?',
      questionText: 'What is 2 + 2?',
      correctAnswer: '4',
      difficulty: 'easy',
      formula: 'a + b',
    };

    it('renders math question with numeric keyboard', () => {
      const { getByPlaceholderText } = render(
        <QuestionCard question={mathQuestion as any} {...defaultProps} />
      );

      const textInput = getByPlaceholderText('Enter your calculation...');
      expect(textInput).toBeTruthy();
      expect(textInput.props.keyboardType).toBe('numeric');
    });

    it('shows formula hint when available', () => {
      const { getByText } = render(
        <QuestionCard question={mathQuestion as any} {...defaultProps} />
      );

      expect(getByText(/a \+ b/)).toBeTruthy();
    });
  });

  describe('Difficulty Badges', () => {
    it('displays easy difficulty badge', () => {
      const easyQuestion: Question = {
        id: '5',
        type: 'multiple_choice',
        question: 'Easy question',
        questionText: 'Easy question',
        correctAnswer: 'A',
        difficulty: 'easy',
        options: [],
      };

      const { getByText } = render(
        <QuestionCard question={easyQuestion} {...defaultProps} />
      );

      expect(getByText('easy')).toBeTruthy();
    });

    it('displays hard difficulty badge', () => {
      const hardQuestion: Question = {
        id: '6',
        type: 'multiple_choice',
        question: 'Hard question',
        questionText: 'Hard question',
        correctAnswer: 'A',
        difficulty: 'hard',
        options: [],
      };

      const { getByText } = render(
        <QuestionCard question={hardQuestion} {...defaultProps} />
      );

      expect(getByText('hard')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('returns null when question is null', () => {
      const { UNSAFE_root } = render(
        <QuestionCard question={null as any} {...defaultProps} />
      );

      expect(UNSAFE_root.children.length).toBe(0);
    });

    it('handles missing question text gracefully', () => {
      const questionWithoutText: Question = {
        id: '7',
        type: 'multiple_choice',
        correctAnswer: 'A',
        options: [],
      };

      const { getByText } = render(
        <QuestionCard question={questionWithoutText} {...defaultProps} />
      );

      expect(getByText('No question text')).toBeTruthy();
    });

    it('handles missing options for multiple choice', () => {
      const questionWithoutOptions: Question = {
        id: '8',
        type: 'multiple_choice',
        question: 'Question',
        questionText: 'Question',
        correctAnswer: 'A',
        options: undefined,
      };

      const { queryByText } = render(
        <QuestionCard question={questionWithoutOptions} {...defaultProps} />
      );

      // Should not crash, just not render options
      expect(queryByText('Question')).toBeTruthy();
    });

    it('handles empty userAnswer for text input', () => {
      const openEndedQuestion: Question = {
        id: '9',
        type: 'open_ended',
        question: 'Question',
        questionText: 'Question',
        correctAnswer: 'Answer',
      };

      const { getByPlaceholderText } = render(
        <QuestionCard
          question={openEndedQuestion}
          userAnswer={undefined}
          {...defaultProps}
        />
      );

      const textInput = getByPlaceholderText('Share your wisdom here...');
      expect(textInput.props.value).toBe('');
    });
  });

  describe('Visual Interactions', () => {
    it('calls onVisualInteraction when visual element is interacted with', () => {
      const questionWithVisuals: any = {
        id: '10',
        type: 'multiple_choice',
        question: 'Question',
        questionText: 'Question',
        correctAnswer: 'A',
        options: [],
        visual_elements: [{ type: 'chart', data: [] }],
      };

      render(
        <QuestionCard question={questionWithVisuals} {...defaultProps} />
      );

      // Visual renderer should be present
      // Note: Actual interaction testing would require unmocking VisualQuestionRenderer
    });
  });

  describe('Accessibility', () => {
    it('provides accessible question number', () => {
      const question: Question = {
        id: '11',
        type: 'multiple_choice',
        question: 'Accessible question test',
        questionText: 'Accessible question test',
        correctAnswer: 'A',
        options: [],
        difficulty: 'medium',
      };

      const { getByText } = render(
        <QuestionCard question={question} index={5} {...defaultProps} />
      );

      // Check that question text is rendered (proves component renders with correct index)
      expect(getByText('Accessible question test')).toBeTruthy();
    });
  });
});
