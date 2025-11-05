/**
 * Upload Options Constants
 * Predefined options for quiz generation and file upload
 */

export interface SubjectOption {
  label: string;
  value: string;
  icon: string;
  color: string;
}

export interface QuizTypeOption {
  label: string;
  value: string;
  icon: string;
  color: string;
}

export interface DifficultyOption {
  label: string;
  value: string;
  icon: string;
}

// Predefined subjects list for quick selection
export const predefinedSubjects: SubjectOption[] = [
  { label: '📚 Mathematics', value: 'mathematics', icon: 'calculator', color: '#3498DB' },
  { label: '🧬 Science', value: 'science', icon: 'atom', color: '#27AE60' },
  { label: '📜 History', value: 'history', icon: 'landmark', color: '#8B4513' },
  { label: '📝 English/Literature', value: 'english', icon: 'book', color: '#9B59B6' },
  { label: '💻 Computer Science', value: 'computer_science', icon: 'code', color: '#E74C3C' },
  { label: '🎨 Art', value: 'art', icon: 'palette', color: '#F39C12' },
  { label: '🎵 Music', value: 'music', icon: 'music', color: '#E91E63' },
  { label: '🌍 Geography', value: 'geography', icon: 'globe', color: '#1ABC9C' },
  { label: '💼 Business', value: 'business', icon: 'briefcase', color: '#34495E' },
  { label: '🏥 Medicine', value: 'medicine', icon: 'user-md', color: '#E67E22' },
  { label: '⚖️ Law', value: 'law', icon: 'gavel', color: '#7F8C8D' },
  { label: '🔬 Physics', value: 'physics', icon: 'atom', color: '#2ECC71' },
  { label: '⚗️ Chemistry', value: 'chemistry', icon: 'flask', color: '#F1C40F' },
  { label: '🧠 Psychology', value: 'psychology', icon: 'brain', color: '#AF7AC5' },
  { label: '💰 Economics', value: 'economics', icon: 'chart-line', color: '#58D68D' },
];

// Quiz type options for question generation (multi-select supported)
export const quizTypeOptions: QuizTypeOption[] = [
  { label: 'All Types (Recommended)', value: 'all', icon: 'star', color: '#D4AF37' },
  { label: 'Multiple Choice', value: 'multiple_choice', icon: 'list-ul', color: '#27AE60' },
  { label: 'Short Answer', value: 'open_ended', icon: 'edit', color: '#E74C3C' },
  { label: 'True / False', value: 'true_false', icon: 'check-circle', color: '#9B59B6' },
  { label: 'Fill in the Blank', value: 'fill_in_blank', icon: 'pen-fancy', color: '#FF6B6B' },
];

// Difficulty level options
export const difficultyOptions: DifficultyOption[] = [
  { label: '🟢 Easy - Basic concepts', value: 'easy', icon: 'seedling' },
  { label: '🟡 Medium - Standard level', value: 'medium', icon: 'balance-scale' },
  { label: '🔴 Hard - Advanced concepts', value: 'hard', icon: 'fire' },
  { label: '🟣 Expert - Professional level', value: 'expert', icon: 'crown' },
];
