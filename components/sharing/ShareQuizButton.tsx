/**
 * ShareQuizButton.tsx
 *
 * Button and modal for sharing quizzes with others.
 * Allows users to generate shareable links with different access levels.
 *
 * Features:
 * - Privacy level selection (Public, Friends Only, Private)
 * - Shareable link generation
 * - Copy to clipboard
 * - Social media share intents
 * - Share code display (e.g., "DB4K2X9P")
 * - Alexandria theme styling
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  Share as RNShare,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import logger from '../../utils/logger';
import type { ThemeColors } from '../../types';
import { useQuizSharing } from '../../hooks/useQuizSharing';

export interface ShareQuizButtonProps {
  quizId: number | string; // Quiz ID
  quizTitle: string; // Quiz title to display
  score?: number; // Optional score to show
  totalQuestions?: number; // Total questions in quiz
  themeColors: ThemeColors; // Alexandria theme colors
  onShareSuccess?: (shareUrl: string, shareCode: string) => void; // Callback on successful share
}

type SharePrivacy = 'public' | 'friends' | 'private';

export const ShareQuizButton: React.FC<ShareQuizButtonProps> = ({
  quizId,
  quizTitle,
  score,
  totalQuestions,
  themeColors,
  onShareSuccess,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPrivacy, setSelectedPrivacy] = useState<SharePrivacy>('public');

  const {
    generateShareLink,
    shareData,
    loading,
    error,
    copyToClipboard: hookCopyToClipboard,
    shareToSocial,
    clearShareData,
  } = useQuizSharing();

  /**
   * Open modal
   */
  const openModal = () => {
    setModalVisible(true);
  };

  /**
   * Close modal
   */
  const closeModal = () => {
    setModalVisible(false);
    clearShareData();
  };

  /**
   * Generate share link
   */
  const handleGenerateLink = async () => {
    logger.info('Generating share link', { quizId, visibility: selectedPrivacy });

    const result = await generateShareLink({
      quizId,
      visibility: selectedPrivacy,
      title: quizTitle,
    });

    if (result && onShareSuccess) {
      onShareSuccess(result.shareUrl, result.shareCode);
    }
  };

  /**
   * Copy link to clipboard
   */
  const handleCopyLink = async () => {
    if (!shareData) return;

    await hookCopyToClipboard(shareData.shareUrl);
  };

  /**
   * Share via native share sheet
   */
  const handleNativeShare = async () => {
    if (!shareData) return;

    const message = score !== undefined
      ? `I scored ${score}/${totalQuestions} on "${quizTitle}"! Can you beat my score? ${shareData.shareUrl}`
      : `Check out this quiz: "${quizTitle}" ${shareData.shareUrl}`;

    await shareToSocial(message, shareData.shareUrl, quizTitle);
  };

  /**
   * Privacy options
   */
  const privacyOptions: Array<{ value: SharePrivacy; label: string; icon: string; description: string }> = [
    {
      value: 'public',
      label: 'Public',
      icon: 'globe',
      description: 'Anyone with link',
    },
    {
      value: 'friends',
      label: 'Friends Only',
      icon: 'user-friends',
      description: 'Only your friends',
    },
    {
      value: 'private',
      label: 'Private',
      icon: 'lock',
      description: 'Only you',
    },
  ];

  /**
   * Render privacy selector
   */
  const renderPrivacySelector = () => {
    return (
      <View style={styles.privacyContainer}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Who can access this quiz?
        </Text>
        {privacyOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.privacyOption,
              {
                borderColor:
                  selectedPrivacy === option.value
                    ? themeColors.alexandriaGold
                    : themeColors.border,
                backgroundColor:
                  selectedPrivacy === option.value
                    ? themeColors.alexandriaGold + '20'
                    : themeColors.surface,
              },
            ]}
            onPress={() => setSelectedPrivacy(option.value)}
            activeOpacity={0.7}
          >
            <View style={styles.privacyOptionContent}>
              <FontAwesome5
                name={option.icon}
                size={20}
                color={
                  selectedPrivacy === option.value
                    ? themeColors.alexandriaGold
                    : themeColors.textSecondary
                }
                style={styles.privacyIcon}
              />
              <View style={styles.privacyTextContainer}>
                <Text
                  style={[
                    styles.privacyLabel,
                    {
                      color:
                        selectedPrivacy === option.value
                          ? themeColors.alexandriaGold
                          : themeColors.text,
                    },
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={[styles.privacyDescription, { color: themeColors.textSecondary }]}>
                  {option.description}
                </Text>
              </View>
              {selectedPrivacy === option.value && (
                <FontAwesome5
                  name="check-circle"
                  size={20}
                  color={themeColors.alexandriaGold}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  /**
   * Render share link section
   */
  const renderShareLink = () => {
    if (!shareData) return null;

    return (
      <Animatable.View animation="fadeInUp" duration={400}>
        <View style={styles.shareLinkContainer}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Share Link
          </Text>

          {/* Share Code */}
          <View
            style={[
              styles.shareCodeBox,
              {
                backgroundColor: themeColors.alexandriaGold + '20',
                borderColor: themeColors.alexandriaGold,
              },
            ]}
          >
            <Text style={[styles.shareCodeLabel, { color: themeColors.textSecondary }]}>
              Share Code
            </Text>
            <Text style={[styles.shareCode, { color: themeColors.alexandriaGold }]}>
              {shareData.shareCode}
            </Text>
          </View>

          {/* URL Input */}
          <View style={styles.urlContainer}>
            <TextInput
              style={[
                styles.urlInput,
                {
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.surface,
                  color: themeColors.text,
                },
              ]}
              value={shareData.shareUrl}
              editable={false}
              selectTextOnFocus
            />
            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: themeColors.alexandriaGold }]}
              onPress={handleCopyLink}
              activeOpacity={0.8}
            >
              <FontAwesome5 name="copy" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Share Buttons */}
          <TouchableOpacity
            style={[styles.shareNativeButton, { backgroundColor: themeColors.alexandriaGold }]}
            onPress={handleNativeShare}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="share-alt" size={18} color="#FFFFFF" style={styles.shareIcon} />
            <Text style={styles.shareNativeButtonText}>Share Now</Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    );
  };

  return (
    <>
      {/* Share Button */}
      <TouchableOpacity
        style={[styles.shareButton, { backgroundColor: themeColors.alexandriaGold }]}
        onPress={openModal}
        activeOpacity={0.8}
      >
        <FontAwesome5 name="share-alt" size={18} color="#FFFFFF" style={styles.buttonIcon} />
        <Text style={styles.shareButtonText}>Share This Quiz</Text>
      </TouchableOpacity>

      {/* Share Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View animation="slideInUp" duration={400} style={styles.modalContent}>
            <LinearGradient
              colors={[themeColors.surface, themeColors.surfaceSecondary]}
              style={[
                styles.modalInner,
                {
                  borderColor: themeColors.border,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <FontAwesome5
                    name="share-alt"
                    size={24}
                    color={themeColors.alexandriaGold}
                    style={styles.modalIcon}
                  />
                  <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                    Share Your Quiz
                  </Text>
                </View>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <FontAwesome5 name="times" size={24} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Quiz Title */}
              <Text style={[styles.quizTitle, { color: themeColors.textSecondary }]}>
                {quizTitle}
              </Text>

              {/* Privacy Selector */}
              {renderPrivacySelector()}

              {/* Share Link (shown after generation) */}
              {renderShareLink()}

              {/* Error Message */}
              {error && !shareData && (
                <Text style={[styles.errorMessage, { color: themeColors.error }]}>
                  {error}
                </Text>
              )}

              {/* Generate Button */}
              {!shareData && (
                <TouchableOpacity
                  style={[
                    styles.generateButton,
                    { backgroundColor: themeColors.alexandriaGold },
                  ]}
                  onPress={handleGenerateLink}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonIcon} />
                      <Text style={styles.generateButtonText}>Generating...</Text>
                    </>
                  ) : (
                    <>
                      <FontAwesome5
                        name="link"
                        size={18}
                        color="#FFFFFF"
                        style={styles.buttonIcon}
                      />
                      <Text style={styles.generateButtonText}>Generate Share Link</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </LinearGradient>
          </Animatable.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalInner: {
    padding: 24,
    borderTopWidth: 2,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIcon: {
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  privacyContainer: {
    marginBottom: 24,
  },
  privacyOption: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
  privacyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyIcon: {
    marginRight: 12,
  },
  privacyTextContainer: {
    flex: 1,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  privacyDescription: {
    fontSize: 13,
  },
  shareLinkContainer: {
    marginBottom: 24,
  },
  shareCodeBox: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  shareCodeLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  shareCode: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  urlInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    padding: 14,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  copyButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareNativeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareIcon: {
    marginRight: 8,
  },
  shareNativeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorMessage: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
});

export default ShareQuizButton;
