// AISubjectClassificationService.js
// AI-powered subject classification for quiz content
import logger from '../utils/logger';
import { API_BASE_URL } from '../config/api';

export class AISubjectClassificationService {
  static CACHE_KEY = 'ai_subject_classifications';
  static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // Standard academic subjects for classification
  static ACADEMIC_SUBJECTS = [
    'Mathematics', 'Science', 'Biology', 'Chemistry', 'Physics',
    'History', 'Literature', 'English', 'Geography', 'Economics',
    'Psychology', 'Philosophy', 'Art', 'Music', 'Computer Science',
    'Engineering', 'Business', 'Medicine', 'Law', 'Education',
    'Foreign Languages', 'Social Studies', 'Political Science',
    'Anthropology', 'Sociology', 'Statistics', 'Geology'
  ];

  /**
   * Classify quiz content using AI analysis
   * @param {Array} questions - Array of question objects
   * @param {Object} metadata - Quiz metadata
   * @returns {Promise<string>} - Detected subject
   */
  static async classifyQuizSubject(questions, metadata = {}) {
    try {
      // Quick cache check first
      const cacheKey = this.generateCacheKey(questions);
      const cached = await this.getCachedClassification(cacheKey);
      if (cached) {
        logger.info(`📊 Using cached AI subject classification: ${cached}`);
        return cached;
      }

      // Prepare content for AI analysis
      const quizContent = this.prepareQuizContent(questions, metadata);

      logger.info('🤖 Requesting AI subject classification...');

      // Call AI classification endpoint
      const classification = await this.requestAIClassification(quizContent);

      // Cache the result
      await this.cacheClassification(cacheKey, classification);

      logger.info(`✅ AI classified quiz subject as: ${classification}`);
      return classification;

    } catch (error) {
      logger.error('❌ AI subject classification failed:', error);
      // Fallback to basic keyword analysis
      return this.fallbackClassification(questions, metadata);
    }
  }

  /**
   * Prepare quiz content for AI analysis
   */
  static prepareQuizContent(questions, metadata) {
    const content = {
      title: metadata?.title || '',
      topic: metadata?.topic || metadata?.subject || '',
      questions: questions.slice(0, 5).map(q => ({ // Limit to first 5 questions
        text: q.text || q.questionText || '',
        options: (q.options || []).slice(0, 4), // Limit options
        type: q.type || 'multiple_choice'
      })),
      totalQuestions: questions.length
    };

    return content;
  }

  /**
   * Request AI classification from backend
   */
  static async requestAIClassification(quizContent) {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/classify-subject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: quizContent,
          subjects: this.ACADEMIC_SUBJECTS,
          max_tokens: 50
        }),
        timeout: 10000 // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`AI classification API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.subject && this.ACADEMIC_SUBJECTS.includes(result.subject)) {
        return result.subject;
      }

      // If AI returns custom subject, validate it
      if (result.subject && result.confidence > 0.7) {
        return result.subject;
      }

      throw new Error('AI classification returned low confidence result');

    } catch (error) {
      logger.error('❌ AI classification API call failed:', error);
      throw error;
    }
  }

  /**
   * Fallback classification using enhanced keyword analysis
   */
  static fallbackClassification(questions, metadata) {
    logger.info('🔄 Using fallback keyword classification...');

    // Use the same comprehensive mapping from ResultsScreen
    const subjectKeywords = {
      Mathematics: [
        'math', 'mathematics', 'algebra', 'calculus', 'geometry', 'arithmetic', 'equation',
        'trigonometry', 'statistics', 'probability', 'derivative', 'integral', 'polynomial',
        'calculate', 'solve', 'formula', 'sum', 'product', 'quotient'
      ],
      Science: [
        'physics', 'chemistry', 'biology', 'anatomy', 'molecule', 'cell', 'atom',
        'energy', 'force', 'reaction', 'organism', 'photosynthesis', 'evolution'
      ],
      History: [
        'history', 'historical', 'ancient', 'war', 'civilization', 'empire',
        'revolution', 'battle', 'president', 'constitution'
      ],
      Literature: [
        'literature', 'novel', 'poem', 'author', 'character', 'plot',
        'shakespeare', 'drama', 'story', 'narrative'
      ],
      Geography: [
        'geography', 'country', 'capital', 'continent', 'ocean', 'mountain',
        'climate', 'population', 'city', 'border'
      ],
      Computer_Science: [
        'programming', 'code', 'algorithm', 'software', 'computer', 'database',
        'function', 'variable', 'array', 'loop'
      ]
    };

    // Analyze all question content
    const allText = [
      metadata?.title || '',
      metadata?.topic || '',
      metadata?.subject || '',
      ...questions.map(q => `${q.text || q.questionText || ''} ${(q.options || []).join(' ')}`)
    ].join(' ').toLowerCase();

    // Score subjects based on keyword frequency
    const scores = {};
    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      let score = 0;
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = (allText.match(regex) || []).length;
        score += matches * (keyword.length > 4 ? 2 : 1);
      });
      scores[subject] = score;
    }

    // Find best match
    const bestMatch = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)[0];

    if (bestMatch && bestMatch[1] > 0) {
      logger.info(`📊 Fallback classification: ${bestMatch[0]} (score: ${bestMatch[1]})`);
      return bestMatch[0];
    }

    return 'General Knowledge';
  }

  /**
   * Cache management
   */
  static generateCacheKey(questions) {
    // Create a simple hash of first few question texts
    const content = questions.slice(0, 3)
      .map(q => q.text || q.questionText || '')
      .join('')
      .replace(/\s/g, '');

    return `ai_subject_${content.substring(0, 50)}`;
  }

  static async getCachedClassification(key) {
    try {
      const { AsyncStorage } = require('@react-native-async-storage/async-storage');
      const cached = await AsyncStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const cache = JSON.parse(cached);
        const entry = cache[key];

        if (entry && Date.now() - entry.timestamp < this.CACHE_DURATION) {
          return entry.subject;
        }
      }
      return null;
    } catch (error) {
      logger.error('Cache read error:', error);
      return null;
    }
  }

  static async cacheClassification(key, subject) {
    try {
      const { AsyncStorage } = require('@react-native-async-storage/async-storage');
      let cache = {};

      try {
        const cached = await AsyncStorage.getItem(this.CACHE_KEY);
        if (cached) cache = JSON.parse(cached);
      } catch (e) {
        // Ignore cache read errors
      }

      cache[key] = {
        subject,
        timestamp: Date.now()
      };

      // Keep only recent entries (max 100)
      const entries = Object.entries(cache);
      if (entries.length > 100) {
        const recent = entries
          .sort(([,a], [,b]) => b.timestamp - a.timestamp)
          .slice(0, 100);
        cache = Object.fromEntries(recent);
      }

      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      logger.error('Cache write error:', error);
    }
  }
}

export default AISubjectClassificationService;