/**
 * EnhancedNotificationManager - Advanced notification features
 * Extends the base NotificationManager with rich notifications, categories, and improved scheduling
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Vibration } from 'react-native';
import logger from '../utils/logger';


export class EnhancedNotificationManager {
  static NOTIFICATION_CATEGORIES = {
    STUDY_REMINDER: {
      id: 'study_reminder',
      name: 'Study Reminders',
      description: 'Daily study session reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibration: [0, 250, 250, 250],
    },
    EXAM_ALERT: {
      id: 'exam_alert',
      name: 'Exam Alerts',
      description: 'Important exam notifications',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibration: [0, 1000, 500, 1000],
    },
    PROGRESS_UPDATE: {
      id: 'progress_update',
      name: 'Progress Updates',
      description: 'Learning progress insights',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      vibration: [0, 100, 100, 100],
    },
    ACHIEVEMENT: {
      id: 'achievement',
      name: 'Achievements',
      description: 'Learning milestone celebrations',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibration: [0, 200, 100, 200],
    },
    REMEDIAL: {
      id: 'remedial',
      name: 'Focus Sessions',
      description: 'Targeted learning recommendations',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibration: [0, 150, 150, 150],
    }
  };

  static NOTIFICATION_ACTIONS = {
    TAKE_QUIZ: {
      id: 'take_quiz',
      title: 'Take Quiz',
      type: 'text',
      placeholder: 'Take a quick quiz now?'
    },
    SCHEDULE_LATER: {
      id: 'schedule_later',
      title: 'Remind Later',
      type: 'text',
      placeholder: 'Remind me in 1 hour'
    },
    VIEW_PROGRESS: {
      id: 'view_progress',
      title: 'View Progress',
      type: 'text'
    },
    FOCUS_SESSION: {
      id: 'focus_session',
      title: 'Start Focus Session',
      type: 'text'
    }
  };

  // Initialize enhanced notification system
  static async initialize() {
    try {
      logger.info('🚀 Initializing Enhanced Notification Manager...');

      // Set up notification categories for Android
      await this.setupNotificationCategories();

      // Configure enhanced notification handler
      await this.setupNotificationHandler();

      // Set up action handlers
      this.setupActionHandlers();

      logger.info('✅ Enhanced Notification Manager initialized');
      return true;
    } catch (error) {
      logger.error('❌ Failed to initialize Enhanced Notification Manager:', error);
      return false;
    }
  }

  // Set up notification categories (Android channels)
  static async setupNotificationCategories() {
    try {
      for (const category of Object.values(this.NOTIFICATION_CATEGORIES)) {
        await Notifications.setNotificationChannelAsync(category.id, {
          name: category.name,
          description: category.description,
          importance: category.importance,
          sound: category.sound,
          vibrationPattern: category.vibration,
          lightColor: '#D4AF37',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }
      logger.info('📱 Notification categories configured');
    } catch (error) {
      logger.error('Error setting up notification categories:', error);
    }
  }

  // Enhanced notification handler with rich features
  static async setupNotificationHandler() {
    try {
      await Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          const { data } = notification.request.content;
          const category = data?.category || 'study_reminder';
          
          return {
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: data?.setBadge !== false,
            priority: this.getNotificationPriority(category),
          };
        },
        handleSuccess: (notificationId) => {
          logger.info('✅ Notification sent successfully:', notificationId);
        },
        handleError: (notificationId, error) => {
          logger.error('❌ Notification error:', notificationId, error);
        },
      });
    } catch (error) {
      logger.error('Error setting up notification handler:', error);
    }
  }

  // Set up action handlers for interactive notifications
  static setupActionHandlers() {
    // Handle notification responses (when user taps actions)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      this.handleNotificationResponse(response);
    });

    // Handle notifications received while app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      this.handleForegroundNotification(notification);
    });

    return () => {
      subscription.remove();
      foregroundSubscription.remove();
    };
  }

  // Handle notification tap responses
  static async handleNotificationResponse(response) {
    const { actionIdentifier, userText, notification } = response;
    const data = notification.request.content.data;

    logger.info('📱 Notification response:', actionIdentifier, data);

    try {
      switch (actionIdentifier) {
        case 'take_quiz':
          await this.handleTakeQuizAction(data);
          break;
        case 'schedule_later':
          await this.handleScheduleLaterAction(data, userText);
          break;
        case 'view_progress':
          await this.handleViewProgressAction(data);
          break;
        case 'focus_session':
          await this.handleFocusSessionAction(data);
          break;
        default:
          // Default tap behavior
          await this.handleDefaultTap(data);
      }
    } catch (error) {
      logger.error('Error handling notification response:', error);
    }
  }

  // Handle foreground notifications
  static async handleForegroundNotification(notification) {
    const data = notification.request.content.data;
    const category = data?.category || 'study_reminder';

    // Play custom sound for high-priority notifications
    if (category === 'exam_alert') {
      this.playCustomSound('exam_alert');
    }

    // Show in-app notification banner for critical notifications
    if (data?.showInApp) {
      this.showInAppNotification(notification);
    }
  }

  // Schedule rich notification with enhanced features
  static async scheduleRichNotification({
    title,
    body,
    categoryId = 'study_reminder',
    data = {},
    trigger,
    actions = [],
    customSound = null,
    badge = null,
    image = null,
    progress = null
  }) {
    try {
      const category = this.NOTIFICATION_CATEGORIES[categoryId.toUpperCase()] || 
                      this.NOTIFICATION_CATEGORIES.STUDY_REMINDER;

      const content = {
        title,
        body,
        data: {
          ...data,
          category: categoryId,
          timestamp: Date.now()
        },
        categoryIdentifier: category.id,
        sound: customSound || category.sound,
      };

      // Add badge if specified
      if (badge !== null) {
        content.badge = badge;
      }

      // Add image/attachment if specified
      if (image) {
        content.attachments = [{
          identifier: 'image',
          url: image,
          options: {
            typeHint: 'public.image'
          }
        }];
      }

      // Add progress bar for progress notifications
      if (progress !== null) {
        content.data.progress = progress;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger
      });

      logger.info('📬 Rich notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      logger.error('Error scheduling rich notification:', error);
      return null;
    }
  }

  // Schedule progressive learning reminder series
  static async scheduleProgressiveSeries(userId, topic, baseTime, count = 5) {
    try {
      const notificationIds = [];
      const intervals = [1, 3, 7, 14, 30]; // Days - spaced repetition pattern

      for (let i = 0; i < Math.min(count, intervals.length); i++) {
        const triggerTime = new Date(baseTime);
        triggerTime.setDate(triggerTime.getDate() + intervals[i]);

        const motivationLevel = ['🌟', '🚀', '💪', '🎯', '🏆'][i];
        const intensity = ['gentle', 'encouraging', 'motivating', 'challenging', 'celebrating'][i];

        const notificationId = await this.scheduleRichNotification({
          title: `${motivationLevel} ${topic} Mastery Journey`,
          body: this.getProgressiveMessage(topic, i + 1, intensity),
          categoryId: 'study_reminder',
          data: {
            type: 'progressive_series',
            userId,
            topic,
            seriesIndex: i + 1,
            totalSeries: count
          },
          trigger: { date: triggerTime },
          actions: ['take_quiz', 'view_progress'],
        });

        if (notificationId) {
          notificationIds.push(notificationId);
        }
      }

      logger.info(`📚 Scheduled ${notificationIds.length} progressive reminders for ${topic}`);
      return notificationIds;
    } catch (error) {
      logger.error('Error scheduling progressive series:', error);
      return [];
    }
  }

  // Schedule smart reminders based on forgetting curve
  static async scheduleSmartReminders(userId, quizData, userPerformance) {
    try {
      const forgettingCurve = this.calculateForgettingCurve(userPerformance);
      const reminders = [];

      // Calculate optimal reminder times based on performance
      const baseScore = userPerformance.score || 0;
      const difficulty = userPerformance.difficulty || 'medium';
      
      // Adjust intervals based on performance
      const performanceMultiplier = Math.max(0.5, Math.min(2.0, (100 - baseScore) / 50));
      const difficultyMultiplier = { easy: 0.7, medium: 1.0, hard: 1.5 }[difficulty] || 1.0;

      const intervals = [
        1 * performanceMultiplier * difficultyMultiplier,      // 1 day (adjusted)
        3 * performanceMultiplier * difficultyMultiplier,      // 3 days (adjusted)
        7 * performanceMultiplier * difficultyMultiplier,      // 1 week (adjusted)
        21 * performanceMultiplier * difficultyMultiplier,     // 3 weeks (adjusted)
      ];

      for (let i = 0; i < intervals.length; i++) {
        const triggerTime = new Date();
        triggerTime.setDate(triggerTime.getDate() + Math.ceil(intervals[i]));

        const retention = forgettingCurve.getRetentionAt(intervals[i]);
        const urgency = retention < 0.5 ? 'high' : retention < 0.7 ? 'medium' : 'low';

        const reminder = await this.scheduleRichNotification({
          title: this.getSmartReminderTitle(quizData.topic, urgency),
          body: this.getSmartReminderBody(retention, urgency),
          categoryId: urgency === 'high' ? 'exam_alert' : 'study_reminder',
          data: {
            type: 'smart_reminder',
            userId,
            quizId: quizData.id,
            topic: quizData.topic,
            expectedRetention: retention,
            urgency
          },
          trigger: { date: triggerTime },
          progress: Math.round(retention * 100),
          actions: urgency === 'high' ? ['take_quiz', 'focus_session'] : ['take_quiz', 'schedule_later']
        });

        if (reminder) {
          reminders.push(reminder);
        }
      }

      logger.info(`🧠 Scheduled ${reminders.length} smart reminders based on forgetting curve`);
      return reminders;
    } catch (error) {
      logger.error('Error scheduling smart reminders:', error);
      return [];
    }
  }

  // Calculate forgetting curve based on user performance
  static calculateForgettingCurve(performance) {
    const initialRetention = (performance.score || 0) / 100;
    const decayRate = 0.3 * (1 - (performance.confidence || 0.5)); // Faster decay for lower confidence
    
    return {
      getRetentionAt: (days) => {
        return initialRetention * Math.exp(-decayRate * days);
      },
      getOptimalReviewTime: (targetRetention = 0.6) => {
        return Math.log(initialRetention / targetRetention) / decayRate;
      }
    };
  }

  // Action handlers
  static async handleTakeQuizAction(data) {
    try {
      // Store action for app to handle when opened (user-specific)
      const pendingActionKey = `pendingAction_${data.userId}`;
      await AsyncStorage.setItem(pendingActionKey, JSON.stringify({
        type: 'TAKE_QUIZ',
        data,
        timestamp: Date.now()
      }));

      // Track engagement
      this.trackNotificationEngagement(data, 'take_quiz');
    } catch (error) {
      logger.error('Error handling take quiz action:', error);
    }
  }

  static async handleScheduleLaterAction(data, userText) {
    try {
      // Parse user input for delay time
      const delayMinutes = this.parseDelayTime(userText) || 60; // Default 1 hour
      
      const newTriggerTime = new Date();
      newTriggerTime.setMinutes(newTriggerTime.getMinutes() + delayMinutes);

      // Reschedule notification
      await this.scheduleRichNotification({
        title: data.originalTitle || 'Study Reminder',
        body: `Reminder: ${data.originalBody || 'Time for a quick study session!'}`,
        categoryId: data.category || 'study_reminder',
        data,
        trigger: { date: newTriggerTime }
      });

      this.trackNotificationEngagement(data, 'schedule_later', { delayMinutes });
    } catch (error) {
      logger.error('Error handling schedule later action:', error);
    }
  }

  static async handleViewProgressAction(data) {
    try {
      const pendingActionKey = `pendingAction_${data.userId}`;
      await AsyncStorage.setItem(pendingActionKey, JSON.stringify({
        type: 'VIEW_PROGRESS',
        data,
        timestamp: Date.now()
      }));

      this.trackNotificationEngagement(data, 'view_progress');
    } catch (error) {
      logger.error('Error handling view progress action:', error);
    }
  }

  static async handleFocusSessionAction(data) {
    try {
      const pendingActionKey = `pendingAction_${data.userId}`;
      await AsyncStorage.setItem(pendingActionKey, JSON.stringify({
        type: 'FOCUS_SESSION',
        data,
        timestamp: Date.now()
      }));

      this.trackNotificationEngagement(data, 'focus_session');
    } catch (error) {
      logger.error('Error handling focus session action:', error);
    }
  }

  static async handleDefaultTap(data) {
    try {
      const pendingActionKey = `pendingAction_${data.userId}`;
      await AsyncStorage.setItem(pendingActionKey, JSON.stringify({
        type: 'DEFAULT_NOTIFICATION_TAP',
        data,
        timestamp: Date.now()
      }));

      this.trackNotificationEngagement(data, 'tap');
    } catch (error) {
      logger.error('Error handling default tap:', error);
    }
  }

  // Utility methods
  static getNotificationPriority(category) {
    const priorities = {
      exam_alert: Notifications.AndroidImportance.MAX,
      study_reminder: Notifications.AndroidImportance.HIGH,
      progress_update: Notifications.AndroidImportance.DEFAULT,
      achievement: Notifications.AndroidImportance.HIGH,
      remedial: Notifications.AndroidImportance.HIGH,
    };
    return priorities[category] || Notifications.AndroidImportance.DEFAULT;
  }

  static getProgressiveMessage(topic, index, intensity) {
    const messages = {
      gentle: [
        `Time for a gentle review of ${topic}. No pressure! 😊`,
        `A quick ${topic} refresher might be nice today.`,
        `Ready to revisit ${topic} when you have a moment?`,
      ],
      encouraging: [
        `You're doing great! Let's keep ${topic} fresh in your mind. 💪`,
        `Your ${topic} skills are improving! Ready for another round?`,
        `Building momentum with ${topic}. You've got this! 🌟`,
      ],
      motivating: [
        `Time to power through ${topic}! You're on fire! 🔥`,
        `${topic} mastery awaits! Let's push your limits today.`,
        `Ready to dominate ${topic}? Show what you've learned! ⚡`,
      ],
      challenging: [
        `${topic} challenge mode: activated! Think you can handle it? 🎯`,
        `Time to prove your ${topic} expertise. Are you ready?`,
        `Advanced ${topic} session loading... Bring your A-game! 🚀`,
      ],
      celebrating: [
        `${topic} champion in the making! One more victory lap? 🏆`,
        `You've mastered ${topic}! Ready to show off your skills?`,
        `${topic} expert status: almost unlocked! Final push! ⭐`,
      ]
    };
    
    const categoryMessages = messages[intensity] || messages.gentle;
    return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
  }

  static getSmartReminderTitle(topic, urgency) {
    const titles = {
      high: [
        `⚠️ ${topic} Knowledge Fading!`,
        `🆘 Quick ${topic} Review Needed`,
        `⏰ Critical ${topic} Refresh Time`,
      ],
      medium: [
        `🔄 ${topic} Refresh Time`,
        `📚 ${topic} Review Recommended`,
        `💡 ${topic} Memory Boost`,
      ],
      low: [
        `✨ ${topic} Polish Time`,
        `🌟 ${topic} Maintenance`,
        `📖 Gentle ${topic} Review`,
      ]
    };
    
    const urgencyTitles = titles[urgency] || titles.medium;
    return urgencyTitles[Math.floor(Math.random() * urgencyTitles.length)];
  }

  static getSmartReminderBody(retention, urgency) {
    const retentionPercent = Math.round(retention * 100);
    
    if (urgency === 'high') {
      return `Your retention is at ${retentionPercent}%. Don't let this knowledge slip away! 💪`;
    } else if (urgency === 'medium') {
      return `Keep your knowledge sharp! Current retention: ${retentionPercent}%. 🎯`;
    } else {
      return `You're doing well! Retention at ${retentionPercent}%. A quick review will lock it in! ✨`;
    }
  }

  static parseDelayTime(userText) {
    if (!userText) return null;
    
    const text = userText.toLowerCase();
    const hourMatch = text.match(/(\d+)\s*hour/);
    const minuteMatch = text.match(/(\d+)\s*min/);
    
    if (hourMatch) return parseInt(hourMatch[1]) * 60;
    if (minuteMatch) return parseInt(minuteMatch[1]);
    
    return null;
  }

  static async playCustomSound(soundType) {
    try {
      // Implementation would depend on your audio assets
      logger.info(`🔊 Playing custom sound: ${soundType}`);
      // Example: await Audio.Sound.createAsync(require(`../assets/sounds/${soundType}.mp3`));
    } catch (error) {
      logger.error('Error playing custom sound:', error);
    }
  }

  static showInAppNotification(notification) {
    // This would integrate with your in-app notification component
    logger.info('📱 Showing in-app notification:', notification.request.content.title);
  }

  static async trackNotificationEngagement(data, action, metadata = {}) {
    try {
      const engagement = {
        userId: data.userId,
        notificationType: data.type,
        category: data.category,
        action,
        timestamp: Date.now(),
        metadata
      };

      // Store engagement data per user
      const engagementKey = `notification_engagement_${data.userId}`;
      const engagementHistory = await AsyncStorage.getItem(engagementKey) || '[]';
      const history = JSON.parse(engagementHistory);
      history.push(engagement);

      // Keep only last 100 engagements
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }

      await AsyncStorage.setItem(engagementKey, JSON.stringify(history));
      logger.info('📊 Tracked notification engagement:', action);
    } catch (error) {
      logger.error('Error tracking notification engagement:', error);
    }
  }

  // Get pending action (to be called when app opens)
  static async getPendingAction(userId) {
    try {
      if (!userId) {
        logger.warn('getPendingAction called without userId');
        return null;
      }

      const pendingActionKey = `pendingAction_${userId}`;
      const pendingAction = await AsyncStorage.getItem(pendingActionKey);
      if (pendingAction) {
        await AsyncStorage.removeItem(pendingActionKey);
        return JSON.parse(pendingAction);
      }
      return null;
    } catch (error) {
      logger.error('Error getting pending action:', error);
      return null;
    }
  }
}

export default EnhancedNotificationManager;