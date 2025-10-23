/**
 * Explanation Generation Utilities
 * Functions for generating explanations for quiz questions
 */

import { Question } from '../types';

/**
 * Determine the category of a question based on its text
 */
export const determineQuestionCategory = (questionText: string): string => {
  const lowerText = questionText.toLowerCase();

  const categoryMap: Record<string, string[]> = {
    Mathematics: [
      'math', 'mathematics', 'algebra', 'calculus', 'geometry', 'arithmetic', 'equation',
      'trigonometry', 'statistics', 'probability', 'derivative', 'integral', 'polynomial',
      'logarithm', 'exponential', 'matrix', 'vector', 'limit', 'function', 'theorem',
      'proof', 'sine', 'cosine', 'tangent', 'hyperbola', 'parabola', 'circle', 'triangle',
      'square', 'rectangle', 'area', 'perimeter', 'volume', 'angle', 'degree', 'radian',
      'calculate', 'solve', 'formula', 'sum', 'product', 'quotient', 'difference'
    ],
    Science: [
      'physics', 'chemistry', 'biology', 'anatomy', 'molecule', 'cell', 'atom', 'electron',
      'proton', 'neutron', 'nuclear', 'quantum', 'gravity', 'force', 'energy', 'momentum',
      'acceleration', 'velocity', 'mass', 'density', 'pressure', 'temperature', 'heat',
      'light', 'wave', 'frequency', 'amplitude', 'magnetic', 'electric', 'current', 'voltage',
      'organism', 'ecosystem', 'evolution', 'genetics', 'dna', 'rna', 'protein', 'enzyme',
      'photosynthesis', 'respiration', 'mitosis', 'meiosis', 'bacteria', 'virus'
    ],
    History: [
      'history', 'historical', 'ancient', 'medieval', 'renaissance', 'revolution', 'war',
      'civilization', 'empire', 'dynasty', 'monarch', 'democracy', 'republic', 'treaty',
      'battle', 'conquest', 'independence', 'colonial', 'industrial', 'world war',
      'civil war', 'constitution', 'amendment', 'president', 'congress', 'parliament'
    ],
    Literature: [
      'literature', 'novel', 'poem', 'poetry', 'author', 'character', 'plot', 'theme',
      'metaphor', 'symbolism', 'allegory', 'narrative', 'prose', 'verse', 'rhyme',
      'meter', 'stanza', 'sonnet', 'haiku', 'drama', 'tragedy', 'comedy', 'shakespeare',
      'dickens', 'twain', 'hemingway', 'fitzgerald', 'orwell', 'austen', 'climax', 'dramática'
    ],
    English: [
      'english', 'grammar', 'vocabulary', 'syntax', 'language', 'word', 'sentence',
      'paragraph', 'essay', 'writing', 'reading', 'comprehension', 'verb', 'noun',
      'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'clause',
      'phrase', 'subject', 'predicate', 'tense', 'passive', 'active'
    ],
    Geography: [
      'geography', 'map', 'capital', 'country', 'continent', 'ocean', 'river', 'mountain',
      'climate', 'latitude', 'longitude', 'equator', 'hemisphere', 'region', 'territory',
      'border', 'population', 'urban', 'rural', 'migration', 'ecosystem', 'biome'
    ],
    'Computer Science': [
      'programming', 'code', 'algorithm', 'data structure', 'variable', 'function',
      'loop', 'array', 'string', 'integer', 'boolean', 'class', 'object', 'inheritance',
      'polymorphism', 'recursion', 'binary', 'hexadecimal', 'bit', 'byte', 'memory',
      'cpu', 'gpu', 'software', 'hardware', 'network', 'protocol', 'database', 'sql'
    ]
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }

  return 'General';
};

/**
 * Generate contextual explanation based on question content
 */
export const generateContextualExplanation = (
  questionText: string,
  correctAnswer: string,
  userAnswer: string,
  options?: any[]
): string => {
  const lowerQuestion = questionText.toLowerCase();

  if (lowerQuestion.includes('climax') || lowerQuestion.includes('dramática')) {
    if (correctAnswer.toLowerCase().includes('planteamiento')) {
      return "In dramatic structure, the climax is the moment of highest tension, but it's the 'planteamiento' (exposition/setup) that provides sufficient information about the characters, establishing who they are, their relationships, and their motivations before the main conflict develops.";
    }
  }

  if (lowerQuestion.includes('photosynthesis') || lowerQuestion.includes('fotosíntesis')) {
    return "Photosynthesis is the process by which plants convert light energy into chemical energy, requiring chlorophyll, carbon dioxide, and water to produce glucose and oxygen.";
  }

  if (lowerQuestion.includes('equation') || lowerQuestion.includes('solve')) {
    return "To solve this equation, follow the order of operations (PEMDAS/BODMAS) and isolate the variable by performing inverse operations on both sides.";
  }

  if (lowerQuestion.includes('war') || lowerQuestion.includes('battle') || lowerQuestion.includes('revolution')) {
    return "Historical events often have multiple causes and effects. Consider the political, economic, and social factors that led to this outcome.";
  }

  if (lowerQuestion.includes('capital') || lowerQuestion.includes('country') || lowerQuestion.includes('continent')) {
    return "Geographic knowledge requires understanding the relationship between political boundaries, physical features, and cultural regions.";
  }

  return "This answer is correct based on the fundamental principles and established facts in this subject area.";
};

/**
 * Generate reason why an incorrect choice was wrong
 */
export const generateIncorrectChoiceReason = (
  questionText: string,
  userAnswer: string,
  correctAnswer: string
): string => {
  const lowerQuestion = questionText.toLowerCase();
  const lowerUser = userAnswer.toLowerCase();

  if (lowerQuestion.includes('climax') && lowerUser.includes('desenlace')) {
    return "the 'desenlace' (resolution) comes after the climax and resolves the conflict, but doesn't provide initial character information";
  }

  if (lowerQuestion.includes('photosynthesis') && lowerUser.includes('respiration')) {
    return "cellular respiration is the opposite process that breaks down glucose to release energy";
  }

  return "it doesn't align with the established principles or facts relevant to this question";
};

/**
 * Generate explanation for true/false questions
 */
export const generateTrueFalseReason = (questionText: string, isCorrectTrue: boolean): string => {
  const lowerQuestion = questionText.toLowerCase();

  if (lowerQuestion.includes('photosynthesis')) {
    return isCorrectTrue
      ? "photosynthesis does indeed require sunlight, carbon dioxide, and water to produce glucose and oxygen"
      : "the statement contains an error about the photosynthesis process or its requirements";
  }

  if (lowerQuestion.includes('historical') || lowerQuestion.includes('year')) {
    return isCorrectTrue
      ? "this historical fact is accurate according to documented records"
      : "this contradicts established historical evidence and documented facts";
  }

  return isCorrectTrue
    ? "the statement aligns with established facts and principles"
    : "the statement contains factual errors or misconceptions";
};

/**
 * Generate explanation for open-ended questions
 */
export const generateOpenEndedExplanation = (
  questionText: string,
  correctAnswer: string,
  userAnswer: string
): string => {
  const lowerQuestion = questionText.toLowerCase();

  if (lowerQuestion.includes('explain') || lowerQuestion.includes('describe')) {
    return `A complete answer should include: ${correctAnswer}. ${
      userAnswer ? `Your answer "${userAnswer}" may be partially correct but lacks some key elements or detail.` : ''
    }`;
  }

  if (lowerQuestion.includes('calculate') || lowerQuestion.includes('solve')) {
    return `The calculation requires specific steps and formulas. The final answer is ${correctAnswer}. ${
      userAnswer ? `Your answer "${userAnswer}" may indicate an error in calculation or method.` : ''
    }`;
  }

  return `The expected response is: ${correctAnswer}. Make sure to include all relevant details and supporting information.`;
};

/**
 * Generate category-specific learning tip
 */
export const generateCategorySpecificTip = (
  category: string,
  questionText: string,
  correctAnswer: string
): string => {
  switch (category.toLowerCase()) {
    case 'literature':
      return "Literary analysis tip: Pay attention to narrative structure elements like exposition, rising action, climax, falling action, and resolution.";
    case 'science':
      return "Science tip: Understand the inputs and outputs of biological processes to identify the correct process.";
    case 'math':
    case 'mathematics':
      return "Math tip: Always check your work by substituting your answer back into the original equation.";
    case 'history':
      return "History tip: Consider the chronological sequence of events and cause-and-effect relationships.";
    case 'geography':
      return "Geography tip: Study maps regularly and understand relationships between physical features and cultural regions.";
    default:
      return "General tip: Look for key words in the question that point to the main concept being tested.";
  }
};

/**
 * Generate complete local explanation for a question
 */
export const generateLocalExplanation = (question: any, userAnswer: string): string => {
  const questionText = question.text || question.questionText;
  const correctAnswer = question.correctAnswer;
  const category = determineQuestionCategory(questionText);

  let explanation = '';

  if (question.type === 'multiple_choice') {
    explanation = generateContextualExplanation(questionText, correctAnswer, userAnswer, question.options);

    if (userAnswer && userAnswer !== correctAnswer) {
      const incorrectReason = generateIncorrectChoiceReason(questionText, userAnswer, correctAnswer);
      explanation += ` Your choice "${userAnswer}" is incorrect because ${incorrectReason}.`;
    }
  } else if (question.type === 'true_false') {
    const isCorrectTrue = correctAnswer === true || correctAnswer === 'true' || correctAnswer === 'True';
    const normalizedUserAnswer = String(userAnswer).toLowerCase();
    const normalizedCorrect = String(correctAnswer).toLowerCase();

    explanation = generateTrueFalseReason(questionText, isCorrectTrue);

    // Add context about why the user's answer was wrong
    if (normalizedUserAnswer && normalizedUserAnswer !== normalizedCorrect) {
      const userSaidTrue = normalizedUserAnswer === 'true';
      explanation += ` You answered "${userSaidTrue ? 'True' : 'False'}", which is incorrect because ${
        isCorrectTrue
          ? "the statement is factually accurate and aligns with established knowledge"
          : "the statement contains factual errors or incorrect information"
      }.`;
    }
  } else if (question.type === 'short' || question.type === 'open_ended') {
    explanation = generateOpenEndedExplanation(questionText, correctAnswer, userAnswer);
  } else {
    explanation = generateContextualExplanation(questionText, correctAnswer, userAnswer);
  }

  const categoryTip = generateCategorySpecificTip(category, questionText, correctAnswer);
  explanation += ` ${categoryTip}`;

  return explanation;
};
