/**
 * Upload Navigation Utilities
 *
 * Extracted navigation functions for post-upload screen transitions.
 * Handles navigation to MaterialViewer, QuizScreen, and related alerts.
 */

import { Alert, Animated, Vibration } from 'react-native';
import {
  StudyMaterial,
  Quiz,
  QuizMetadata,
  UploadScreenNavigationProp,
} from '../../types/upload.types';
import { ANIMATIONS, HAPTICS, SUCCESS_MESSAGES } from '../../constants/uploadConstants';
import logger from '../../utils/logger';

/**
 * Navigate to MaterialViewer with study material
 *
 * Performs animated transition and shows success alert after navigation.
 *
 * @param navigation - React Navigation object
 * @param studyMaterial - Study material data
 * @param containerAnim - Animation value for screen transition
 * @param onSuccess - Callback function called after successful navigation
 */
export const navigateToStudyMaterial = (
  navigation: UploadScreenNavigationProp,
  studyMaterial: StudyMaterial,
  containerAnim: Animated.Value,
  onSuccess?: () => void
): void => {
  Animated.timing(containerAnim, {
    toValue: 0,
    duration: ANIMATIONS.SCREEN_TRANSITION,
    useNativeDriver: true,
  }).start(({ finished }) => {
    // Only navigate if animation completed successfully (not interrupted)
    if (finished) {
      try {
        navigation.navigate('MaterialViewer', {
          material: studyMaterial,
          mode: 'read',
        });

        // Show success alert AFTER navigation to avoid showing on wrong screen
        setTimeout(() => {
          const message = SUCCESS_MESSAGES.STUDY_MATERIAL_ADDED(studyMaterial.title);
          Alert.alert(
            message.title,
            message.message,
            [
              { text: 'View Library', onPress: () => navigation.navigate('StudyMaterials') },
              { text: 'Start Reading', style: 'default' },
            ]
          );
        }, ANIMATIONS.SUCCESS_ALERT_DELAY);

        // Execute success callback (cleanup, haptics, etc.)
        onSuccess?.();
      } catch (navError) {
        logger.error('❌ Navigation error to MaterialViewer:', navError);
      }
    }
  });
};

/**
 * Navigate to QuizScreen with generated quiz
 *
 * Performs animated transition and shows success alert after navigation.
 *
 * @param navigation - React Navigation object
 * @param quiz - Generated quiz data
 * @param metadata - Quiz metadata
 * @param containerAnim - Animation value for screen transition
 * @param onSuccess - Callback function called after successful navigation
 */
export const navigateToQuiz = (
  navigation: UploadScreenNavigationProp,
  quiz: Quiz,
  metadata: QuizMetadata,
  containerAnim: Animated.Value,
  onSuccess?: () => void
): void => {
  Animated.timing(containerAnim, {
    toValue: 0,
    duration: ANIMATIONS.SCREEN_TRANSITION,
    useNativeDriver: true,
  }).start(({ finished }) => {
    // Only navigate if animation completed successfully (not interrupted)
    if (finished) {
      try {
        navigation.navigate('QuizScreen', {
          quiz,
          source: 'Upload',
          metadata,
        });

        // Show success alert AFTER navigation to avoid showing on wrong screen
        setTimeout(() => {
          Alert.alert(
            SUCCESS_MESSAGES.QUIZ_GENERATED.title,
            SUCCESS_MESSAGES.QUIZ_GENERATED.message
          );
        }, ANIMATIONS.SUCCESS_ALERT_DELAY);

        // Execute success callback
        onSuccess?.();
      } catch (navError) {
        logger.error('❌ Navigation error to QuizScreen:', navError);
      }
    }
  });
};

/**
 * Execute post-upload cleanup and success feedback
 *
 * @param onFilesCleared - Callback to clear file selection
 * @param onSubjectCleared - Callback to clear subject selection
 */
export const executePostUploadCleanup = (
  onFilesCleared?: () => void,
  onSubjectCleared?: () => void
): void => {
  onFilesCleared?.();
  onSubjectCleared?.();
  Vibration.vibrate(HAPTICS.SUCCESS);
};
