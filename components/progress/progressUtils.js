/**
 * Shared utilities for Progress Tracker components
 */

// Subject color mapping
export const getSubjectColor = (subject) => {
  const colors = {
    'mathematics': '#FF6B6B', 'math': '#FF6B6B', 'algebra': '#FF6B6B', 'calculus': '#FF6B6B', 'geometry': '#FF6B6B',
    'science': '#4ECDC4', 'physics': '#4ECDC4', 'chemistry': '#4ECDC4', 'biology': '#4ECDC4',
    'english': '#45B7D1', 'literature': '#45B7D1', 'writing': '#45B7D1', 'grammar': '#45B7D1',
    'history': '#96CEB4', 'social studies': '#96CEB4', 'geography': '#96CEB4',
    'computer science': '#FFEAA7', 'programming': '#FFEAA7', 'coding': '#FFEAA7', 'technology': '#FFEAA7',
    'languages': '#DDA0DD', 'foreign language': '#DDA0DD', 'spanish': '#DDA0DD', 'french': '#DDA0DD'
  };
  return colors[subject?.toLowerCase()] || '#B4B4B8';
};

// Subject icon mapping
export const getSubjectIcon = (subject) => {
  if (!subject) return 'book';
  const lowerSubject = subject.toLowerCase();
  if (lowerSubject.includes('math') || lowerSubject.includes('algebra') || lowerSubject.includes('calculus')) return 'calculator';
  if (lowerSubject.includes('science') || lowerSubject.includes('physics') || lowerSubject.includes('chemistry')) return 'flask';
  if (lowerSubject.includes('english') || lowerSubject.includes('literature')) return 'feather-alt';
  if (lowerSubject.includes('history')) return 'landmark';
  if (lowerSubject.includes('computer') || lowerSubject.includes('programming')) return 'laptop-code';
  if (lowerSubject.includes('language')) return 'globe';
  return 'book';
};

// Chart color mapping for subjects
export const getSubjectChartColor = (subject, index) => {
  const baseColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
    '#FFB6C1', '#98D8E8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471'
  ];

  if (subject) {
    const subjectKey = subject.toLowerCase();
    const colorMap = {
      'mathematics': '#FF6B6B', 'math': '#FF6B6B', 'algebra': '#FF6B6B',
      'science': '#4ECDC4', 'physics': '#4ECDC4', 'chemistry': '#4ECDC4',
      'english': '#45B7D1', 'literature': '#45B7D1',
      'history': '#96CEB4', 'social studies': '#96CEB4',
      'computer science': '#FFEAA7', 'programming': '#FFEAA7',
      'languages': '#DDA0DD', 'spanish': '#DDA0DD'
    };
    return colorMap[subjectKey] || baseColors[index % baseColors.length];
  }

  return baseColors[index % baseColors.length];
};

// Accuracy color coding
export const getAccuracyColor = (accuracy) => {
  if (accuracy >= 90) return '#4CAF50'; // Green
  if (accuracy >= 80) return '#8BC34A'; // Light Green
  if (accuracy >= 70) return '#FFC107'; // Yellow
  if (accuracy >= 60) return '#FF9800'; // Orange
  return '#F44336'; // Red
};

// Theme property getter with fallback
export const getThemeProperty = (theme, property, fallback = '#000000') => {
  try {
    return theme[property]?.color || theme[property] || fallback;
  } catch (error) {
    return fallback;
  }
};

// Period labels
export const getPeriodLabel = (period) => {
  const labels = {
    'week': 'This Week',
    'month': 'This Month',
    'all': 'All Time'
  };
  return labels[period] || period;
};

// Tab configuration
export const getTabConfig = () => [
  { id: 'overall', icon: 'chart-line', label: 'Overview' },
  { id: 'subjects', icon: 'book-open', label: 'Subjects' },
  { id: 'courses', icon: 'graduation-cap', label: 'Courses' },
  { id: 'advanced', icon: 'brain', label: 'Advanced' }
];

// Chart configuration defaults
export const getChartConfig = (currentTheme) => ({
  backgroundColor: 'transparent',
  backgroundGradientFrom: currentTheme?.chartBackground?.color || '#FFFFFF',
  backgroundGradientTo: currentTheme?.chartBackground?.color || '#FFFFFF',
  color: (opacity = 1) => `rgba(26, 44, 91, ${opacity})`,
  strokeWidth: 3,
  barPercentage: 0.7,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
  style: {
    borderRadius: 16,
  },
  propsForLabels: {
    fontSize: 11,
    fontWeight: '600',
  },
  propsForVerticalLabels: {
    fontSize: 10,
  },
  propsForHorizontalLabels: {
    fontSize: 10,
  },
});

// Screen dimensions
export const getScreenDimensions = () => {
  const { Dimensions } = require('react-native');
  return Dimensions.get('window');
};