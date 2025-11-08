/**
 * ImageQuestion Component
 *
 * Renders questions with accompanying images
 *
 * Features:
 * - Image display with loading states
 * - Optional image caption
 * - Text input for answer below image
 * - Error handling for broken images
 * - Take/review modes
 * - Alexandria theme styling
 */

import React, { useState } from 'react';
import { View, Text, TextInput, Image, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { ExamMode } from '../../../types/exam';
import { colors, radius, spacing } from '../../../theme/tokens';
import logger from '../../../utils/logger';

interface ImageQuestionMetadata {
  image_url: string;
  image_caption?: string;
}

interface ImageQuestionData {
  question_number: number;
  question_text: string;
  question_type: 'image';
  correct_answer: string;
  section: string;
  metadata: ImageQuestionMetadata;
}

interface ImageQuestionProps {
  question: ImageQuestionData;
  userAnswer?: string;
  onAnswer: (answer: string) => void;
  mode: ExamMode;
}

/**
 * Image Question Component
 *
 * Displays a question with an accompanying image and text input
 *
 * @param question - Question data with image metadata
 * @param userAnswer - Current answer text
 * @param onAnswer - Callback when answer changes
 * @param mode - 'take' (interactive) or 'review' (read-only)
 */
export default function ImageQuestion({
  question,
  userAnswer = '',
  onAnswer,
  mode
}: ImageQuestionProps) {
  const [text, setText] = useState(userAnswer);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const isReview = mode === 'review';

  const imageUrl = question.metadata?.image_url;
  const imageCaption = question.metadata?.image_caption;

  const handleChangeText = (newText: string) => {
    setText(newText);
    onAnswer(newText);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    logger.debug('Image loaded successfully', { questionNumber: question.question_number });
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    logger.error('Failed to load image', {
      questionNumber: question.question_number,
      imageUrl
    });
  };

  const screenWidth = Dimensions.get('window').width;
  const imageWidth = screenWidth - (spacing[16] * 2); // Account for padding
  const imageHeight = Math.min(imageWidth * 0.75, 400); // 4:3 aspect ratio, max 400px

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.question_text}</Text>

      {/* Image Container */}
      {imageUrl ? (
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          {imageLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.gold} />
              <Text style={styles.loadingText}>Loading image...</Text>
            </View>
          )}

          {imageError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>🖼️</Text>
              <Text style={styles.errorText}>Failed to load image</Text>
              <Text style={styles.errorUrl} numberOfLines={1}>
                {imageUrl}
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No image provided</Text>
        </View>
      )}

      {/* Image Caption */}
      {imageCaption && (
        <Text style={styles.caption}>{imageCaption}</Text>
      )}

      {/* Answer Input */}
      {!isReview ? (
        <>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={handleChangeText}
            placeholder="Type your answer here..."
            placeholderTextColor={colors.textMute}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isReview}
          />
          <Text style={styles.hintText}>
            Describe what you observe in the image and answer the question
          </Text>
        </>
      ) : (
        <>
          <View style={styles.reviewAnswerContainer}>
            <Text style={styles.reviewLabel}>Your Answer:</Text>
            <Text style={styles.reviewAnswerText}>
              {text || '(No answer provided)'}
            </Text>
          </View>

          {question.correct_answer && (
            <View style={styles.correctAnswerContainer}>
              <Text style={styles.correctLabel}>Expected Answer:</Text>
              <Text style={styles.correctAnswerText}>
                {question.correct_answer}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[24],
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    marginBottom: spacing[16],
  },
  imageContainer: {
    width: '100%',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
    marginBottom: spacing[12],
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  loadingText: {
    marginTop: spacing[12],
    fontSize: 14,
    color: colors.textDim,
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg2,
    padding: spacing[20],
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing[12],
  },
  errorText: {
    fontSize: 15,
    color: colors.danger,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing[8],
  },
  errorUrl: {
    fontSize: 12,
    color: colors.textMute,
    textAlign: 'center',
  },
  caption: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.textDim,
    textAlign: 'center',
    marginBottom: spacing[16],
    paddingHorizontal: spacing[4],
  },
  textInput: {
    minHeight: 120,
    padding: spacing[16],
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
    marginBottom: spacing[8],
  },
  hintText: {
    fontSize: 13,
    color: colors.textMute,
    fontStyle: 'italic',
    paddingHorizontal: spacing[4],
  },
  reviewAnswerContainer: {
    padding: spacing[16],
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
    marginBottom: spacing[12],
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: spacing[8],
  },
  reviewAnswerText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  correctAnswerContainer: {
    padding: spacing[16],
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.success,
    borderRadius: radius.md,
  },
  correctLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
    marginBottom: spacing[8],
  },
  correctAnswerText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
});
