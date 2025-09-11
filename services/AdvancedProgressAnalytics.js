// AdvancedProgressAnalytics.js - Enhanced analytics for progress tracking
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';


export class AdvancedProgressAnalytics {
  
  // =============================
  // 🎯 STREAK PREDICTIONS
  // =============================
  
  static predictStreakContinuation(quizHistory, currentStreak) {
    if (quizHistory.length < 3) {
      return {
        likelihood: 50,
        confidence: 'low',
        recommendation: 'Take more quizzes to establish a pattern',
        streakForecast: {
          nextWeek: currentStreak + 2,
          nextMonth: currentStreak + 8,
          confidence: 30
        }
      };
    }

    // Analyze recent activity patterns
    const recentQuizzes = quizHistory.slice(-14); // Last 14 quizzes
    const daysBetweenQuizzes = this.calculateDaysBetweenQuizzes(recentQuizzes);
    const averageGap = daysBetweenQuizzes.reduce((sum, gap) => sum + gap, 0) / daysBetweenQuizzes.length;
    const consistency = this.calculateConsistencyScore(daysBetweenQuizzes);
    
    // Performance trend analysis
    const recentScores = recentQuizzes.map(q => q.results?.percentage || 0);
    const performanceTrend = this.calculateTrend(recentScores);
    
    // Predict likelihood based on multiple factors
    let likelihood = 50;
    
    // Consistency factor (40% weight)
    likelihood += (consistency - 0.5) * 40;
    
    // Performance trend factor (30% weight)
    if (performanceTrend > 0) likelihood += 15;
    else if (performanceTrend < -5) likelihood -= 20;
    
    // Recent activity factor (30% weight)
    if (averageGap <= 1) likelihood += 25;
    else if (averageGap <= 2) likelihood += 10;
    else if (averageGap > 5) likelihood -= 15;
    
    // Cap likelihood between 5-95%
    likelihood = Math.max(5, Math.min(95, likelihood));
    
    const confidence = likelihood > 70 ? 'high' : likelihood > 40 ? 'medium' : 'low';
    
    return {
      likelihood: Math.round(likelihood),
      confidence,
      recommendation: this.getStreakRecommendation(likelihood, averageGap, performanceTrend),
      streakForecast: this.forecastStreak(currentStreak, likelihood, averageGap),
      factors: {
        consistency: Math.round(consistency * 100),
        averageGap: Math.round(averageGap * 10) / 10,
        performanceTrend: Math.round(performanceTrend * 10) / 10
      }
    };
  }

  static calculateDaysBetweenQuizzes(quizzes) {
    const gaps = [];
    for (let i = 1; i < quizzes.length; i++) {
      const prevDate = new Date(quizzes[i-1].metadata?.completedAt);
      const currDate = new Date(quizzes[i].metadata?.completedAt);
      const daysDiff = (currDate - prevDate) / (24 * 60 * 60 * 1000);
      gaps.push(daysDiff);
    }
    return gaps;
  }

  static calculateConsistencyScore(gaps) {
    if (gaps.length === 0) return 0.5;
    
    const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - mean, 2), 0) / gaps.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    // Normalize to 0-1 scale
    return Math.max(0, Math.min(1, 1 - (stdDev / (mean + 1))));
  }

  static getStreakRecommendation(likelihood, averageGap, trend) {
    if (likelihood > 70) {
      return "You're on fire! 🔥 Keep up the excellent routine.";
    } else if (likelihood > 50) {
      if (averageGap > 3) {
        return "Try to reduce gaps between study sessions for better momentum.";
      } else {
        return "Good progress! Consider setting daily study reminders.";
      }
    } else {
      if (trend < -5) {
        return "Focus on easier topics to rebuild confidence and momentum.";
      } else {
        return "Establish a consistent daily study routine to build momentum.";
      }
    }
  }

  static forecastStreak(currentStreak, likelihood, averageGap) {
    const probabilityMultiplier = likelihood / 100;
    const gapPenalty = Math.max(0.5, 1 - (averageGap - 1) * 0.2);
    
    const nextWeekGrowth = Math.round(7 * probabilityMultiplier * gapPenalty);
    const nextMonthGrowth = Math.round(30 * probabilityMultiplier * gapPenalty * 0.8); // Slightly pessimistic for longer term
    
    return {
      nextWeek: currentStreak + nextWeekGrowth,
      nextMonth: currentStreak + nextMonthGrowth,
      confidence: Math.round(likelihood * 0.8) // Slightly lower confidence for forecasts
    };
  }

  // =============================
  // 🎯 GOAL SETTING SYSTEM
  // =============================

  static async getUserGoals(userId) {
    try {
      const goalsData = await AsyncStorage.getItem(`userGoals_${userId}`);
      return goalsData ? JSON.parse(goalsData) : this.getDefaultGoals();
    } catch (error) {
      logger.error('Error loading user goals:', error);
      return this.getDefaultGoals();
    }
  }

  static getDefaultGoals() {
    return {
      streakGoals: {
        weekly: { target: 7, current: 0, achieved: false },
        monthly: { target: 30, current: 0, achieved: false },
        yearly: { target: 365, current: 0, achieved: false }
      },
      scoreGoals: {
        averageScore: { target: 80, current: 0, achieved: false },
        perfectScores: { target: 5, current: 0, achieved: false },
        improvement: { target: 10, current: 0, achieved: false } // % improvement
      },
      subjectGoals: {
        subjectsToMaster: { target: 3, current: 0, achieved: false },
        weaknessesToImprove: { target: 2, current: 0, achieved: false }
      },
      timeGoals: {
        dailyStudyTime: { target: 30, current: 0, achieved: false }, // minutes
        weeklyStudyTime: { target: 210, current: 0, achieved: false }, // minutes
        totalStudyTime: { target: 1000, current: 0, achieved: false } // minutes
      }
    };
  }

  static async updateGoalProgress(userId, quizHistory, subjectProgress) {
    try {
      const goals = await this.getUserGoals(userId);
      const updatedGoals = { ...goals };

      // Update streak goals
      const streaks = this.calculateStreaks(quizHistory);
      updatedGoals.streakGoals.weekly.current = Math.min(streaks.currentStreak, 7);
      updatedGoals.streakGoals.monthly.current = Math.min(streaks.currentStreak, 30);
      updatedGoals.streakGoals.yearly.current = streaks.currentStreak;
      
      // Update score goals
      const scores = quizHistory.map(q => q.results?.percentage || 0);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length || 0;
      const perfectScores = scores.filter(score => score === 100).length;
      
      updatedGoals.scoreGoals.averageScore.current = Math.round(averageScore);
      updatedGoals.scoreGoals.perfectScores.current = perfectScores;
      
      // Update time goals (if available)
      const totalStudyTime = this.calculateTotalStudyTime(quizHistory);
      updatedGoals.timeGoals.totalStudyTime.current = totalStudyTime;

      // Check achievements
      this.checkGoalAchievements(updatedGoals);

      await AsyncStorage.setItem(`userGoals_${userId}`, JSON.stringify(updatedGoals));
      return updatedGoals;
    } catch (error) {
      logger.error('Error updating goal progress:', error);
      return goals;
    }
  }

  static checkGoalAchievements(goals) {
    Object.keys(goals).forEach(category => {
      Object.keys(goals[category]).forEach(goalKey => {
        const goal = goals[category][goalKey];
        if (goal.current >= goal.target && !goal.achieved) {
          goal.achieved = true;
          goal.achievedAt = new Date().toISOString();
        }
      });
    });
  }

  // =============================
  // 🎯 LEARNING VELOCITY TRACKING
  // =============================

  static calculateLearningVelocity(quizHistory, timeWindow = 30) {
    if (quizHistory.length < 2) return { velocity: 0, trend: 'insufficient_data' };

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeWindow);
    
    const recentQuizzes = quizHistory
      .filter(q => new Date(q.metadata?.completedAt) >= cutoffDate)
      .sort((a, b) => new Date(a.metadata?.completedAt) - new Date(b.metadata?.completedAt));

    if (recentQuizzes.length < 2) return { velocity: 0, trend: 'insufficient_data' };

    // Calculate improvement rate per day
    const firstScore = recentQuizzes[0].results?.percentage || 0;
    const lastScore = recentQuizzes[recentQuizzes.length - 1].results?.percentage || 0;
    const daysDiff = (new Date(recentQuizzes[recentQuizzes.length - 1].metadata?.completedAt) - 
                     new Date(recentQuizzes[0].metadata?.completedAt)) / (24 * 60 * 60 * 1000);
    
    const velocity = daysDiff > 0 ? (lastScore - firstScore) / daysDiff : 0;
    
    // Calculate trend using linear regression
    const trend = this.calculateTrend(recentQuizzes.map(q => q.results?.percentage || 0));
    
    return {
      velocity: Math.round(velocity * 100) / 100, // Round to 2 decimal places
      trend: this.categorizeTrend(trend),
      trendValue: Math.round(trend * 100) / 100,
      dataPoints: recentQuizzes.length,
      timeWindow,
      analysis: this.getVelocityAnalysis(velocity, trend)
    };
  }

  static calculateTrend(scores) {
    if (scores.length < 2) return 0;
    
    const n = scores.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = scores;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  }

  static categorizeTrend(trend) {
    if (trend > 2) return 'rapidly_improving';
    if (trend > 0.5) return 'improving';
    if (trend > -0.5) return 'stable';
    if (trend > -2) return 'declining';
    return 'rapidly_declining';
  }

  static getVelocityAnalysis(velocity, trend) {
    if (velocity > 1) {
      return "Excellent progress! You're improving rapidly.";
    } else if (velocity > 0.2) {
      return "Good steady improvement. Keep up the consistent effort.";
    } else if (velocity > -0.2) {
      return "Performance is stable. Consider challenging yourself more.";
    } else if (velocity > -1) {
      return "Slight decline. Review your study methods and take breaks.";
    } else {
      return "Significant decline. Consider easier topics or seek additional help.";
    }
  }

  // =============================
  // 🎯 DIFFICULTY PROGRESSION
  // =============================

  static analyzeDifficultyProgression(quizHistory) {
    const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
    const recentQuizzes = quizHistory.slice(-10);
    
    const progressionAnalysis = {
      currentLevel: this.getCurrentDifficultyLevel(recentQuizzes),
      readyForNext: false,
      recommendation: '',
      nextSteps: [],
      difficultyDistribution: this.getDifficultyDistribution(recentQuizzes),
      mastery: this.calculateDifficultyMastery(quizHistory)
    };

    // Analyze performance by difficulty
    const difficultyPerformance = this.getDifficultyPerformance(quizHistory);
    
    // Determine if ready for next level
    const currentDifficulty = progressionAnalysis.currentLevel;
    const currentPerformance = difficultyPerformance[currentDifficulty];
    
    if (currentPerformance && currentPerformance.averageScore >= 80 && currentPerformance.consistency >= 70) {
      progressionAnalysis.readyForNext = true;
      progressionAnalysis.recommendation = `You're ready to advance from ${currentDifficulty} to ${this.getNextDifficulty(currentDifficulty)}!`;
      progressionAnalysis.nextSteps = this.getAdvancementSteps(currentDifficulty);
    } else {
      progressionAnalysis.recommendation = this.getImprovementRecommendation(currentDifficulty, currentPerformance);
      progressionAnalysis.nextSteps = this.getImprovementSteps(currentDifficulty, currentPerformance);
    }

    return progressionAnalysis;
  }

  static getCurrentDifficultyLevel(recentQuizzes) {
    const difficulties = recentQuizzes.map(q => q.metadata?.difficulty || 'medium');
    const modeMap = {};
    difficulties.forEach(d => modeMap[d] = (modeMap[d] || 0) + 1);
    return Object.keys(modeMap).reduce((a, b) => modeMap[a] > modeMap[b] ? a : b, 'medium');
  }

  static getDifficultyDistribution(quizzes) {
    const distribution = { easy: 0, medium: 0, hard: 0 };
    quizzes.forEach(q => {
      const difficulty = q.metadata?.difficulty || 'medium';
      distribution[difficulty]++;
    });
    return distribution;
  }

  static getDifficultyPerformance(quizHistory) {
    const performance = { easy: [], medium: [], hard: [] };
    
    quizHistory.forEach(q => {
      const difficulty = q.metadata?.difficulty || 'medium';
      const score = q.results?.percentage || 0;
      performance[difficulty].push(score);
    });

    Object.keys(performance).forEach(difficulty => {
      const scores = performance[difficulty];
      if (scores.length > 0) {
        const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const consistency = this.calculateScoreConsistency(scores);
        performance[difficulty] = {
          averageScore: Math.round(avg),
          consistency: Math.round(consistency * 100),
          count: scores.length,
          bestScore: Math.max(...scores),
          worstScore: Math.min(...scores)
        };
      } else {
        performance[difficulty] = {
          averageScore: 0,
          consistency: 0,
          count: 0,
          bestScore: 0,
          worstScore: 0
        };
      }
    });

    return performance;
  }

  static calculateScoreConsistency(scores) {
    if (scores.length < 2) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to consistency score (0-1, where 1 is perfectly consistent)
    return Math.max(0, 1 - (stdDev / 50)); // Assuming 50 as max reasonable std dev
  }

  static getNextDifficulty(currentDifficulty) {
    const progression = { 'easy': 'medium', 'medium': 'hard', 'hard': 'expert' };
    return progression[currentDifficulty] || 'hard';
  }

  static getAdvancementSteps(currentDifficulty) {
    const steps = {
      easy: [
        "Try medium difficulty quizzes",
        "Focus on accuracy before speed",
        "Review explanations thoroughly"
      ],
      medium: [
        "Attempt hard difficulty questions",
        "Practice time management",
        "Study advanced concepts"
      ],
      hard: [
        "Challenge yourself with expert level",
        "Teach concepts to others",
        "Apply knowledge to real scenarios"
      ]
    };
    return steps[currentDifficulty] || steps.medium;
  }

  // =============================
  // 🎯 TIME-BASED ANALYTICS
  // =============================

  static calculateStudySessionAnalytics(quizHistory) {
    const sessions = this.groupQuizzesIntoSessions(quizHistory);
    
    if (sessions.length === 0) {
      return {
        averageSessionDuration: 0,
        totalStudyTime: 0,
        sessionsPerWeek: 0,
        optimalStudyTime: 'Unknown',
        timeDistribution: {},
        recommendations: ["Take more quizzes to analyze study patterns"]
      };
    }

    const sessionDurations = sessions.map(s => s.duration);
    const totalTime = sessionDurations.reduce((sum, duration) => sum + duration, 0);
    const averageSessionDuration = totalTime / sessions.length;
    
    // Analyze performance by time of day
    const timePerformance = this.analyzeTimePerformance(quizHistory);
    
    return {
      averageSessionDuration: Math.round(averageSessionDuration),
      totalStudyTime: Math.round(totalTime),
      sessionsPerWeek: this.calculateSessionsPerWeek(sessions),
      sessionsThisWeek: this.getSessionsThisWeek(sessions),
      optimalStudyTime: this.findOptimalStudyTime(timePerformance),
      timeDistribution: this.getTimeDistribution(quizHistory),
      longestSession: Math.max(...sessionDurations, 0),
      shortestSession: Math.min(...sessionDurations, 0),
      recommendations: this.getTimeRecommendations(averageSessionDuration, timePerformance)
    };
  }

  static groupQuizzesIntoSessions(quizHistory, maxGapMinutes = 60) {
    if (quizHistory.length === 0) return [];
    
    const sortedQuizzes = [...quizHistory].sort((a, b) => 
      new Date(a.metadata?.completedAt) - new Date(b.metadata?.completedAt)
    );

    const sessions = [];
    let currentSession = {
      quizzes: [sortedQuizzes[0]],
      startTime: new Date(sortedQuizzes[0].metadata?.completedAt),
      endTime: new Date(sortedQuizzes[0].metadata?.completedAt)
    };

    for (let i = 1; i < sortedQuizzes.length; i++) {
      const currentQuizTime = new Date(sortedQuizzes[i].metadata?.completedAt);
      const timeSinceLastQuiz = (currentQuizTime - currentSession.endTime) / (1000 * 60); // minutes

      if (timeSinceLastQuiz <= maxGapMinutes) {
        // Continue current session
        currentSession.quizzes.push(sortedQuizzes[i]);
        currentSession.endTime = currentQuizTime;
      } else {
        // Start new session
        currentSession.duration = (currentSession.endTime - currentSession.startTime) / (1000 * 60); // minutes
        sessions.push(currentSession);
        
        currentSession = {
          quizzes: [sortedQuizzes[i]],
          startTime: currentQuizTime,
          endTime: currentQuizTime
        };
      }
    }

    // Add the last session
    currentSession.duration = (currentSession.endTime - currentSession.startTime) / (1000 * 60);
    sessions.push(currentSession);

    return sessions;
  }

  static analyzeTimePerformance(quizHistory) {
    const timeSlots = {
      morning: { scores: [], hours: [6, 7, 8, 9, 10, 11] },
      afternoon: { scores: [], hours: [12, 13, 14, 15, 16, 17] },
      evening: { scores: [], hours: [18, 19, 20, 21] },
      night: { scores: [], hours: [22, 23, 0, 1, 2, 3, 4, 5] }
    };

    quizHistory.forEach(quiz => {
      const quizTime = new Date(quiz.metadata?.completedAt);
      const hour = quizTime.getHours();
      const score = quiz.results?.percentage || 0;

      Object.keys(timeSlots).forEach(slot => {
        if (timeSlots[slot].hours.includes(hour)) {
          timeSlots[slot].scores.push(score);
        }
      });
    });

    // Calculate averages
    Object.keys(timeSlots).forEach(slot => {
      const scores = timeSlots[slot].scores;
      timeSlots[slot].average = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;
      timeSlots[slot].count = scores.length;
    });

    return timeSlots;
  }

  static findOptimalStudyTime(timePerformance) {
    let bestSlot = 'morning';
    let bestScore = 0;

    Object.keys(timePerformance).forEach(slot => {
      if (timePerformance[slot].count >= 2 && timePerformance[slot].average > bestScore) {
        bestScore = timePerformance[slot].average;
        bestSlot = slot;
      }
    });

    return bestSlot;
  }

  static getTimeDistribution(quizHistory) {
    const distribution = {
      weekdays: { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 },
      weekends: { Saturday: 0, Sunday: 0 },
      timeOfDay: { morning: 0, afternoon: 0, evening: 0, night: 0 }
    };

    quizHistory.forEach(quiz => {
      const quizTime = new Date(quiz.metadata?.completedAt);
      const dayName = quizTime.toLocaleDateString('en', { weekday: 'long' });
      const hour = quizTime.getHours();

      // Day distribution
      if (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(dayName)) {
        distribution.weekdays[dayName]++;
      } else {
        distribution.weekends[dayName]++;
      }

      // Time of day distribution
      if (hour >= 6 && hour < 12) distribution.timeOfDay.morning++;
      else if (hour >= 12 && hour < 18) distribution.timeOfDay.afternoon++;
      else if (hour >= 18 && hour < 22) distribution.timeOfDay.evening++;
      else distribution.timeOfDay.night++;
    });

    return distribution;
  }

  static calculateSessionsPerWeek(sessions) {
    if (sessions.length === 0) return 0;
    
    const firstSession = sessions[0].startTime;
    const lastSession = sessions[sessions.length - 1].startTime;
    const weeksDiff = (lastSession - firstSession) / (7 * 24 * 60 * 60 * 1000);
    
    return weeksDiff > 0 ? Math.round((sessions.length / weeksDiff) * 10) / 10 : sessions.length;
  }

  static getSessionsThisWeek(sessions) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return sessions.filter(session => session.startTime >= oneWeekAgo).length;
  }

  static getTimeRecommendations(avgDuration, timePerformance) {
    const recommendations = [];
    
    if (avgDuration < 15) {
      recommendations.push("Consider longer study sessions (20-30 minutes) for better retention");
    } else if (avgDuration > 90) {
      recommendations.push("Break long sessions into shorter focused periods with breaks");
    }

    const optimalTime = this.findOptimalStudyTime(timePerformance);
    recommendations.push(`Your peak performance is during ${optimalTime} - schedule important topics then`);

    return recommendations;
  }

  static calculateTotalStudyTime(quizHistory) {
    // Estimate study time based on quiz sessions
    const sessions = this.groupQuizzesIntoSessions(quizHistory);
    return sessions.reduce((total, session) => total + session.duration, 0);
  }

  static calculateStreaks(quizHistory) {
    if (quizHistory.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const sortedQuizzes = quizHistory.sort((a, b) => 
      new Date(a.metadata?.completedAt) - new Date(b.metadata?.completedAt)
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    sortedQuizzes.forEach(quiz => {
      const quizDate = new Date(quiz.metadata?.completedAt);
      const daysDiff = lastDate ? Math.floor((quizDate - lastDate) / (1000 * 60 * 60 * 24)) : 0;

      if (lastDate === null || daysDiff === 1) {
        tempStreak += 1;
      } else if (daysDiff === 0) {
        // Same day, don't break streak
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }

      lastDate = quizDate;
    });

    currentStreak = tempStreak;
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }
}

export default AdvancedProgressAnalytics;