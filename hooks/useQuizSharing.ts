/**
 * useQuizSharing.ts
 *
 * Custom hook for managing quiz sharing functionality.
 * Handles generating share links, managing privacy settings, and tracking shares.
 *
 * Features:
 * - Generate shareable links
 * - Manage privacy levels (public, friends, private)
 * - Track share analytics
 * - Clipboard integration
 * - Social media sharing
 * - Error handling
 */

import { useState, useCallback } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Share as RNShare, Alert } from 'react-native';
import { API_BASE_URL } from '../config/api';
import { auth } from '../firebaseConfig';
import logger from '../utils/logger';
import { getUserFriendlyError } from '../utils/errorMessages';

type SharePrivacy = 'public' | 'friends' | 'private';

interface ShareQuizOptions {
  quizId: number | string;
  visibility?: SharePrivacy;
  title?: string;
  privacy?: SharePrivacy;
  quizTitle?: string;
  score?: number;
  totalQuestions?: number;
}

interface ShareData {
  shareUrl: string;
  shareCode: string;
  privacy: SharePrivacy;
  expiresAt?: Date;
  quizId?: number | string;
  createdAt?: Date;
}

interface SharedQuizData {
  quiz: {
    id: string;
    title: string;
    subject?: string;
    description?: string;
    total_questions: number;
    difficulty?: string;
    estimated_time?: number;
    questions?: any[];
  };
  stats: {
    total_attempts: number;
    average_score: number;
    completions?: number;
  };
  share_code: string;
  created_at: string;
  privacy: SharePrivacy;
  creator?: {
    user_id: string;
    user_name: string;
    rank?: number;
    points?: number;
  };
}

interface UseQuizSharingReturn {
  shareData: ShareData | null;
  loading: boolean;
  error: string | null;
  generateShareLink: (options: ShareQuizOptions) => Promise<ShareData | null>;
  getSharedQuiz: (shareCode: string) => Promise<SharedQuizData | null>;
  submitAttempt: (shareCode: string, score: number, answers: any[]) => Promise<boolean>;
  sendChallenge: (shareCode: string, friendId: string) => Promise<boolean>;
  copyToClipboard: (url: string) => Promise<boolean>;
  shareToSocial: (message: string, url: string, title?: string) => Promise<boolean>;
  clearShareData: () => void;
}

/**
 * Get authentication token from Firebase
 */
const getAuthToken = async (): Promise<string | null> => {
  try {
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      logger.warn('No authenticated user found for quiz sharing');
      return null;
    }
    return await currentUser.getIdToken();
  } catch (error) {
    logger.error('Failed to get auth token', error);
    return null;
  }
};

/**
 * Generate shareable URL from share code
 */
const generateShareUrl = (shareCode: string): string => {
  const baseUrl = API_BASE_URL.replace(/\/api$/, '');
  return `${baseUrl}/quiz/${shareCode}`;
};

/**
 * Create share link via API
 */
const createShareLinkAPI = async (
  quizId: number | string,
  visibility: SharePrivacy,
  title?: string
): Promise<ShareData> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/api/sharing/share`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      quiz_id: quizId,
      visibility: visibility,
      title: title,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to create share link' }));
    throw new Error(errorData.detail || 'Failed to create share link');
  }

  const data = await response.json();

  return {
    shareCode: data.share_code,
    shareUrl: generateShareUrl(data.share_code),
    privacy: visibility,
    quizId: quizId,
    createdAt: new Date(data.created_at),
  };
};

/**
 * Get shared quiz via API
 */
const getSharedQuizAPI = async (shareCode: string): Promise<SharedQuizData> => {
  // Public endpoint - no auth required
  const response = await fetch(`${API_BASE_URL}/api/sharing/shared/${shareCode}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Quiz not found');
    }
    if (response.status === 410) {
      throw new Error('Quiz expired');
    }
    throw new Error('Failed to load quiz');
  }

  const data = await response.json();
  return data;
};

/**
 * Submit attempt to shared quiz via API
 */
const submitAttemptAPI = async (
  shareCode: string,
  score: number,
  answers: any[]
): Promise<boolean> => {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/sharing/shared/${shareCode}/attempt`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      score: score,
      answers: answers,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to submit attempt' }));
    throw new Error(errorData.detail || 'Failed to submit attempt');
  }

  return true;
};

/**
 * Send challenge to friend via API
 */
const sendChallengeAPI = async (
  shareCode: string,
  friendId: string
): Promise<boolean> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/api/sharing/shared/${shareCode}/challenge`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      friend_id: friendId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to send challenge' }));
    throw new Error(errorData.detail || 'Failed to send challenge');
  }

  return true;
};

/**
 * useQuizSharing Hook
 */
export const useQuizSharing = (): UseQuizSharingReturn => {
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate share link
   */
  const generateShareLink = useCallback(
    async (options: ShareQuizOptions): Promise<ShareData | null> => {
      const { quizId, title, quizTitle } = options;
      const visibility = options.visibility || options.privacy || 'public';

      logger.info('Generating share link', { quizId, visibility });

      setLoading(true);
      setError(null);

      try {
        // Call API to create share link
        const result = await createShareLinkAPI(quizId, visibility, title || quizTitle);

        setShareData(result);
        logger.info('Share link generated successfully', {
          shareCode: result.shareCode,
          privacy: result.privacy,
        });

        // Track analytics
        logger.info('Quiz shared', {
          quizId,
          title: title || quizTitle,
          privacy: visibility,
          shareCode: result.shareCode,
        });

        return result;
      } catch (err) {
        const friendlyError = getUserFriendlyError(err instanceof Error ? err : new Error(String(err)), {
          operation: 'create share link',
          resource: 'share link',
        });
        logger.error('Error generating share link', err);
        setError(friendlyError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get shared quiz
   */
  const getSharedQuiz = useCallback(
    async (shareCode: string): Promise<SharedQuizData | null> => {
      logger.info('Getting shared quiz', { shareCode });

      setLoading(true);
      setError(null);

      try {
        const result = await getSharedQuizAPI(shareCode);

        logger.info('Shared quiz loaded successfully', {
          shareCode,
          quizId: result.quiz.id,
        });

        return result;
      } catch (err) {
        const friendlyError = getUserFriendlyError(err instanceof Error ? err : new Error(String(err)), {
          operation: 'load shared quiz',
          resource: 'shared quiz',
        });
        logger.error('Error getting shared quiz', err);
        setError(friendlyError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Submit attempt to shared quiz
   */
  const submitAttempt = useCallback(
    async (shareCode: string, score: number, answers: any[]): Promise<boolean> => {
      logger.info('Submitting attempt', { shareCode, score });

      setLoading(true);
      setError(null);

      try {
        await submitAttemptAPI(shareCode, score, answers);

        logger.info('Attempt submitted successfully', { shareCode, score });
        return true;
      } catch (err) {
        const friendlyError = getUserFriendlyError(err instanceof Error ? err : new Error(String(err)), {
          operation: 'submit your quiz attempt',
          resource: 'quiz attempt',
        });
        logger.error('Error submitting attempt', err);
        setError(friendlyError);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Send challenge to friend
   */
  const sendChallenge = useCallback(
    async (shareCode: string, friendId: string): Promise<boolean> => {
      logger.info('Sending challenge', { shareCode, friendId });

      setLoading(true);
      setError(null);

      try {
        await sendChallengeAPI(shareCode, friendId);

        logger.info('Challenge sent successfully', { shareCode, friendId });
        return true;
      } catch (err) {
        const friendlyError = getUserFriendlyError(err instanceof Error ? err : new Error(String(err)), {
          operation: 'send challenge',
          resource: 'challenge',
        });
        logger.error('Error sending challenge', err);
        setError(friendlyError);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Copy URL to clipboard
   */
  const copyToClipboard = useCallback(async (url: string): Promise<boolean> => {
    try {
      await Clipboard.setStringAsync(url);
      Alert.alert('Success', 'Link copied to clipboard!');
      logger.info('Share link copied to clipboard', { url });
      return true;
    } catch (err) {
      logger.error('Failed to copy to clipboard', err);
      Alert.alert('Error', 'Failed to copy link. Please try again.');
      return false;
    }
  }, []);

  /**
   * Share to social media using native share sheet
   */
  const shareToSocial = useCallback(
    async (message: string, url: string, title?: string): Promise<boolean> => {
      try {
        const result = await RNShare.share({
          message,
          url,
          title: title || 'Alexandria Quiz',
        });

        if (result.action === RNShare.sharedAction) {
          logger.info('Quiz shared via native sheet', {
            activityType: result.activityType,
          });
          return true;
        } else {
          logger.info('Share dismissed');
          return false;
        }
      } catch (err) {
        logger.error('Failed to share', err);
        Alert.alert('Error', 'Failed to share quiz. Please try again.');
        return false;
      }
    },
    []
  );

  /**
   * Clear share data
   */
  const clearShareData = useCallback(() => {
    setShareData(null);
    setError(null);
    logger.info('Share data cleared');
  }, []);

  return {
    shareData,
    loading,
    error,
    generateShareLink,
    getSharedQuiz,
    submitAttempt,
    sendChallenge,
    copyToClipboard,
    shareToSocial,
    clearShareData,
  };
};

export default useQuizSharing;
