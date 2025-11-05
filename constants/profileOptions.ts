/**
 * Profile Options Constants
 * Education levels, academic years, degree programs, and learning preferences
 */

export interface EducationLevel {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export interface AcademicYear {
  id: string;
  label: string;
}

export interface SemesterSeason {
  id: string;
  label: string;
}

export interface YearOption {
  id: string;
  label: string;
}

export interface LearningStyle {
  id: string;
  label: string;
  icon: string;
}

export interface PainPoint {
  id: string;
  label: string;
  icon: string;
}

// Education levels and preferences data
export const EDUCATION_LEVELS: EducationLevel[] = [
    { id: 'high_school', label: 'High School', icon: 'school', description: 'Grades 9-12' },
    { id: 'undergrad', label: 'Undergraduate', icon: 'university', description: 'Bachelor\'s Degree' },
    { id: 'masters', label: 'Master\'s', icon: 'graduation-cap', description: 'Graduate Program' },
    { id: 'phd', label: 'PhD', icon: 'user-graduate', description: 'Doctoral Program' },
    { id: 'professional', label: 'Professional', icon: 'briefcase', description: 'MCAT, Bar, CPA, etc.' },
];

// Academic year/level options based on education level
export const ACADEMIC_YEARS: Record<string, AcademicYear[]> = {
    high_school: [
        { id: 'freshman', label: 'Freshman (9th Grade)' },
        { id: 'sophomore', label: 'Sophomore (10th Grade)' },
        { id: 'junior', label: 'Junior (11th Grade)' },
        { id: 'senior', label: 'Senior (12th Grade)' },
    ],
    undergrad: [
        { id: 'first_year', label: '1st Year (Freshman)' },
        { id: 'second_year', label: '2nd Year (Sophomore)' },
        { id: 'third_year', label: '3rd Year (Junior)' },
        { id: 'fourth_year', label: '4th Year (Senior)' },
        { id: 'fifth_year_plus', label: '5th Year+' },
    ],
    masters: [
        { id: 'first_year', label: '1st Year' },
        { id: 'second_year', label: '2nd Year' },
        { id: 'third_year_plus', label: '3rd Year+' },
    ],
    phd: [
        { id: 'first_year', label: '1st Year' },
        { id: 'second_year', label: '2nd Year' },
        { id: 'third_year', label: '3rd Year' },
        { id: 'fourth_year', label: '4th Year' },
        { id: 'fifth_year_plus', label: '5th Year+' },
        { id: 'dissertation', label: 'Dissertation Phase' },
    ],
    professional: [
        { id: 'preparing', label: 'Preparing for Exam' },
        { id: 'first_attempt', label: '1st Attempt' },
        { id: 'second_attempt', label: '2nd Attempt' },
        { id: 'third_attempt_plus', label: '3rd Attempt+' },
    ],
};

// Semester options
export const SEMESTER_SEASONS: SemesterSeason[] = [
    { id: 'fall', label: 'Fall' },
    { id: 'spring', label: 'Spring' },
    { id: 'summer', label: 'Summer' },
    { id: 'winter', label: 'Winter' },
];

// Generate years (current year ± 3)
export const generateYearOptions = (): YearOption[] => {
    const currentYear = new Date().getFullYear();
    const years: YearOption[] = [];
    for (let i = currentYear - 3; i <= currentYear + 3; i++) {
        years.push({ id: i.toString(), label: i.toString() });
    }
    return years;
};

// Common degree programs by education level
export const DEGREE_PROGRAMS: Record<string, string[]> = {
    high_school: [
        'General Education',
        'College Prep',
        'AP Program',
        'IB Program',
        'Vocational Track',
    ],
    undergrad: [
        'Biology',
        'Chemistry',
        'Computer Science',
        'Engineering',
        'Business Administration',
        'Psychology',
        'English Literature',
        'Mathematics',
        'Physics',
        'History',
        'Political Science',
        'Economics',
        'Pre-Med',
        'Pre-Law',
        'Communications',
        'Art',
        'Music',
    ],
    masters: [
        'MBA',
        'MS Computer Science',
        'MS Engineering',
        'MA Psychology',
        'MA Education',
        'MS Data Science',
        'MS Biology',
        'MS Chemistry',
        'MA History',
        'MA English',
        'MS Physics',
        'MS Mathematics',
        'Public Administration',
        'Social Work',
    ],
    phd: [
        'PhD Computer Science',
        'PhD Biology',
        'PhD Chemistry',
        'PhD Physics',
        'PhD Mathematics',
        'PhD Psychology',
        'PhD History',
        'PhD English',
        'PhD Engineering',
        'PhD Economics',
        'PhD Political Science',
        'PhD Education',
    ],
    professional: [
        'MCAT Prep',
        'LSAT Prep',
        'GRE Prep',
        'GMAT Prep',
        'CPA Exam',
        'Bar Exam',
        'NCLEX',
        'USMLE',
        'FE Exam',
        'PE Exam',
        'CFA',
        'PMP',
    ],
};

export const LEARNING_STYLES: LearningStyle[] = [
    { id: 'multiple_choice', label: 'Multiple Choice', icon: 'list-ul' },
    { id: 'essays', label: 'Essays & Writing', icon: 'pen' },
    { id: 'flashcards', label: 'Flashcards', icon: 'layer-group' },
    { id: 'case_studies', label: 'Case Studies', icon: 'search' },
    { id: 'problem_solving', label: 'Problem Solving', icon: 'calculator' },
    { id: 'visual', label: 'Visual Learning', icon: 'chart-bar' },
];

export const PAIN_POINTS: PainPoint[] = [
    { id: 'memorization', label: 'Memorization & Retention', icon: 'brain' },
    { id: 'problem_solving', label: 'Complex Problem Solving', icon: 'puzzle-piece' },
    { id: 'time_management', label: 'Time Management', icon: 'clock' },
    { id: 'test_anxiety', label: 'Test Anxiety', icon: 'heart' },
    { id: 'motivation', label: 'Staying Motivated', icon: 'fire' },
    { id: 'focus', label: 'Maintaining Focus', icon: 'bullseye' },
];
