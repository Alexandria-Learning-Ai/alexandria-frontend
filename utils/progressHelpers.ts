/**
 * Progress Tracker Helper Functions
 * Utility functions for progress tracking and analytics
 */

/**
 * Get the color for a subject
 * @param subject - Subject object with optional color property
 * @returns Color string
 */
export const getSubjectColor = (subject: any): string => {
  return subject?.color || '#9B59B6'; // Default purple color
};

/**
 * Get the icon for a subject
 * @param subject - Subject object with optional icon property
 * @returns Icon name string
 */
export const getSubjectIcon = (subject: any): string => {
  return subject?.icon || 'book'; // Default book icon
};

/**
 * Get colors for subject chart based on subject name
 * @param subject - Subject name string
 * @param index - Fallback index for color selection
 * @returns Color string
 */
export const getSubjectChartColor = (subject: string, index: number): string => {
  const subjectColors = [
    '#3498DB', // Blue for Mathematics
    '#28A745', // Green for Science
    '#E74C3C', // Red for English/Language
    '#8E44AD', // Purple for History
    '#F39C12', // Orange for Language Arts
    '#9B59B6', // Purple for Test Prep
    '#17A2B8', // Teal for General
    '#6C757D', // Gray for Others
    '#20C997', // Mint
    '#FD7E14', // Orange-red
  ];

  // Try to match subject name to consistent colors
  const subjectKey = subject.toLowerCase();
  if (subjectKey.includes('math')) return '#3498DB';
  if (subjectKey.includes('science') || subjectKey.includes('physics') || subjectKey.includes('chemistry') || subjectKey.includes('biology')) return '#28A745';
  if (subjectKey.includes('english') || subjectKey.includes('language') || subjectKey.includes('literature')) return '#E74C3C';
  if (subjectKey.includes('history') || subjectKey.includes('social')) return '#8E44AD';
  if (subjectKey.includes('test') || subjectKey.includes('prep')) return '#9B59B6';

  // Fallback to index-based color
  return subjectColors[index % subjectColors.length];
};

/**
 * Get color based on accuracy percentage
 * @param accuracy - Accuracy percentage (0-100)
 * @returns Color string
 */
export const getAccuracyColor = (accuracy: number): string => {
  if (accuracy >= 80) return '#28a745'; // Green for good scores
  if (accuracy >= 60) return '#ffc107'; // Yellow for fair scores
  return '#dc3545'; // Red for poor scores
};

/**
 * Safe theme property accessor
 * @param theme - Theme object
 * @param property - Property name to access
 * @param fallback - Fallback color if property not found
 * @returns Color string
 */
export const getThemeProperty = (theme: any, property: string, fallback: string = '#000000'): string => {
  return theme?.[property]?.color || theme?.[property] || fallback;
};
