import React from 'react';
import { render } from '@testing-library/react-native';
import ScoreCard from '../../../components/results/ScoreCard';

describe('ScoreCard Component', () => {
  const mockProps = {
    score: 8,
    totalQuestions: 10,
    percentage: 80,
    animatedPercentageValue: '80',
    performance: {
      level: 'Excellent',
      emoji: '🎉',
      color: '#22c55e',
    },
    correctCount: 8,
    incorrectCount: 2,
    metadata: {
      updatedStats: {
        overall_accuracy: 0.75,
        total_quizzes: 15,
      },
    },
    currentThemeStyles: {
      scoreCard: {},
      scoreNumber: {},
      scoreLabel: {},
      subtitle: { color: '#666' },
    },
    isDarkMode: false,
  };

  it('renders correctly with all props', () => {
    const { getByText } = render(<ScoreCard {...mockProps} />);

    expect(getByText('80%')).toBeTruthy();
    expect(getByText('8 out of 10 correct')).toBeTruthy();
    expect(getByText('Excellent')).toBeTruthy();
    expect(getByText('8 Correct')).toBeTruthy();
    expect(getByText('2 Incorrect')).toBeTruthy();
  });

  it('displays motivational message for excellent score', () => {
    const { getByText } = render(<ScoreCard {...mockProps} />);

    expect(getByText("Great work! You're mastering this topic 🎉")).toBeTruthy();
  });

  it('displays motivational message for poor score', () => {
    const poorScoreProps = {
      ...mockProps,
      percentage: 30,
      animatedPercentageValue: '30',
    };

    const { getByText } = render(<ScoreCard {...poorScoreProps} />);

    expect(getByText("Don't worry, practice makes perfect 💪")).toBeTruthy();
  });

  it('displays motivational message for good score', () => {
    const goodScoreProps = {
      ...mockProps,
      percentage: 65,
      animatedPercentageValue: '65',
    };

    const { getByText } = render(<ScoreCard {...goodScoreProps} />);

    expect(getByText('Good progress! Keep at it 🚀')).toBeTruthy();
  });

  it('displays analytics stats when provided', () => {
    const { getByText } = render(<ScoreCard {...mockProps} />);

    expect(getByText(/Overall Accuracy: 75%/)).toBeTruthy();
    expect(getByText(/Total Quizzes: 15/)).toBeTruthy();
  });

  it('does not display analytics stats when metadata is missing', () => {
    const propsWithoutMetadata = {
      ...mockProps,
      metadata: {},
    };

    const { queryByText } = render(<ScoreCard {...propsWithoutMetadata} />);

    expect(queryByText(/Overall Accuracy/)).toBeNull();
  });

  it('handles zero correct answers', () => {
    const zeroScoreProps = {
      ...mockProps,
      score: 0,
      percentage: 0,
      animatedPercentageValue: '0',
      correctCount: 0,
      incorrectCount: 10,
    };

    const { getByText } = render(<ScoreCard {...zeroScoreProps} />);

    expect(getByText('0%')).toBeTruthy();
    expect(getByText('0 out of 10 correct')).toBeTruthy();
    expect(getByText('0 Correct')).toBeTruthy();
    expect(getByText('10 Incorrect')).toBeTruthy();
  });

  it('handles perfect score', () => {
    const perfectScoreProps = {
      ...mockProps,
      score: 10,
      percentage: 100,
      animatedPercentageValue: '100',
      correctCount: 10,
      incorrectCount: 0,
    };

    const { getByText } = render(<ScoreCard {...perfectScoreProps} />);

    expect(getByText('100%')).toBeTruthy();
    expect(getByText('10 out of 10 correct')).toBeTruthy();
    expect(getByText('10 Correct')).toBeTruthy();
    expect(getByText('0 Incorrect')).toBeTruthy();
  });

  it('applies dark mode styles correctly', () => {
    const darkModeProps = {
      ...mockProps,
      isDarkMode: true,
    };

    const { toJSON } = render(<ScoreCard {...darkModeProps} />);
    expect(toJSON()).toBeTruthy();
  });
});
