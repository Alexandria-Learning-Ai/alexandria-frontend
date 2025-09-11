// utils/RemedialNotificationHandler.js
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import { WeaknessAnalysisService } from '../services/WeaknessAnalysisService';
import logger from '../utils/logger';


export class RemedialNotificationHandler {
  
  // ✅ Set up notification listeners
  static initialize(navigation) {
    // Handle notification when app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      
      if (data.type === 'remedial_quiz') {
        this.handleRemedialNotification(data, navigation, 'foreground');
      }
    });

    // Handle notification when user taps it
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      
      if (data.type === 'remedial_quiz') {
        this.handleRemedialNotification(data, navigation, 'tap');
      }
    });
  }

  // ✅ Handle remedial quiz notifications
  static async handleRemedialNotification(data, navigation, trigger) {
    try {
      const { userId, quizId, topic, priority } = data;

      // Load the specific remedial quiz
      const pendingQuizzes = await WeaknessAnalysisService.getPendingRemedialQuizzes(userId);
      const targetQuiz = pendingQuizzes.find(quiz => quiz.id === quizId);

      if (!targetQuiz) {
        // Quiz might have been completed or expired, generate a new one
        const weaknesses = await WeaknessAnalysisService.getCurrentWeaknesses(userId);
        const targetWeakness = weaknesses.find(w => w.topic === topic);
        
        if (targetWeakness) {
          const newQuiz = await WeaknessAnalysisService.generateRemedialQuiz(userId, targetWeakness);
          this.showQuizPrompt(newQuiz, navigation, trigger);
        } else {
          this.showWeaknessResolvedMessage(topic);
        }
        return;
      }

      this.showQuizPrompt(targetQuiz, navigation, trigger);

    } catch (error) {
      logger.error('Error handling remedial notification:', error);
    }
  }

  // ✅ Show quiz prompt to user
  static showQuizPrompt(quiz, navigation, trigger) {
    const isHighPriority = quiz.priority === 'high';
    const emoji = isHighPriority ? '🚨' : '🎯';
    
    const title = `${emoji} Alexandria Focus Time`;
    const message = `Ready to strengthen your ${quiz.targetTopic.replace('_', ' ')} skills?\n\n` +
                   `📚 ${quiz.questionCount} targeted questions\n` +
                   `⏱️ ${quiz.timeLimit} minute${quiz.timeLimit !== 1 ? 's' : ''}\n` +
                   `🎯 Difficulty: ${quiz.difficulty}`;

    if (trigger === 'foreground') {
      // Show in-app notification
      Alert.alert(
        title,
        message,
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Remind Me in 1 Hour', onPress: () => this.snoozeNotification(quiz, 1) },
          { 
            text: 'Start Quiz! 🚀', 
            onPress: () => this.startRemedialQuiz(quiz, navigation)
          }
        ]
      );
    } else {
      // User tapped notification - go directly to quiz with option to decline
      Alert.alert(
        title,
        message,
        [
          { text: 'Not Now', style: 'cancel' },
          { 
            text: 'Start Learning! 🚀', 
            onPress: () => this.startRemedialQuiz(quiz, navigation)
          }
        ]
      );
    }
  }

  // ✅ Start the remedial quiz
  static startRemedialQuiz(quiz, navigation) {
    navigation.navigate('QuizScreen', {
      remedialQuiz: quiz,
      isRemedial: true,
      targetTopic: quiz.targetTopic,
      source: 'notification'
    });

    // Track engagement
    this.trackRemedialEngagement(quiz, 'started');
  }

  // ✅ Snooze notification
  static async snoozeNotification(quiz, hours) {
    try {
      const snoozeTime = new Date();
      snoozeTime.setHours(snoozeTime.getHours() + hours);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Alexandria Reminder',
          body: `Your ${quiz.targetTopic.replace('_', ' ')} focus quiz is ready!`,
          data: {
            type: 'remedial_quiz',
            userId: quiz.userId,
            quizId: quiz.id,
            topic: quiz.targetTopic,
            priority: quiz.priority,
            snoozed: true
          }
        },
        trigger: { date: snoozeTime }
      });

      logger.info(`📱 Remedial quiz snoozed for ${hours} hour(s)`);
      
    } catch (error) {
      logger.error('Error snoozing notification:', error);
    }
  }

  // ✅ Show message when weakness is resolved
  static showWeaknessResolvedMessage(topic) {
    Alert.alert(
      '🎉 Great Progress!',
      `It looks like you've improved in ${topic.replace('_', ' ')}! ` +
      `Alexandria will continue monitoring your progress and suggest new focus areas as needed.`,
      [{ text: 'Awesome!', style: 'default' }]
    );
  }

  // ✅ Track user engagement with remedial quizzes
  static trackRemedialEngagement(quiz, action) {
    logger.info(`📊 Remedial Quiz Engagement:`, {
      quizId: quiz.id,
      topic: quiz.targetTopic,
      action: action, // 'started', 'completed', 'dismissed'
      priority: quiz.priority,
      timestamp: new Date().toISOString()
    });

    // TODO: Send to analytics service if you have one
    // Analytics.track('Remedial Quiz Engagement', { ... });
  }

  // ✅ Generate motivational messages based on user patterns
  static generateMotivationalMessage(topic, attempts) {
    const messages = {
      few_attempts: [
        `🌟 Let's strengthen your ${topic} skills together!`,
        `🚀 Ready to level up your ${topic} knowledge?`,
        `💪 Time to tackle ${topic} - you've got this!`
      ],
      many_attempts: [
        `🎯 Consistency is key! Another ${topic} session awaits.`,
        `📚 Every expert was once a beginner. Keep going with ${topic}!`,
        `🔥 Your dedication to mastering ${topic} is impressive!`
      ],
      struggling: [
        `🤗 ${topic} can be tricky, but I believe in you!`,
        `💡 Let's break down ${topic} step by step.`,
        `🌱 Growth happens outside your comfort zone. Ready for ${topic}?`
      ]
    };

    let category = 'few_attempts';
    if (attempts > 5) category = 'many_attempts';
    if (attempts > 10) category = 'struggling';

    const categoryMessages = messages[category];
    return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
  }
}

// ✅ Integration with your existing NotificationManager
export const scheduleSmartRemedialNotification = async (userId, weakness, delay = null) => {
  try {
    const quiz = await WeaknessAnalysisService.generateRemedialQuiz(userId, weakness);
    
    if (!quiz) return false;

    // Use custom delay or smart scheduling
    const notificationTime = delay 
      ? new Date(Date.now() + delay)
      : WeaknessAnalysisService.getOptimalNotificationTime();

    const motivationalMessage = RemedialNotificationHandler.generateMotivationalMessage(
      weakness.topic, 
      weakness.totalIncorrect
    );

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎯 Alexandria Focus Session',
        body: motivationalMessage,
        data: {
          type: 'remedial_quiz',
          userId,
          quizId: quiz.id,
          topic: weakness.topic,
          priority: quiz.priority
        }
      },
      trigger: { date: notificationTime }
    });

    logger.info(`📱 Smart remedial notification scheduled for ${notificationTime}`);
    return true;

  } catch (error) {
    logger.error('Error scheduling smart remedial notification:', error);
    return false;
  }
};

export default RemedialNotificationHandler;