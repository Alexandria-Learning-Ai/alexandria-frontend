/**
 * Share and Export Utilities
 * Functions for sharing quiz results and generating shareable content
 */

import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { getPerformanceEmoji } from './answerFormatters';
import logger from './logger';

// ✅ FIXED: Safe clipboard import with fallback
let Clipboard: any = null;
try {
    Clipboard = require('@react-native-clipboard/clipboard').default;
} catch (error) {
    logger.warn('Clipboard module not available, copy functionality will be disabled');
    Clipboard = {
        setString: (text: string) => {
            logger.info('Clipboard not available - text would have been copied:', text.substring(0, 50));
            Alert.alert('Copy', 'Clipboard feature is not available in this environment.');
        }
    };
}

// ✅ FIXED: Safe Share import with fallback
let Share: any = null;
try {
    Share = require('react-native-share').default;
} catch (error) {
    logger.warn('Share module not available, share functionality will be disabled');
    Share = {
        open: async (options: any) => {
            logger.info('Share not available - would have shared:', options.title || 'content');
            Alert.alert('Share', 'Share feature is not available in this environment. Content has been logged.');
            return { success: false, message: 'Share module not available' };
        }
    };
}

const CONFIG = {
  DEEP_LINK_DOMAIN: 'alexandria-app.com',
  APP_SCHEME: 'alexandria',
  WEB_APP_URL: 'https://alexandria-app.com',
  APP_STORE_URL: 'https://apps.apple.com/app/alexandria',
  PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=com.alexandria',
};

interface ShareableQuizData {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  questions: any[];
  metadata: any;
}

interface DeepLinkResult {
  universalLink: string;
  schemeLink: string;
  webFallback: string;
}

/**
 * Generate shareable quiz data for challenges
 */
export const generateShareableQuizData = async (
  questions: any[],
  metadata: any,
  category: string
): Promise<ShareableQuizData | null> => {
  try {
    const shareableQuiz: ShareableQuizData = {
      id: uuid.v4() as string,
      title: metadata.title || `${category} Quiz`,
      category: category,
      difficulty: metadata.difficulty || 'medium',
      questions: questions.map(q => ({
        id: q.id,
        text: q.text || q.questionText,
        type: q.type,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        keywords: q.keywords || [],
        formula: q.formula,
        solution_steps: q.solution_steps || [],
      })),
      metadata: {
        category: category,
        difficulty: metadata.difficulty || 'medium',
        totalQuestions: questions.length,
        subject: metadata.subject,
        createdAt: new Date().toISOString(),
        sharedBy: 'anonymous',
      }
    };

    await AsyncStorage.setItem(`shared_quiz_${shareableQuiz.id}`, JSON.stringify(shareableQuiz));
    return shareableQuiz;
  } catch (error) {
    logger.error('Error generating shareable quiz data:', error);
    return null;
  }
};

/**
 * Generate deep link for quiz sharing
 */
export const generateDeepLink = (quizId: string): DeepLinkResult => {
  const universalLink = `https://${CONFIG.DEEP_LINK_DOMAIN}/quiz/${quizId}`;
  const schemeLink = `${CONFIG.APP_SCHEME}://quiz/${quizId}`;

  return {
    universalLink,
    schemeLink,
    webFallback: `${CONFIG.WEB_APP_URL}/quiz/${quizId}`,
  };
};

/**
 * Generate app download text for sharing
 */
export const generateAppDownloadText = (): string => {
  const appLinks = {
    ios: CONFIG.APP_STORE_URL,
    android: CONFIG.PLAY_STORE_URL,
    web: CONFIG.WEB_APP_URL,
  };

  let downloadText = '\n📱 Don\'t have the app? Get it here:\n';

  if (Platform.OS === 'ios') {
    downloadText += `📲 iOS: ${appLinks.ios}\n`;
    downloadText += `🤖 Android: ${appLinks.android}\n`;
  } else {
    downloadText += `🤖 Android: ${appLinks.android}\n`;
    downloadText += `📲 iOS: ${appLinks.ios}\n`;
  }

  if (appLinks.web && appLinks.web !== CONFIG.WEB_APP_URL) {
    downloadText += `🌐 Web: ${appLinks.web}\n`;
  }

  return downloadText;
};

/**
 * Generate shareable text for quiz results
 */
export const generateShareableText = async (
  score: number,
  totalQuestions: number,
  percentage: number,
  performance: { level: string },
  category: string,
  questions: any[],
  userAnswers: Record<string, any>,
  coachMessage: any,
  metadata: any,
  includeQuizLink: boolean = true
): Promise<string> => {
  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let shareText = `🎯 Quiz Results - ${category}\n`;
  shareText += `📅 ${date} at ${time}\n\n`;

  shareText += `📊 PERFORMANCE SUMMARY\n`;
  shareText += `Score: ${score}/${totalQuestions} (${percentage}%)\n`;
  shareText += `Level: ${performance.level} ${getPerformanceEmoji(performance.level)}\n\n`;

  if (coachMessage) {
    shareText += `🤖 AI COACH INSIGHTS\n`;
    shareText += `${coachMessage.message}\n\n`;

    if (coachMessage.suggestions && coachMessage.suggestions.length > 0) {
      shareText += `💡 Quick Tips:\n`;
      coachMessage.suggestions.forEach((tip: string, index: number) => {
        shareText += `${index + 1}. ${tip}\n`;
      });
      shareText += `\n`;
    }
  }

  shareText += `📝 SAMPLE QUESTIONS\n`;
  questions.slice(0, 3).forEach((question, index) => {
    const userAns = userAnswers[question.id];
    const status = question.isCorrect ? '✅' : '❌';
    shareText += `${index + 1}. ${status} ${(question.text || question.questionText).substring(0, 80)}${(question.text || question.questionText).length > 80 ? '...' : ''}\n`;
  });

  if (questions.length > 3) {
    shareText += `... and ${questions.length - 3} more questions!\n\n`;
  } else {
    shareText += `\n`;
  }

  if (includeQuizLink) {
    try {
      const shareableQuiz = await generateShareableQuizData(questions, metadata, category);
      if (shareableQuiz) {
        const deepLinks = generateDeepLink(shareableQuiz.id);

        shareText += `🎮 CHALLENGE YOURSELF!\n`;
        shareText += `Think you can beat my score? Take the same quiz:\n`;
        shareText += `👉 ${deepLinks.universalLink}\n\n`;

        shareText += `💪 Challenge your friends and see who's the smartest!\n`;
        shareText += generateAppDownloadText();
      }
    } catch (error) {
      logger.error('Error adding quiz link to share text:', error);
    }
  }

  shareText += `\n🚀 Keep learning and improving!`;
  shareText += `\n\n#QuizChallenge #Learning #StudyBuddy #BrainTraining`;

  return shareText;
};

/**
 * Share quiz results to social media
 */
export const shareToSocial = async (
  score: number,
  totalQuestions: number,
  percentage: number,
  performance: { level: string },
  category: string,
  questions: any[],
  userAnswers: Record<string, any>,
  coachMessage: any,
  metadata: any,
  fallbackCallback: () => Promise<void>
): Promise<void> => {
  try {
    if (!Share || typeof Share.open !== 'function') {
      await fallbackCallback();
      return;
    }

    const shareText = await generateShareableText(
      score,
      totalQuestions,
      percentage,
      performance,
      category,
      questions,
      userAnswers,
      coachMessage,
      metadata,
      true
    );

    const shareOptions = {
      title: 'Quiz Challenge! 🎯',
      message: shareText,
      subject: `I scored ${percentage}% on this ${category} quiz! Can you beat me?`,
      url: '',
    };

    await Share.open(shareOptions);
  } catch (error: any) {
    if (error.message !== 'User did not share') {
      logger.error('Error sharing to social:', error);
      await fallbackCallback();
    }
  }
};

/**
 * Fallback share using native React Native Share
 */
export const fallbackShare = async (
  score: number,
  totalQuestions: number,
  percentage: number,
  performance: { level: string },
  category: string,
  questions: any[],
  userAnswers: Record<string, any>,
  coachMessage: any,
  metadata: any,
  copyCallback: (detailed: boolean) => Promise<void>
): Promise<void> => {
  try {
    const shareText = await generateShareableText(
      score,
      totalQuestions,
      percentage,
      performance,
      category,
      questions,
      userAnswers,
      coachMessage,
      metadata,
      true
    );

    const { Share: NativeShare } = require('react-native');
    await NativeShare.share({
      message: shareText,
      title: 'Quiz Challenge! 🎯',
    });
  } catch (error) {
    logger.error('Fallback share failed:', error);
    Alert.alert(
      'Share Results 📋',
      'Would you like to copy your results to share manually?',
      [
        { text: 'Copy Results', onPress: () => copyCallback(false) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }
};

/**
 * Share quiz challenge with deep link
 */
export const shareQuizChallenge = async (
  score: number,
  totalQuestions: number,
  percentage: number,
  category: string,
  questions: any[],
  metadata: any
): Promise<void> => {
  try {
    const shareableQuiz = await generateShareableQuizData(questions, metadata, category);
    if (!shareableQuiz) {
      Alert.alert('Error', 'Unable to create shareable quiz. Please try again.');
      return;
    }

    const deepLinks = generateDeepLink(shareableQuiz.id);

    let challengeText = `🎯 QUIZ CHALLENGE!\n\n`;
    challengeText += `I just completed a ${category} quiz and scored ${percentage}%!\n\n`;
    challengeText += `💪 Think you can beat my score?\n`;
    challengeText += `Take the same ${totalQuestions}-question quiz and find out!\n\n`;
    challengeText += `👉 TAP HERE TO START:\n${deepLinks.universalLink}\n\n`;
    challengeText += `🏆 Let's see who's the real quiz champion!\n`;
    challengeText += generateAppDownloadText();
    challengeText += `\n#QuizChallenge #BrainGame #Challenge #${category}`;

    if (Share && typeof Share.open === 'function') {
      await Share.open({
        title: `Beat My ${category} Quiz Score!`,
        message: challengeText,
        subject: `Quiz Challenge - Can you beat ${percentage}%?`,
      });
    } else {
      const { Share: NativeShare } = require('react-native');
      await NativeShare.share({
        message: challengeText,
        title: `Beat My ${category} Quiz Score!`,
      });
    }
  } catch (error) {
    logger.error('Error sharing quiz challenge:', error);
    Alert.alert('Share Error', 'Unable to share quiz challenge. Please try again.');
  }
};

/**
 * Copy quiz results to clipboard
 */
export const copyToClipboard = async (
  score: number,
  totalQuestions: number,
  percentage: number,
  performance: { level: string },
  category: string,
  questions: any[],
  userAnswers: Record<string, any>,
  coachMessage: any,
  metadata: any,
  detailed: boolean = false
): Promise<void> => {
  try {
    const textToCopy = await generateShareableText(
      score,
      totalQuestions,
      percentage,
      performance,
      category,
      questions,
      userAnswers,
      coachMessage,
      metadata,
      !detailed
    );

    if (Clipboard && typeof Clipboard.setString === 'function') {
      await Clipboard.setString(textToCopy);
      Alert.alert(
        'Copied! 📋',
        'Results with quiz link copied to clipboard',
        [{ text: 'OK' }]
      );
    } else {
      try {
        const { Clipboard: NativeClipboard } = require('react-native');
        NativeClipboard.setString(textToCopy);
        Alert.alert(
          'Copied! 📋',
          'Results with quiz link copied to clipboard',
          [{ text: 'OK' }]
        );
      } catch (clipboardError) {
        logger.error('Clipboard error:', clipboardError);
        Alert.alert(
          'Copy Results 📋',
          textToCopy,
          [{ text: 'OK' }]
        );
      }
    }
  } catch (error) {
    logger.error('Error copying to clipboard:', error);
    Alert.alert('Copy Error', 'Unable to copy results. Please try again.');
  }
};

/**
 * Copy results only (without quiz link)
 */
export const copyResultsOnly = async (
  score: number,
  totalQuestions: number,
  percentage: number,
  performance: { level: string },
  category: string,
  questions: any[],
  userAnswers: Record<string, any>,
  coachMessage: any,
  metadata: any
): Promise<void> => {
  try {
    const textToCopy = await generateShareableText(
      score,
      totalQuestions,
      percentage,
      performance,
      category,
      questions,
      userAnswers,
      coachMessage,
      metadata,
      false
    );

    if (Clipboard && typeof Clipboard.setString === 'function') {
      await Clipboard.setString(textToCopy);
    } else {
      const { Clipboard: NativeClipboard } = require('react-native');
      NativeClipboard.setString(textToCopy);
    }

    Alert.alert(
      'Copied! 📋',
      'Results copied to clipboard (without quiz link)',
      [{ text: 'OK' }]
    );
  } catch (error) {
    logger.error('Error copying results only:', error);
    Alert.alert('Copy Error', 'Unable to copy results. Please try again.');
  }
};

/**
 * Show share options dialog
 */
export const showShareOptionsWithChallenge = (
  shareToSocialCallback: () => Promise<void>,
  copyCallback: (detailed: boolean) => Promise<void>,
  copyResultsOnlyCallback: () => Promise<void>
): void => {
  Alert.alert(
    'Share Your Results! 🚀',
    'How would you like to share your quiz results?',
    [
      { text: 'Share Results + Quiz Link', onPress: shareToSocialCallback },
      { text: 'Copy with Link', onPress: () => copyCallback(false) },
      { text: 'Copy Results Only', onPress: copyResultsOnlyCallback },
      { text: 'Cancel', style: 'cancel' }
    ],
    { cancelable: true }
  );
};
