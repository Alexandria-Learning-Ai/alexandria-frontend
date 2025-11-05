/**
 * Coach Message Generation Utilities
 * Functions for generating AI coach messages and tips
 */

export interface CoachMessage {
  message: string;
  type: string;
  suggestions: string[];
  nextSteps: string[];
  performanceLevel: string;
}

export interface CoachData {
  currentQuiz: {
    score: number;
    totalQuestions: number;
    percentage: number;
    questions: any[];
    category: string;
    difficulty: string;
  };
}

/**
 * Generate local coach message based on quiz performance
 */
export const generateLocalCoachMessage = (coachData: CoachData): CoachMessage => {
  const { currentQuiz } = coachData;
  let message = '';
  let messageType = 'encouraging';
  let suggestions: string[] = [];
  let nextSteps: string[] = [];

  if (currentQuiz.percentage >= 90) {
    message = `🌟 Outstanding work! You crushed this ${currentQuiz.category} quiz with ${currentQuiz.percentage}%! `;
    messageType = 'celebration';
  } else if (currentQuiz.percentage >= 80) {
    message = `🎉 Great job! You scored ${currentQuiz.percentage}% on this ${currentQuiz.category} quiz! `;
    messageType = 'praise';
  } else if (currentQuiz.percentage >= 70) {
    message = `👍 Good effort! You got ${currentQuiz.percentage}% on this ${currentQuiz.category} quiz. `;
    messageType = 'encouraging';
  } else if (currentQuiz.percentage >= 60) {
    message = `💪 Keep pushing! You scored ${currentQuiz.percentage}% - there's room for improvement! `;
    messageType = 'motivating';
  } else {
    message = `🌱 Every expert was once a beginner! This ${currentQuiz.category} quiz was challenging. `;
    messageType = 'supportive';
  }

  if (currentQuiz.percentage >= 80) {
    suggestions = ['Continue building on your strengths', 'Try harder difficulty levels', 'Explore related topics'];
    nextSteps = ['Try a harder difficulty level', 'Explore a new subject area', 'Challenge yourself with timed quizzes'];
  } else if (currentQuiz.percentage >= 60) {
    suggestions = ['Review missed questions', 'Practice similar questions', 'Focus on one area at a time'];
    nextSteps = ['Review missed questions', 'Practice similar questions', 'Focus on one weak area'];
  } else {
    suggestions = ['Start with fundamentals', 'Take your time', 'Practice regularly'];
    nextSteps = [
      'Start with easier questions to build confidence',
      'Study the fundamentals of this topic',
      'Take your time - understanding beats speed',
    ];
  }

  message += `Consistent practice leads to mastery. You've got this! 🚀`;

  return {
    message: message.trim(),
    type: messageType,
    suggestions: suggestions.slice(0, 3),
    nextSteps: nextSteps.slice(0, 3),
    performanceLevel: currentQuiz.percentage >= 80 ? 'excellent' : currentQuiz.percentage >= 60 ? 'good' : 'developing',
  };
};

/**
 * Generate topic-specific coaching tip
 */
export const generateTopicSpecificTip = (topic: string): CoachMessage => {
  const tips: Record<string, { message: string; suggestions: string[] }> = {
    Math: {
      message: "🧮 Math mastery comes from practice and pattern recognition. Break complex problems into smaller steps.",
      suggestions: ['Practice mental math daily', 'Learn one new formula per week', 'Solve problems step-by-step'],
    },
    Science: {
      message: "🔬 Science is about understanding processes. Connect concepts to real-world examples.",
      suggestions: ['Watch science documentaries', 'Do hands-on experiments', 'Create concept maps'],
    },
    Literature: {
      message: "📚 Literature analysis improves with active reading. Note narrative structure and themes.",
      suggestions: ['Read diverse genres', 'Keep a reading journal', 'Discuss books with others'],
    },
    History: {
      message: "🏛️ History is about cause and effect. Create timelines and connect events to modern situations.",
      suggestions: ['Create visual timelines', 'Study primary sources', 'Connect past to present'],
    },
    Geography: {
      message: "🌍 Geography connects physical features to human activities. Use maps and spatial thinking.",
      suggestions: ['Study maps regularly', 'Learn country locations', 'Understand climate patterns'],
    },
    English: {
      message: "✍️ English mastery requires reading widely and writing regularly. Focus on grammar fundamentals.",
      suggestions: ['Read quality literature', 'Practice writing daily', 'Study grammar rules'],
    },
  };

  const defaultTip = {
    message: "🎯 Consistent practice and active engagement are the keys to learning any subject effectively.",
    suggestions: ['Practice regularly', 'Ask questions', 'Teach others what you learn'],
  };

  const tipData = tips[topic] || defaultTip;

  return {
    message: tipData.message,
    type: 'tip',
    suggestions: tipData.suggestions,
    nextSteps: [],
    performanceLevel: 'coaching',
  };
};

/**
 * Get performance-based encouragement message
 */
export const getEncouragementMessage = (percentage: number, category: string): string => {
  if (percentage >= 90) {
    return `Outstanding! You've mastered ${category} with a ${percentage}% score! 🏆`;
  } else if (percentage >= 80) {
    return `Great work on ${category}! ${percentage}% shows strong understanding! 🌟`;
  } else if (percentage >= 70) {
    return `Good job! You're building solid skills in ${category}. Keep it up! 💪`;
  } else if (percentage >= 60) {
    return `You're making progress in ${category}. Focus on weak areas to improve! 📈`;
  } else {
    return `${category} can be challenging, but every attempt is a step forward! 🌱`;
  }
};

/**
 * Generate study recommendations based on performance
 */
export const getStudyRecommendations = (percentage: number, category: string, incorrectCount: number): string[] => {
  const recommendations: string[] = [];

  if (percentage < 60) {
    recommendations.push(`Review the fundamentals of ${category}`);
    recommendations.push('Start with easier practice questions');
    recommendations.push('Break down complex topics into smaller parts');
  } else if (percentage < 80) {
    recommendations.push(`Focus on the ${incorrectCount} questions you missed`);
    recommendations.push('Practice similar questions to reinforce concepts');
    recommendations.push('Review explanations for incorrect answers');
  } else {
    recommendations.push('Challenge yourself with harder difficulty levels');
    recommendations.push('Explore advanced topics in ${category}');
    recommendations.push('Share your knowledge by teaching others');
  }

  return recommendations;
};

/**
 * Get motivational quote based on performance
 */
export const getMotivationalQuote = (percentage: number): string => {
  const excellentQuotes = [
    "Excellence is not a destination; it's a continuous journey. Keep going! 🚀",
    "Your hard work is paying off. Stay consistent! 💎",
    "You're proof that dedication leads to mastery! 🏆",
  ];

  const goodQuotes = [
    "Progress, not perfection. You're on the right track! 🌟",
    "Every question you answer brings you closer to mastery! 📚",
    "Your improvement mindset will take you far! 💪",
  ];

  const encouragingQuotes = [
    "Learning is a journey, not a race. Keep moving forward! 🌱",
    "Every mistake is a lesson learned. You're growing! 🌿",
    "Persistence beats resistance. Don't give up! 🔥",
  ];

  if (percentage >= 80) {
    return excellentQuotes[Math.floor(Math.random() * excellentQuotes.length)];
  } else if (percentage >= 60) {
    return goodQuotes[Math.floor(Math.random() * goodQuotes.length)];
  } else {
    return encouragingQuotes[Math.floor(Math.random() * encouragingQuotes.length)];
  }
};
