import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import logger from '../utils/logger';


export class FlashcardService {
  static STORAGE_KEYS = {
    FLASHCARDS: 'user_flashcards',
    STUDY_SESSIONS: 'flashcard_study_sessions',
    SPACED_REPETITION_DATA: 'spaced_repetition_data'
  };

  // Wait for authentication to be ready
  static async waitForAuth(maxWait = 5000) {
    return new Promise((resolve) => {
      if (auth.currentUser) {
        resolve(auth.currentUser);
        return;
      }

      let timeout;
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(user);
        }
      });

      timeout = setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, maxWait);
    });
  }

  // Test flashcard functionality
  static async testFlashcardSystem() {
    try {
      const user = await this.waitForAuth();
      if (!user) {
        logger.error('❌ No user authenticated for flashcard test');
        return false;
      }

      logger.info('🧪 Testing flashcard system...');
      
      // Test creating a sample flashcard
      const testFlashcard = [{
        id: `test_${Date.now()}`,
        userId: user.uid,
        source: 'test',
        subject: 'Test Subject',
        difficulty: 'medium',
        front: 'What is 2 + 2?',
        back: '4 - This is a basic arithmetic question.',
        interval: 0,
        repetitions: 0,
        easiness: 2.5,
        nextReviewDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastReviewedAt: null,
        reviewCount: 0,
        averageQuality: 0,
        tags: ['math', 'basic']
      }];

      const saved = await this.saveFlashcards(user.uid, testFlashcard);
      if (saved) {
        logger.info('✅ Flashcard save test passed');
        
        // Test retrieving flashcards
        const retrieved = await this.getUserFlashcards(user.uid);
        if (retrieved.length > 0) {
          logger.info('✅ Flashcard retrieval test passed');
          logger.info('✅ Flashcard system is working correctly');
          return true;
        }
      }
      
      logger.error('❌ Flashcard system test failed');
      return false;
    } catch (error) {
      logger.error('❌ Flashcard system test error:', error);
      return false;
    }
  }

  // Spaced Repetition Algorithm (SuperMemo SM-2 based)
  static calculateNextReviewDate(quality, interval, easiness, repetitions) {
    // Quality: 0-5 scale (0 = total blackout, 5 = perfect response)
    // Interval: current interval in days
    // Easiness: ease factor (default 2.5)
    // Repetitions: number of consecutive correct responses
    
    let newEasiness = easiness;
    let newInterval = interval;
    let newRepetitions = repetitions;

    if (quality >= 3) {
      // Correct response
      newRepetitions += 1;
      
      if (newRepetitions === 1) {
        newInterval = 1;
      } else if (newRepetitions === 2) {
        newInterval = 6;
      } else {
        newInterval = Math.ceil(interval * newEasiness);
      }
      
      // Adjust easiness factor
      newEasiness = Math.max(1.3, newEasiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    } else {
      // Incorrect response - restart
      newRepetitions = 0;
      newInterval = 1;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

    return {
      nextReviewDate,
      interval: newInterval,
      easiness: newEasiness,
      repetitions: newRepetitions
    };
  }

  // Generate flashcards from quiz mistakes with better validation
  static async generateFlashcardsFromMistakes(userId, quizResults) {
    try {
      // Validate inputs
      if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
        throw new Error('Invalid user authentication');
      }

      if (!quizResults || !quizResults.questions) {
        throw new Error('Invalid quiz results provided');
      }

      logger.info(`🔄 Generating flashcards from quiz mistakes for user: ${userId}`);
      
      const flashcards = [];
      const incorrectQuestions = quizResults.questions.filter(q => !q.isCorrect);
      
      logger.info(`📊 Found ${incorrectQuestions.length} incorrect questions to convert`);

      // Get existing flashcards to avoid duplicates
      const existingFlashcards = await this.getUserFlashcards(userId);
      const existingQuestionIds = new Set(
        existingFlashcards
          .filter(card => card.source === 'quiz_mistake' && card.originalQuestion?.id)
          .map(card => card.originalQuestion.id)
      );

      for (const question of incorrectQuestions) {
        // Skip if question doesn't have enough content
        if (!question.questionText && !question.text) {
          logger.warn('⚠️ Skipping question without text:', question.id);
          continue;
        }

        // Skip if flashcard already exists for this question
        if (question.id && existingQuestionIds.has(question.id)) {
          logger.info(`⏭️ Skipping duplicate flashcard for question: ${question.id}`);
          continue;
        }

        const flashcard = {
          id: `mistake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          source: 'quiz_mistake',
          subject: question.subject || quizResults.metadata?.subject || 'General',
          difficulty: question.difficulty || quizResults.metadata?.difficulty || 'medium',
          
          // Flashcard content with proper text cleaning
          front: this.cleanQuestionText(question.questionText || question.text || question.question),
          back: this.generateAnswerExplanation(question),
          
          // Spaced repetition data
          interval: 0,
          repetitions: 0,
          easiness: 2.5,
          nextReviewDate: new Date(),
          
          // Metadata
          createdAt: new Date(),
          updatedAt: new Date(),
          lastReviewedAt: null,
          reviewCount: 0,
          averageQuality: 0,
          tags: this.extractTagsFromQuestion(question),
          
          // Original question reference
          originalQuestion: {
            id: question.id,
            correctAnswer: question.correctAnswer,
            userAnswer: question.userAnswer,
            options: question.options || []
          }
        };

        flashcards.push(flashcard);
      }

      if (flashcards.length === 0) {
        logger.info('ℹ️ No flashcards to generate from quiz results');
        return [];
      }

      // Save to Firestore and local storage
      const success = await this.saveFlashcards(userId, flashcards);
      
      if (success) {
        logger.info(`✅ Generated ${flashcards.length} flashcards from quiz mistakes`);
        return flashcards;
      } else {
        throw new Error('Failed to save generated flashcards');
      }

    } catch (error) {
      logger.error('❌ Error generating flashcards from mistakes:', error);
      throw error;
    }
  }

  // Generate flashcards from recent quiz mistakes
  static async generateFlashcardsFromRecentMistakes(userId, daysBack = 7) {
    try {
      if (!auth.currentUser || auth.currentUser.uid !== userId) {
        throw new Error('Invalid user authentication');
      }

      logger.info(`🔍 Looking for quiz mistakes from the last ${daysBack} days...`);

      // Import QuizHistoryManager dynamically to avoid circular dependency
      const { QuizHistoryManager } = await import('./QuizHistoryManager');
      
      // Get recent quiz history
      const recentHistory = await QuizHistoryManager.getRecentHistory(userId, daysBack);
      
      if (!recentHistory || recentHistory.length === 0) {
        logger.info('📝 No recent quiz history found');
        return [];
      }

      logger.info(`📊 Found ${recentHistory.length} recent quiz attempts`);

      const allFlashcards = [];
      
      for (const quizRecord of recentHistory) {
        if (!quizRecord.questions || !Array.isArray(quizRecord.questions)) {
          continue;
        }

        // Find questions that were answered incorrectly
        const incorrectQuestions = quizRecord.questions.filter(q => 
          q.userAnswer && q.correctAnswer && q.userAnswer !== q.correctAnswer
        );

        if (incorrectQuestions.length === 0) {
          continue;
        }

        logger.info(`❌ Found ${incorrectQuestions.length} mistakes in quiz: ${quizRecord.id}`);

        // Generate flashcards from mistakes
        const quizResults = {
          questions: incorrectQuestions.map(q => ({
            ...q,
            isCorrect: false,
            subject: q.subject || quizRecord.metadata?.category || quizRecord.category,
            difficulty: q.difficulty || quizRecord.difficulty
          })),
          metadata: quizRecord.metadata || {}
        };

        const newFlashcards = await this.generateFlashcardsFromMistakes(userId, quizResults);
        allFlashcards.push(...newFlashcards);
      }

      logger.info(`✅ Generated ${allFlashcards.length} flashcards from recent mistakes`);
      return allFlashcards;

    } catch (error) {
      logger.error('❌ Error generating flashcards from recent mistakes:', error);
      throw error;
    }
  }

  // Generate flashcards from uploaded documents
  static async generateFlashcardsFromDocument(userId, documentText, subject, difficulty = 'medium') {
    try {
      // This would integrate with your AI service to extract key concepts
      const concepts = this.extractKeyConceptsFromText(documentText);
      const flashcards = [];

      for (const concept of concepts) {
        const flashcard = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          source: 'document_upload',
          subject,
          difficulty,
          
          front: concept.question || concept.term,
          back: concept.definition || concept.explanation,
          
          interval: 0,
          repetitions: 0,
          easiness: 2.5,
          nextReviewDate: new Date(),
          
          createdAt: new Date(),
          lastReviewedAt: null,
          reviewCount: 0,
          averageQuality: 0,
          tags: concept.tags || [],
          
          originalDocument: {
            excerpt: concept.context,
            confidence: concept.confidence || 0.8
          }
        };

        flashcards.push(flashcard);
      }

      await this.saveFlashcards(userId, flashcards);
      return flashcards;

    } catch (error) {
      logger.error('❌ Error generating flashcards from document:', error);
      throw error;
    }
  }

  // Save flashcards to both Firestore and local storage with better error handling
  static async saveFlashcards(userId, flashcards) {
    try {
      // Ensure user is authenticated
      if (!auth.currentUser || auth.currentUser.uid !== userId) {
        throw new Error('User not authenticated or ID mismatch');
      }

      logger.info(`💾 Saving ${flashcards.length} flashcards for user: ${userId}`);
      
      // Save to Firestore with individual error handling
      const savedFlashcards = [];
      for (const flashcard of flashcards) {
        try {
          // Ensure userId is set correctly
          const flashcardToSave = {
            ...flashcard,
            userId, // Ensure userId is always set
            createdAt: flashcard.createdAt || new Date(),
            updatedAt: new Date()
          };
          
          const docRef = await addDoc(collection(db, 'flashcards'), flashcardToSave);
          savedFlashcards.push({
            ...flashcardToSave,
            firestoreId: docRef.id
          });
          logger.info(`✅ Saved flashcard: ${flashcard.id}`);
        } catch (cardError) {
          logger.error(`❌ Error saving individual flashcard ${flashcard.id}:`, cardError);
          // Continue with other flashcards
        }
      }

      // Update local cache with saved flashcards
      const existingFlashcards = await this.getLocalFlashcards(userId) || [];
      const updatedFlashcards = [...existingFlashcards, ...savedFlashcards];
      
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.FLASHCARDS}_${userId}`, 
        JSON.stringify(updatedFlashcards)
      );

      logger.info(`✅ Successfully saved ${savedFlashcards.length}/${flashcards.length} flashcards`);
      return savedFlashcards.length > 0;
    } catch (error) {
      logger.error('❌ Error saving flashcards:', error);
      
      // Save locally as fallback
      try {
        const existingFlashcards = await this.getLocalFlashcards(userId) || [];
        const updatedFlashcards = [...existingFlashcards, ...flashcards];
        await AsyncStorage.setItem(
          `${this.STORAGE_KEYS.FLASHCARDS}_${userId}`, 
          JSON.stringify(updatedFlashcards)
        );
        logger.info('💾 Saved flashcards to local storage as fallback');
        return true;
      } catch (localError) {
        logger.error('❌ Error saving to local storage:', localError);
        throw error;
      }
    }
  }

  // Get flashcards due for review
  static async getFlashcardsDueForReview(userId) {
    try {
      const allFlashcards = await this.getUserFlashcards(userId);
      const now = new Date();
      
      const dueFlashcards = allFlashcards.filter(card => {
        const reviewDate = new Date(card.nextReviewDate);
        return reviewDate <= now;
      });

      // Sort by priority: overdue cards first, then by difficulty
      dueFlashcards.sort((a, b) => {
        const aOverdue = new Date(a.nextReviewDate) < now;
        const bOverdue = new Date(b.nextReviewDate) < now;
        
        if (aOverdue !== bOverdue) {
          return aOverdue ? -1 : 1;
        }
        
        // If both overdue or both due, sort by difficulty (hard cards first)
        const difficultyOrder = { 'hard': 3, 'medium': 2, 'easy': 1 };
        return (difficultyOrder[b.difficulty] || 2) - (difficultyOrder[a.difficulty] || 2);
      });

      logger.info(`📅 Found ${dueFlashcards.length} flashcards due for review`);
      return dueFlashcards;
    } catch (error) {
      logger.error('❌ Error getting flashcards due for review:', error);
      return [];
    }
  }

  // Get struggling flashcards (low average quality)
  static async getStrugglingFlashcards(userId) {
    try {
      const allFlashcards = await this.getUserFlashcards(userId);
      
      const strugglingCards = allFlashcards.filter(card => 
        card.averageQuality < 3 && card.reviewCount > 0
      );

      // Sort by worst performance first
      strugglingCards.sort((a, b) => {
        if (a.averageQuality !== b.averageQuality) {
          return a.averageQuality - b.averageQuality;
        }
        // If same quality, prioritize cards reviewed more often (more data)
        return b.reviewCount - a.reviewCount;
      });

      logger.info(`😰 Found ${strugglingCards.length} struggling flashcards`);
      return strugglingCards;
    } catch (error) {
      logger.error('❌ Error getting struggling flashcards:', error);
      return [];
    }
  }

  // Get flashcards by study mode
  static async getFlashcardsByMode(userId, mode, filters = {}) {
    try {
      logger.info(`📚 Getting flashcards for mode: ${mode}`);
      
      let flashcards = [];
      
      switch (mode) {
        case 'due':
          flashcards = await this.getFlashcardsDueForReview(userId);
          break;
        case 'struggling':
          flashcards = await this.getStrugglingFlashcards(userId);
          break;
        case 'review':
        default:
          flashcards = await this.getUserFlashcards(userId, filters);
          break;
      }

      return flashcards;
    } catch (error) {
      logger.error(`❌ Error getting flashcards for mode ${mode}:`, error);
      return [];
    }
  }

  // Record flashcard review result
  static async recordFlashcardReview(userId, flashcardId, quality) {
    try {
      const flashcards = await this.getUserFlashcards(userId);
      const flashcardIndex = flashcards.findIndex(card => card.id === flashcardId);
      
      if (flashcardIndex === -1) {
        throw new Error('Flashcard not found');
      }

      const flashcard = flashcards[flashcardIndex];
      
      // Calculate next review using spaced repetition
      const reviewData = this.calculateNextReviewDate(
        quality,
        flashcard.interval,
        flashcard.easiness,
        flashcard.repetitions
      );

      // Update flashcard data
      const updatedFlashcard = {
        ...flashcard,
        ...reviewData,
        lastReviewedAt: new Date(),
        reviewCount: flashcard.reviewCount + 1,
        averageQuality: ((flashcard.averageQuality * flashcard.reviewCount) + quality) / (flashcard.reviewCount + 1)
      };

      flashcards[flashcardIndex] = updatedFlashcard;

      // Save to both local and Firestore
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.FLASHCARDS}_${userId}`, 
        JSON.stringify(flashcards)
      );

      // Update Firestore (you'd need to implement flashcard document ID tracking)
      // await updateDoc(doc(db, 'flashcards', flashcard.firestoreId), updatedFlashcard);

      logger.info(`✅ Recorded review for flashcard ${flashcardId}, quality: ${quality}, next review: ${reviewData.nextReviewDate.toDateString()}`);
      
      return updatedFlashcard;
    } catch (error) {
      logger.error('❌ Error recording flashcard review:', error);
      throw error;
    }
  }

  // Get user's flashcards with filtering and authentication check
  static async getUserFlashcards(userId, filters = {}) {
    try {
      // Ensure user is authenticated
      if (!auth.currentUser || !userId) {
        logger.warn('⚠️ User not authenticated, returning empty flashcards');
        return [];
      }

      logger.info(`📚 Getting flashcards for user: ${userId} with filters:`, filters);
      
      // Try local cache first for better performance
      let flashcards = await this.getLocalFlashcards(userId);
      logger.info(`📱 Found ${flashcards.length} flashcards in local cache`);
      
      // If no local data or local data is old, fetch from Firestore
      if (!flashcards || flashcards.length === 0) {
        logger.info('🔄 No local flashcards found, fetching from Firestore...');
        flashcards = await this.getFlashcardsFromFirestore(userId);
      }

      // Apply filters
      let filteredCards = [...flashcards];
      
      if (filters.subject) {
        filteredCards = filteredCards.filter(card => 
          card.subject && card.subject.toLowerCase().includes(filters.subject.toLowerCase())
        );
      }

      if (filters.difficulty) {
        filteredCards = filteredCards.filter(card => card.difficulty === filters.difficulty);
      }

      if (filters.source) {
        filteredCards = filteredCards.filter(card => card.source === filters.source);
      }

      logger.info(`✅ Returning ${filteredCards.length} filtered flashcards`);
      return filteredCards;
    } catch (error) {
      logger.error('❌ Error getting user flashcards:', error);
      return [];
    }
  }

  // Get flashcards from local storage
  static async getLocalFlashcards(userId) {
    try {
      const cached = await AsyncStorage.getItem(`${this.STORAGE_KEYS.FLASHCARDS}_${userId}`);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      logger.error('❌ Error getting local flashcards:', error);
      return [];
    }
  }

  // Get flashcards from Firestore with better error handling
  static async getFlashcardsFromFirestore(userId) {
    try {
      // Check if user is authenticated
      if (!auth.currentUser) {
        logger.warn('⚠️ User not authenticated, returning empty flashcards');
        return [];
      }

      if (!userId || userId !== auth.currentUser.uid) {
        logger.warn('⚠️ User ID mismatch, returning empty flashcards');
        return [];
      }

      logger.info(`🔍 Fetching flashcards for user: ${userId}`);
      const q = query(collection(db, 'flashcards'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const flashcards = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        flashcards.push({ 
          id: data.id || docSnapshot.id, 
          firestoreId: docSnapshot.id, 
          ...data 
        });
      });

      logger.info(`✅ Successfully fetched ${flashcards.length} flashcards from Firestore`);

      // Update local cache
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.FLASHCARDS}_${userId}`, 
        JSON.stringify(flashcards)
      );

      return flashcards;
    } catch (error) {
      logger.error('❌ Error getting flashcards from Firestore:', error);
      
      // Return local cache as fallback
      try {
        const cachedData = await this.getLocalFlashcards(userId);
        logger.info(`🔄 Returning ${cachedData.length} cached flashcards as fallback`);
        return cachedData;
      } catch (cacheError) {
        logger.error('❌ Error getting cached flashcards:', cacheError);
        return [];
      }
    }
  }

  // Get study statistics
  static async getStudyStatistics(userId) {
    try {
      const flashcards = await this.getUserFlashcards(userId);
      const now = new Date();
      
      const stats = {
        totalFlashcards: flashcards.length,
        dueToday: flashcards.filter(card => new Date(card.nextReviewDate) <= now).length,
        masteringCards: flashcards.filter(card => card.repetitions >= 3).length,
        strugglingCards: flashcards.filter(card => card.averageQuality < 3).length,
        dailyStreak: await this.getDailyStreak(userId),
        subjectBreakdown: this.getSubjectBreakdown(flashcards),
        weeklyProgress: await this.getWeeklyProgress(userId)
      };

      return stats;
    } catch (error) {
      logger.error('❌ Error getting study statistics:', error);
      return {
        totalFlashcards: 0,
        dueToday: 0,
        masteringCards: 0,
        strugglingCards: 0,
        dailyStreak: 0,
        subjectBreakdown: {},
        weeklyProgress: []
      };
    }
  }

  // Helper methods - Generate clean, educational answer explanations
  static generateAnswerExplanation(question) {
    // If we have a proper explanation, use it as the main content
    if (question.explanation && typeof question.explanation === 'string' && question.explanation.length > 20) {
      return {
        correctAnswer: this.formatAnswerDisplay(question.correctAnswer),
        userAnswer: this.formatAnswerDisplay(question.userAnswer),
        explanation: question.explanation,
        options: question.options && Array.isArray(question.options) ? question.options : null,
        hasUserMistake: question.userAnswer && question.userAnswer !== question.correctAnswer
      };
    }

    // Generate a clean, simple explanation
    const correctAnswer = this.formatAnswerDisplay(question.correctAnswer);
    const userAnswer = this.formatAnswerDisplay(question.userAnswer);
    
    let explanation = '';
    
    // Create a meaningful explanation based on the question type
    if (question.subject) {
      explanation = `This ${question.subject} concept is important for understanding the field.`;
    } else {
      explanation = 'Understanding this concept will help you in future questions.';
    }
    
    return {
      correctAnswer,
      userAnswer,
      explanation,
      options: question.options && Array.isArray(question.options) ? question.options : null,
      hasUserMistake: userAnswer && userAnswer !== correctAnswer && question.userAnswer !== question.correctAnswer
    };
  }

  // Clean and format question text
  static cleanQuestionText(text) {
    if (!text) return 'No question text available';
    
    if (typeof text === 'object') {
      // Extract text from object
      return text.text || text.content || text.value || text.question || JSON.stringify(text);
    }
    
    if (typeof text !== 'string') {
      return String(text);
    }
    
    // Clean up common encoding issues and formatting
    return text
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim() || 'No question text available';
  }

  // Format individual answers for clean display
  static formatAnswerDisplay(answer) {
    if (answer === null || answer === undefined) {
      return 'No answer provided';
    }
    
    if (typeof answer === 'boolean') {
      return answer ? 'True' : 'False';
    }
    
    if (typeof answer === 'object') {
      // Handle option objects
      if (answer.text) {
        return this.cleanQuestionText(answer.text);
      }
      if (answer.label && answer.value) {
        return `${answer.label}) ${this.cleanQuestionText(answer.value)}`;
      }
      if (answer.value) {
        return this.cleanQuestionText(answer.value);
      }
      if (answer.content) {
        return this.cleanQuestionText(answer.content);
      }
      // Fallback for other objects
      return JSON.stringify(answer);
    }
    
    return this.cleanQuestionText(String(answer));
  }

  // Format multiple choice options cleanly
  static formatOptionsDisplay(options, correctAnswer, userAnswer) {
    if (!options || !Array.isArray(options)) {
      return '';
    }

    let optionsText = '**Answer Choices:**\n';
    
    options.forEach((option, index) => {
      let optionText = '';
      let isCorrect = false;
      let isUserChoice = false;
      
      // Handle different option formats
      if (typeof option === 'string') {
        optionText = option;
        isCorrect = option === correctAnswer;
        isUserChoice = option === userAnswer;
      } else if (typeof option === 'object' && option !== null) {
        if (option.text) {
          optionText = option.text;
          isCorrect = option.text === correctAnswer || option === correctAnswer;
          isUserChoice = option.text === userAnswer || option === userAnswer;
        } else if (option.label && option.value) {
          optionText = `${option.label}) ${option.value}`;
          isCorrect = option.value === correctAnswer || option === correctAnswer;
          isUserChoice = option.value === userAnswer || option === userAnswer;
        } else {
          optionText = JSON.stringify(option);
        }
      } else {
        optionText = String(option);
        isCorrect = option === correctAnswer;
        isUserChoice = option === userAnswer;
      }
      
      // Add appropriate emoji indicators
      let indicator = '  ';
      if (isCorrect && isUserChoice) {
        indicator = '✅'; // Correct and chosen
      } else if (isCorrect) {
        indicator = '🟢'; // Correct answer
      } else if (isUserChoice) {
        indicator = '❌'; // Wrong choice
      } else {
        indicator = '⚪'; // Other option
      }
      
      optionsText += `${indicator} ${String.fromCharCode(65 + index)}) ${optionText}\n`;
    });

    return optionsText;
  }

  static extractTagsFromQuestion(question) {
    const tags = [];
    
    // Add subject as tag
    if (question.subject) {
      tags.push(question.subject.toLowerCase());
    }

    // Add difficulty as tag
    if (question.difficulty) {
      tags.push(question.difficulty);
    }

    // Extract key terms from question text
    const questionText = (question.questionText || question.text || '').toLowerCase();
    const keyTerms = questionText.match(/\b[a-zA-Z]{4,}\b/g) || [];
    
    // Add most relevant terms as tags
    const relevantTerms = keyTerms
      .filter(term => !['what', 'which', 'where', 'when', 'correct', 'following'].includes(term))
      .slice(0, 3);
    
    tags.push(...relevantTerms);

    return [...new Set(tags)]; // Remove duplicates
  }

  static extractKeyConceptsFromText(text) {
    // This is a simplified implementation
    // In a real app, you'd use NLP or AI to extract concepts
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const concepts = [];

    for (let i = 0; i < Math.min(sentences.length, 10); i++) {
      const sentence = sentences[i].trim();
      if (sentence.length > 30) {
        concepts.push({
          question: `What is: ${sentence.substring(0, 50)}...?`,
          definition: sentence,
          context: sentences.slice(Math.max(0, i-1), i+2).join('. '),
          confidence: 0.7,
          tags: []
        });
      }
    }

    return concepts;
  }

  static getSubjectBreakdown(flashcards) {
    const breakdown = {};
    flashcards.forEach(card => {
      const subject = card.subject || 'Unknown';
      breakdown[subject] = (breakdown[subject] || 0) + 1;
    });
    return breakdown;
  }

  static async getDailyStreak(userId) {
    // Implementation for tracking daily study streaks
    try {
      const sessions = await AsyncStorage.getItem(`${this.STORAGE_KEYS.STUDY_SESSIONS}_${userId}`);
      if (!sessions) return 0;

      const sessionData = JSON.parse(sessions);
      const today = new Date().toDateString();
      let streak = 0;
      let currentDate = new Date();

      while (true) {
        const dateStr = currentDate.toDateString();
        if (sessionData[dateStr]) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      logger.error('❌ Error getting daily streak:', error);
      return 0;
    }
  }

  static async getWeeklyProgress(userId) {
    // Implementation for weekly progress tracking
    const weekData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      weekData.push({
        date: date.toDateString(),
        cardsStudied: 0, // This would be calculated from actual study sessions
        timeSpent: 0
      });
    }

    return weekData;
  }

  // Record study session
  static async recordStudySession(userId, sessionData) {
    try {
      const today = new Date().toDateString();
      const sessions = await AsyncStorage.getItem(`${this.STORAGE_KEYS.STUDY_SESSIONS}_${userId}`) || '{}';
      const sessionHistory = JSON.parse(sessions);

      sessionHistory[today] = {
        ...(sessionHistory[today] || {}),
        cardsStudied: (sessionHistory[today]?.cardsStudied || 0) + sessionData.cardsStudied,
        timeSpent: (sessionHistory[today]?.timeSpent || 0) + sessionData.timeSpent,
        timestamp: new Date().toISOString()
      };

      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.STUDY_SESSIONS}_${userId}`, 
        JSON.stringify(sessionHistory)
      );

      logger.info(`✅ Recorded study session: ${sessionData.cardsStudied} cards, ${sessionData.timeSpent}s`);
    } catch (error) {
      logger.error('❌ Error recording study session:', error);
    }
  }
}