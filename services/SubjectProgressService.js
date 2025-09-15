// services/SubjectProgressService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeaknessAnalysisService } from './WeaknessAnalysisService';
import HierarchicalSubjectService from './HierarchicalSubjectService'; // ✅ NEW: Hierarchical subjects
import logger from '../utils/logger';


export class SubjectProgressService {
  static PROGRESS_KEY = 'subject_progress';
  static SUBJECT_STATS_KEY = 'subject_statistics';
  static COURSE_PROGRESS_KEY = 'course_progress'; // ✅ NEW: Course-level progress
  static HIERARCHICAL_STATS_KEY = 'hierarchical_statistics'; // ✅ NEW: Hierarchical stats

  // Define subject categories and their sub-topics
  static SUBJECT_TAXONOMY = {
    mathematics: {
      name: 'Mathematics',
      icon: 'calculator',
      color: '#3498DB',
      subtopics: ['algebra', 'geometry', 'calculus', 'statistics', 'trigonometry', 'arithmetic']
    },
    science: {
      name: 'Science',
      icon: 'flask',
      color: '#28A745',
      subtopics: ['physics', 'chemistry', 'biology', 'earth_science', 'astronomy']
    },
    english: {
      name: 'English',
      icon: 'book',
      color: '#E74C3C',
      subtopics: ['grammar', 'vocabulary', 'reading_comprehension', 'writing', 'literature']
    },
    history: {
      name: 'History',
      icon: 'landmark',
      color: '#8E44AD',
      subtopics: ['world_history', 'us_history', 'government', 'civics', 'geography']
    },
    language_arts: {
      name: 'Language Arts',
      icon: 'pen-fancy',
      color: '#F39C12',
      subtopics: ['reading', 'writing', 'speaking', 'listening', 'critical_thinking']
    },
    test_prep: {
      name: 'Test Prep',
      icon: 'graduation-cap',
      color: '#9B59B6',
      subtopics: ['sat', 'act', 'gre', 'gmat', 'mcat', 'lsat', 'ap_exams']
    }
  };

  // ✅ NEW: Add helper functions to get default subject properties
  static getDefaultSubjectColor(subjectKey) {
    const colorMap = {
      mathematics: '#3498DB',
      science: '#28A745', 
      english: '#E74C3C',
      history: '#8E44AD',
      language_arts: '#F39C12',
      test_prep: '#9B59B6',
      general: '#95A5A6'
    };
    
    return colorMap[subjectKey] || '#9B59B6'; // Default purple
  }
  
  static getDefaultSubjectIcon(subjectKey) {
    const iconMap = {
      mathematics: 'calculator',
      science: 'flask',
      english: 'book', 
      history: 'landmark',
      language_arts: 'pen-fancy',
      test_prep: 'graduation-cap',
      general: 'lightbulb'
    };
    
    return iconMap[subjectKey] || 'book'; // Default book
  }

  // ✅ ENHANCED: Update both subject and course-level progress
  static async updateSubjectProgress(userId, quizResults) {
    try {
        logger.info('📊 Updating hierarchical subject progress...');
        logger.info('📊 Quiz results structure:', JSON.stringify(quizResults, null, 2)); // Debug log

        // ✅ NEW: Update hierarchical progress first
        await this.updateHierarchicalProgress(userId, quizResults);

        // ✅ FIX: Validate and normalize quizResults structure (legacy support)
        const normalizedResults = this.normalizeQuizResults(quizResults);
        
        if (!normalizedResults.answers || normalizedResults.answers.length === 0) {
            logger.warn('⚠️ No answers found in quiz results, skipping subject progress update');
            return;
        }

        // Extract subjects from quiz content
        const subjects = await this.identifyQuizSubjects(normalizedResults);
        
        // Get current progress data
        const currentProgress = await this.getSubjectProgress(userId);
        
        // Update progress for each identified subject
        for (const subject of subjects) {
            await this.updateIndividualSubject(userId, subject, normalizedResults, currentProgress);
        }

        // Calculate overall subject balance
        await this.calculateSubjectBalance(userId);

        // Generate subject-specific recommendations
        await this.generateSubjectRecommendations(userId);

        logger.info('✅ Subject progress updated successfully');

    } catch (error) {
        logger.error('❌ Error updating subject progress:', error);
        logger.error('❌ Quiz results that caused error:', JSON.stringify(quizResults, null, 2));
    }
  }

  // ✅ NEW: Add result normalization method
  static normalizeQuizResults(quizResults) {
      // Handle different possible data structures
      let normalized = {
          answers: [],
          score: 0,
          totalQuestions: 0,
          category: null,
          questions: []
      };
  
      // Check if quizResults has answers array
      if (quizResults.answers && Array.isArray(quizResults.answers)) {
          normalized.answers = quizResults.answers;
      }
      // Check if it has a different structure (like from your quiz system)
      else if (quizResults.results && quizResults.results.answers) {
          normalized.answers = quizResults.results.answers;
      }
      // Check if questions and user answers are separate
      else if (quizResults.questions && quizResults.userAnswers) {
          // Convert to expected format
          normalized.answers = quizResults.questions.map((question, index) => ({
              question: question.text || question.question,
              userAnswer: quizResults.userAnswers[index],
              correctAnswer: question.correctAnswer,
              isCorrect: quizResults.userAnswers[index] === question.correctAnswer,
              options: question.options
          }));
      }
      // Check if it's in a different format from your ResultsScreen
      else if (quizResults.quiz && quizResults.quiz.questions) {
          const questions = quizResults.quiz.questions;
          const userAnswers = quizResults.userAnswers || [];
          
          normalized.answers = questions.map((question, index) => ({
              question: question.text || question.question,
              userAnswer: userAnswers[index],
              correctAnswer: question.correctAnswer,
              isCorrect: userAnswers[index] === question.correctAnswer,
              options: question.options
          }));
      }
  
      // Extract other fields
      normalized.score = quizResults.score || quizResults.results?.score || 0;
      normalized.totalQuestions = quizResults.totalQuestions || quizResults.results?.totalQuestions || normalized.answers.length;
      normalized.category = quizResults.category || quizResults.metadata?.category;
  
      return normalized;
  }

  // ✅ Identify which subjects a quiz covers
  static async identifyQuizSubjects(quizResults) {
    const subjects = new Set();
    const content = this.extractQuizContent(quizResults);

    // Analyze quiz content against subject taxonomy
    Object.entries(this.SUBJECT_TAXONOMY).forEach(([subjectKey, subjectData]) => {
      let subjectScore = 0;
      const totalSubtopics = subjectData.subtopics.length;

      // Check how many subtopics are covered
      subjectData.subtopics.forEach(subtopic => {
        if (this.contentContainsTopic(content, subtopic)) {
          subjectScore++;
        }
      });

      // If quiz covers significant portion of subject (>= 30%), include it
      const coverage = subjectScore / totalSubtopics;
      if (coverage >= 0.3 || subjectScore >= 2) {
        subjects.add({
          key: subjectKey,
          name: subjectData.name,
          coverage: coverage,
          subtopicsFound: subjectScore,
          icon: subjectData.icon,
          color: subjectData.color
        });
      }
    });

    // If no specific subjects identified, categorize as general
    if (subjects.size === 0) {
      subjects.add({
        key: 'general',
        name: 'General Knowledge',
        coverage: 1.0,
        subtopicsFound: 1,
        icon: 'lightbulb',
        color: '#95A5A6'
      });
    }

    return Array.from(subjects);
  }

  // ✅ Extract content from quiz for analysis
  static extractQuizContent(quizResults) {
    let content = '';
    
    if (quizResults.questions) {
      content += quizResults.questions.map(q => q.text || q.question || '').join(' ');
    }
    
    if (quizResults.answers) {
      content += quizResults.answers.map(a => a.question || '').join(' ');
    }
    
    if (quizResults.category) {
      content += ' ' + quizResults.category;
    }

    return content.toLowerCase();
  }

  // ✅ Check if content contains specific topic keywords
  static contentContainsTopic(content, topic) {
    const topicKeywords = {
      // Mathematics
      algebra: ['algebra', 'equation', 'variable', 'polynomial', 'linear', 'quadratic'],
      geometry: ['triangle', 'circle', 'angle', 'area', 'perimeter', 'polygon', 'geometric'],
      calculus: ['derivative', 'integral', 'limit', 'function', 'calculus'],
      statistics: ['mean', 'median', 'mode', 'probability', 'statistics', 'data'],
      trigonometry: ['sine', 'cosine', 'tangent', 'trigonometry', 'triangle'],
      
      // Science
      physics: ['force', 'energy', 'momentum', 'velocity', 'physics', 'motion'],
      chemistry: ['atom', 'molecule', 'element', 'chemical', 'reaction', 'chemistry'],
      biology: ['cell', 'organism', 'dna', 'biology', 'life', 'evolution'],
      
      // English
      grammar: ['verb', 'noun', 'adjective', 'grammar', 'sentence', 'clause'],
      vocabulary: ['vocabulary', 'word', 'meaning', 'definition', 'synonym'],
      reading_comprehension: ['passage', 'reading', 'comprehension', 'author', 'main idea'],
      writing: ['essay', 'writing', 'paragraph', 'composition', 'argument'],
      
      // History
      world_history: ['empire', 'civilization', 'ancient', 'medieval', 'war'],
      us_history: ['america', 'constitution', 'president', 'civil war', 'independence'],
      
      // Test Prep
      sat: ['sat', 'college board', 'standardized test'],
      act: ['act test', 'american college testing'],
      ap_exams: ['advanced placement', 'ap exam', 'college level']
    };

    const keywords = topicKeywords[topic] || [topic];
    return keywords.some(keyword => content.includes(keyword));
  }

  // ✅ Update progress for individual subject
  static async updateIndividualSubject(userId, subject, quizResults, currentProgress) {
    const subjectKey = subject.key;
    
    // Initialize subject if it doesn't exist
    if (!currentProgress[subjectKey]) {
      currentProgress[subjectKey] = {
        name: subject.name,
        icon: subject.icon || this.getDefaultSubjectIcon(subjectKey), // ✅ FIXED: Always has icon
        color: subject.color || this.getDefaultSubjectColor(subjectKey), // ✅ FIXED: Always has color
        totalQuestions: 0,
        correctAnswers: 0,
        totalQuizzes: 0,
        averageScore: 0,
        lastActivity: null,
        weeklyProgress: [],
        strengths: [],
        weaknesses: [],
        trend: 'stable',
        consistency: 0
      };
    } else {
      // ✅ FIXED: Ensure existing subjects also have color and icon
      if (!currentProgress[subjectKey].color) {
        currentProgress[subjectKey].color = this.getDefaultSubjectColor(subjectKey);
      }
      if (!currentProgress[subjectKey].icon) {
        currentProgress[subjectKey].icon = this.getDefaultSubjectIcon(subjectKey);
      }
    }

    const subjectProgress = currentProgress[subjectKey];
    
    // Calculate performance for this quiz in this subject
    const subjectQuestions = this.filterQuestionsBySubject(quizResults, subject);
    const subjectCorrect = subjectQuestions.filter(q => q.isCorrect).length;
    
    // Update statistics
    subjectProgress.totalQuestions += subjectQuestions.length;
    subjectProgress.correctAnswers += subjectCorrect;
    subjectProgress.totalQuizzes += 1;
    subjectProgress.averageScore = (subjectProgress.correctAnswers / subjectProgress.totalQuestions) * 100;
    subjectProgress.lastActivity = new Date().toISOString();
    
    // Update weekly progress tracking
    this.updateWeeklyProgress(subjectProgress, subjectCorrect, subjectQuestions.length);
    
    // Calculate trend and consistency
    this.calculateSubjectTrend(subjectProgress);
    this.calculateConsistency(subjectProgress);
    
    // Update strengths and weaknesses within this subject
    await this.updateSubjectStrengthsWeaknesses(subjectProgress, subjectQuestions);
    
    // Save updated progress
    await AsyncStorage.setItem(`${this.PROGRESS_KEY}_${userId}`, JSON.stringify(currentProgress));
  }

  // ✅ Filter quiz questions that belong to specific subject
  static filterQuestionsBySubject(quizResults, subject) {
    if (!quizResults.answers) return [];
    
    return quizResults.answers.filter(answer => {
      const questionContent = (answer.question || '').toLowerCase();
      return subject.subtopics?.some(subtopic => 
        this.contentContainsTopic(questionContent, subtopic)
      ) || subject.coverage >= 0.7; // If high coverage, include all questions
    });
  }

  // ✅ Update weekly progress tracking
  static updateWeeklyProgress(subjectProgress, correct, total) {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekKey = weekStart.toISOString().split('T')[0];
    
    // Find or create current week entry
    let weekEntry = subjectProgress.weeklyProgress.find(week => week.week === weekKey);
    if (!weekEntry) {
      weekEntry = {
        week: weekKey,
        totalQuestions: 0,
        correctAnswers: 0,
        quizzesTaken: 0,
        averageScore: 0
      };
      subjectProgress.weeklyProgress.unshift(weekEntry);
    }
    
    // Update weekly stats
    weekEntry.totalQuestions += total;
    weekEntry.correctAnswers += correct;
    weekEntry.quizzesTaken += 1;
    weekEntry.averageScore = (weekEntry.correctAnswers / weekEntry.totalQuestions) * 100;
    
    // Keep only last 12 weeks
    subjectProgress.weeklyProgress = subjectProgress.weeklyProgress.slice(0, 12);
  }

  // ✅ Calculate subject trend (improving, declining, stable)
  static calculateSubjectTrend(subjectProgress) {
    const weeks = subjectProgress.weeklyProgress;
    if (weeks.length < 2) {
      subjectProgress.trend = 'stable';
      return;
    }
    
    const recent = weeks.slice(0, 2);
    const older = weeks.slice(2, 4);
    
    if (recent.length < 2 || older.length === 0) {
      subjectProgress.trend = 'stable';
      return;
    }
    
    const recentAvg = recent.reduce((sum, week) => sum + week.averageScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, week) => sum + week.averageScore, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 5) {
      subjectProgress.trend = 'improving';
    } else if (difference < -5) {
      subjectProgress.trend = 'declining';
    } else {
      subjectProgress.trend = 'stable';
    }
  }

  // ✅ Calculate consistency score (how regularly user studies this subject)
  static calculateConsistency(subjectProgress) {
    const weeks = subjectProgress.weeklyProgress;
    if (weeks.length === 0) {
      subjectProgress.consistency = 0;
      return;
    }
    
    const weeksWithActivity = weeks.filter(week => week.quizzesTaken > 0).length;
    const totalWeeks = Math.min(weeks.length, 8); // Last 8 weeks
    
    subjectProgress.consistency = (weeksWithActivity / totalWeeks) * 100;
  }

  // ✅ Update subject-specific strengths and weaknesses
  static async updateSubjectStrengthsWeaknesses(subjectProgress, questions) {
    // This integrates with your existing WeaknessAnalysisService
    const analysis = await WeaknessAnalysisService.analyzeQuizResults('temp', {
      answers: questions,
      score: questions.filter(q => q.isCorrect).length,
      totalQuestions: questions.length
    });
    
    if (analysis) {
      subjectProgress.strengths = analysis.weaknesses
        .filter(w => w.severity < 30)
        .map(w => w.topic);
      
      subjectProgress.weaknesses = analysis.weaknesses
        .filter(w => w.severity >= 50)
        .map(w => w.topic);
    }
  }

  // ✅ Calculate subject balance across all subjects
  static async calculateSubjectBalance(userId) {
    try {
      const progress = await this.getSubjectProgress(userId);
      const subjects = Object.keys(progress);
      
      if (subjects.length === 0) return;
      
      // Calculate activity balance
      const activityMap = new Map();
      const now = new Date();
      const twoWeeksAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
      
      subjects.forEach(subjectKey => {
        const subject = progress[subjectKey];
        const lastActivity = subject.lastActivity ? new Date(subject.lastActivity) : null;
        const daysSinceActivity = lastActivity 
          ? Math.floor((now - lastActivity) / (24 * 60 * 60 * 1000))
          : 999;
        
        activityMap.set(subjectKey, {
          name: subject.name,
          daysSinceActivity,
          averageScore: subject.averageScore,
          consistency: subject.consistency,
          trend: subject.trend,
          isNeglected: daysSinceActivity > 7,
          needsAttention: daysSinceActivity > 3 || subject.averageScore < 60
        });
      });
      
      // Save balance analysis
      const balanceAnalysis = {
        lastUpdated: now.toISOString(),
        totalSubjects: subjects.length,
        activeSubjects: Array.from(activityMap.values()).filter(s => !s.isNeglected).length,
        neglectedSubjects: Array.from(activityMap.values()).filter(s => s.isNeglected),
        needsAttention: Array.from(activityMap.values()).filter(s => s.needsAttention),
        subjectDetails: Object.fromEntries(activityMap)
      };
      
      await AsyncStorage.setItem(`${this.SUBJECT_STATS_KEY}_${userId}`, JSON.stringify(balanceAnalysis));
      
    } catch (error) {
      logger.error('Error calculating subject balance:', error);
    }
  }

  // ✅ Generate subject-specific recommendations
  static async generateSubjectRecommendations(userId) {
    try {
      const balance = await this.getSubjectBalance(userId);
      const recommendations = [];
      
      if (!balance) return;
      
      // Recommend attention for neglected subjects
      balance.neglectedSubjects.forEach(subject => {
        recommendations.push({
          type: 'neglected_subject',
          priority: 'high',
          subject: subject.name,
          message: `📚 It's been ${subject.daysSinceActivity} days since you studied ${subject.name}. Consider taking a quiz to stay sharp!`,
          action: 'take_quiz',
          subjectKey: Object.keys(balance.subjectDetails).find(key => 
            balance.subjectDetails[key].name === subject.name
          )
        });
      });
      
      // Recommend improvement for low-performing subjects
      balance.needsAttention.forEach(subject => {
        if (subject.averageScore < 60 && !subject.isNeglected) {
          recommendations.push({
            type: 'low_performance',
            priority: 'medium',
            subject: subject.name,
            message: `🎯 Your ${subject.name} average is ${subject.averageScore.toFixed(0)}%. Focus practice could help improve this!`,
            action: 'focus_practice',
            subjectKey: Object.keys(balance.subjectDetails).find(key => 
              balance.subjectDetails[key].name === subject.name
            )
          });
        }
      });
      
      // Save recommendations
      await AsyncStorage.setItem(`subject_recommendations_${userId}`, JSON.stringify(recommendations));
      
    } catch (error) {
      logger.error('Error generating subject recommendations:', error);
    }
  }

  // ✅ API methods for UI components
  static async getSubjectProgress(userId) {
    try {
      const data = await AsyncStorage.getItem(`${this.PROGRESS_KEY}_${userId}`);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      logger.error('Error getting subject progress:', error);
      return {};
    }
  }

  static async getSubjectBalance(userId) {
    try {
      const data = await AsyncStorage.getItem(`${this.SUBJECT_STATS_KEY}_${userId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting subject balance:', error);
      return null;
    }
  }

  static async getSubjectRecommendations(userId) {
    try {
      const data = await AsyncStorage.getItem(`subject_recommendations_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('Error getting subject recommendations:', error);
      return [];
    }
  }

  static async getSubjectSummary(userId) {
    try {
      const progress = await this.getSubjectProgress(userId);
      const balance = await this.getSubjectBalance(userId);
      
      return {
        totalSubjects: Object.keys(progress).length,
        activeSubjects: balance?.activeSubjects || 0,
        neglectedCount: balance?.neglectedSubjects?.length || 0,
        bestSubject: this.getBestPerformingSubject(progress),
        worstSubject: this.getWorstPerformingSubject(progress),
        overallBalance: this.calculateOverallBalance(progress)
      };
    } catch (error) {
      logger.error('Error getting subject summary:', error);
      return null;
    }
  }

  // ✅ Helper methods
  static getBestPerformingSubject(progress) {
    let best = null;
    let highestScore = 0;
    
    Object.entries(progress).forEach(([key, subject]) => {
      if (subject.averageScore > highestScore && subject.totalQuizzes >= 2) {
        highestScore = subject.averageScore;
        best = subject;
      }
    });
    
    return best;
  }

  static getWorstPerformingSubject(progress) {
    let worst = null;
    let lowestScore = 100;
    
    Object.entries(progress).forEach(([key, subject]) => {
      if (subject.averageScore < lowestScore && subject.totalQuizzes >= 2) {
        lowestScore = subject.averageScore;
        worst = subject;
      }
    });
    
    return worst;
  }

  static calculateOverallBalance(progress) {
    const subjects = Object.values(progress);
    if (subjects.length === 0) return 100;

    const consistencyScores = subjects.map(s => s.consistency || 0);
    const averageConsistency = consistencyScores.reduce((a, b) => a + b, 0) / subjects.length;

    return Math.round(averageConsistency);
  }

  // ✅ NEW: Hierarchical Progress Management Methods

  /**
   * Update hierarchical progress (Subject → Course → Topic)
   */
  static async updateHierarchicalProgress(userId, quizResults) {
    try {
      logger.info('🎯 Updating hierarchical progress...');

      // Extract hierarchical information from quiz results
      const { subject, course, topic, answers, score, totalQuestions } = quizResults;

      if (!subject) {
        logger.warn('No subject found in quiz results, skipping hierarchical update');
        return;
      }

      // Get current hierarchical progress
      const currentProgress = await this.getHierarchicalProgress(userId);

      // Update subject-level progress
      if (!currentProgress[subject]) {
        currentProgress[subject] = {
          name: subject,
          totalQuizzes: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          averageScore: 0,
          lastUpdated: new Date().toISOString(),
          courses: {},
          ...HierarchicalSubjectService.getHierarchyDisplayInfo(subject)
        };
      }

      // Update course-level progress
      if (course && !currentProgress[subject].courses[course]) {
        currentProgress[subject].courses[course] = {
          name: course,
          totalQuizzes: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          averageScore: 0,
          lastUpdated: new Date().toISOString(),
          topics: {}
        };
      }

      // Update topic-level progress
      if (topic && course && !currentProgress[subject].courses[course].topics[topic]) {
        currentProgress[subject].courses[course].topics[topic] = {
          name: topic,
          totalQuizzes: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          averageScore: 0,
          lastUpdated: new Date().toISOString()
        };
      }

      // Calculate statistics
      const correctCount = score || (answers ? answers.filter(a => a.isCorrect).length : 0);
      const totalCount = totalQuestions || (answers ? answers.length : 0);

      if (totalCount > 0) {
        // Update subject stats
        this.updateHierarchyNode(currentProgress[subject], correctCount, totalCount);

        // Update course stats
        if (course) {
          this.updateHierarchyNode(currentProgress[subject].courses[course], correctCount, totalCount);

          // Update topic stats
          if (topic) {
            this.updateHierarchyNode(currentProgress[subject].courses[course].topics[topic], correctCount, totalCount);
          }
        }
      }

      // Save updated progress
      await AsyncStorage.setItem(
        `${this.COURSE_PROGRESS_KEY}_${userId}`,
        JSON.stringify(currentProgress)
      );

      logger.info(`✅ Hierarchical progress updated: ${subject}${course ? ` → ${course}` : ''}${topic ? ` → ${topic}` : ''}`);

    } catch (error) {
      logger.error('❌ Error updating hierarchical progress:', error);
    }
  }

  /**
   * Update statistics for a hierarchy node (subject, course, or topic)
   */
  static updateHierarchyNode(node, correctCount, totalCount) {
    node.totalQuizzes += 1;
    node.totalQuestions += totalCount;
    node.correctAnswers += correctCount;
    node.averageScore = Math.round((node.correctAnswers / node.totalQuestions) * 100);
    node.lastUpdated = new Date().toISOString();

    // Calculate trend
    const newScore = Math.round((correctCount / totalCount) * 100);
    if (!node.recentScores) node.recentScores = [];
    node.recentScores.push(newScore);
    if (node.recentScores.length > 10) node.recentScores.shift();

    // Calculate trend direction
    if (node.recentScores.length >= 3) {
      const recent = node.recentScores.slice(-3);
      const trend = recent[2] - recent[0];
      node.trend = trend > 5 ? 'improving' : trend < -5 ? 'declining' : 'stable';
    }
  }

  /**
   * Get hierarchical progress data
   */
  static async getHierarchicalProgress(userId) {
    try {
      const stored = await AsyncStorage.getItem(`${this.COURSE_PROGRESS_KEY}_${userId}`);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      logger.error('Error getting hierarchical progress:', error);
      return {};
    }
  }

  /**
   * Get course-level progress for a specific subject
   */
  static async getCourseProgress(userId, subject) {
    const hierarchicalProgress = await this.getHierarchicalProgress(userId);
    return hierarchicalProgress[subject]?.courses || {};
  }

  /**
   * Get topic-level progress for a specific course
   */
  static async getTopicProgress(userId, subject, course) {
    const hierarchicalProgress = await this.getHierarchicalProgress(userId);
    return hierarchicalProgress[subject]?.courses?.[course]?.topics || {};
  }

  /**
   * Get recommendations based on hierarchical performance
   */
  static async getHierarchicalRecommendations(userId) {
    try {
      const progress = await this.getHierarchicalProgress(userId);
      const recommendations = [];

      Object.entries(progress).forEach(([subjectName, subject]) => {
        // Subject-level recommendations
        if (subject.averageScore < 70 && subject.totalQuizzes >= 2) {
          recommendations.push({
            type: 'subject_improvement',
            subject: subjectName,
            message: `Focus on improving ${subjectName} fundamentals`,
            priority: 'high',
            actionable: `Practice more ${subjectName} quizzes`
          });
        }

        // Course-level recommendations
        Object.entries(subject.courses || {}).forEach(([courseName, course]) => {
          if (course.averageScore < 60 && course.totalQuizzes >= 2) {
            recommendations.push({
              type: 'course_improvement',
              subject: subjectName,
              course: courseName,
              message: `Struggling with ${courseName}`,
              priority: 'medium',
              actionable: `Review ${courseName} concepts and practice more`
            });
          }

          if (course.trend === 'declining') {
            recommendations.push({
              type: 'course_trend',
              subject: subjectName,
              course: courseName,
              message: `Performance declining in ${courseName}`,
              priority: 'medium',
              actionable: `Revisit recent ${courseName} topics`
            });
          }
        });
      });

      return recommendations.sort((a, b) => {
        const priority = { high: 3, medium: 2, low: 1 };
        return priority[b.priority] - priority[a.priority];
      });

    } catch (error) {
      logger.error('Error getting hierarchical recommendations:', error);
      return [];
    }
  }
}

export default SubjectProgressService;