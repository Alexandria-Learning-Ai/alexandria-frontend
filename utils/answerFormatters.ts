import { Question } from '../types';

export const normalizeAnswer = (answer: any): string => {
  if (answer === null || answer === undefined) return '';
  if (typeof answer === 'boolean') return answer ? 'true' : 'false';
  return String(answer).trim().toLowerCase();
};

export const getDisplayAnswerText = (question: Question, answer: any): string => {
  if (question.type === 'multiple_choice' && question.options && Array.isArray(question.options)) {
    const option = question.options.find(opt => typeof opt === 'object' && opt?.label === answer);
    return option && typeof option === 'object' ? (option.text || (option as any).value || answer) : answer || '—';
  } else if (question.type === 'true_false') {
    return String(answer).toLowerCase() === 'true' ? 'True' : 'False';
  } else {
    return answer || '—';
  }
};

export const getDisplayCorrectAnswer = (question: Question): string => {
  if (question.type === 'open_ended' || question.type === 'math') {
    return Array.isArray(question.correctAnswer)
      ? question.correctAnswer.join(', ')
      : (question.correctAnswer || 'N/A');
  } else if (question.type === 'true_false') {
    const normalizedCorrectAnswer = normalizeAnswer(question.correctAnswer);
    return normalizedCorrectAnswer === 'true' ? 'True' : 'False';
  } else if (question.options && Array.isArray(question.options)) {
    if (question.type === 'multiple_choice') {
      const correctOption = question.options.find(opt => typeof opt === 'object' && opt?.label === question.correctAnswer);
      if (correctOption && typeof correctOption === 'object') {
        return correctOption.text || (correctOption as any).value || (Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer);
      } else {
        return (
          question.options
            .filter(o => typeof o === 'object' && (o as any)?.isCorrect)
            .map(o => typeof o === 'object' ? (o.text || (o as any).value) : o)
            .join(', ') || (Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer)
        );
      }
    }
  }
  return Array.isArray(question.correctAnswer)
    ? question.correctAnswer.join(', ')
    : (question.correctAnswer || 'N/A');
};

export const getDisplayUserAnswer = (
  question: Question,
  userAnswer: any,
  isMultiAnswer: boolean
): string => {
  if (isMultiAnswer) {
    return Array.isArray(userAnswer) && userAnswer.length > 0 ? userAnswer.join(', ') : '—';
  }

  if (question.type === 'multiple_choice' && question.options && Array.isArray(question.options)) {
    const selectedOption = question.options.find(opt => typeof opt === 'object' && opt?.label === userAnswer);
    return selectedOption && typeof selectedOption === 'object' ? (selectedOption.text || (selectedOption as any).value) : userAnswer || '—';
  } else if (question.type === 'true_false') {
    // Handle null/undefined/empty answers first
    if (userAnswer === null || userAnswer === undefined || userAnswer === '') {
      return '—';
    }

    const normalizedUserAnswer = normalizeAnswer(userAnswer);
    if (normalizedUserAnswer === 'true') {
      return 'True';
    } else if (normalizedUserAnswer === 'false') {
      return 'False';
    } else {
      return String(userAnswer);
    }
  } else {
    return userAnswer || '—';
  }
};

// Motivational messages based on score percentage
export const getMotivationalMessage = (percentage: number): string => {
  if (percentage < 40) {
    return "Don't worry, practice makes perfect 💪";
  } else if (percentage >= 40 && percentage < 70) {
    return "Good progress! Keep at it 🚀";
  } else {
    return "Great work! You're mastering this topic 🎉";
  }
};

// Helper function to get gradient colors for progress bar based on percentage
export const getProgressGradientColors = (percentage: number): string[] => {
  if (percentage >= 80) {
    // Excellent (80-100%): Rich green gradient
    return ['#22c55e', '#16a34a', '#15803d'];
  } else if (percentage >= 60) {
    // Good (60-79%): Green to yellow gradient
    return ['#84cc16', '#eab308', '#f59e0b'];
  } else if (percentage >= 40) {
    // Fair (40-59%): Yellow to orange gradient
    return ['#f59e0b', '#f97316', '#ea580c'];
  } else {
    // Poor (0-39%): Orange to red gradient
    return ['#f97316', '#ef4444', '#dc2626'];
  }
};

// Helper function to get performance level color
export const getPerformanceLevelColor = (level: string): string => {
  switch (level) {
    case 'excellent':
      return '#28a745';
    case 'good':
      return '#17a2b8';
    case 'developing':
      return '#ffc107';
    default:
      return '#6c757d';
  }
};

// Helper function to get performance emoji
export const getPerformanceEmoji = (level: string): string => {
  switch (level) {
    case 'Excellent':
      return '🏆';
    case 'Great':
      return '⭐';
    case 'Good':
      return '👍';
    case 'Fair':
      return '👌';
    default:
      return '🌱';
  }
};
