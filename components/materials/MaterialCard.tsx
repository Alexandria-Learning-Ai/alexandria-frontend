/**
 * MaterialCard - Card displaying material information
 *
 * Features:
 * - Material title and metadata (author, chapter count)
 * - Progress bar with percentage
 * - Material type badge
 * - Status badges (processing, failed, uploading)
 * - Retry button for failed materials
 * - Delete button with confirmation dialog
 * - Cover image from S3 with loading state and error fallback
 * - Shadow and elevation
 * - Touch feedback
 * - Alexandria theme styling
 *
 * @param material - Material data
 * @param onPress - Callback when card is pressed
 * @param onRetry - Callback when retry is pressed (optional)
 * @param onDelete - Callback when delete is confirmed (optional)
 */

import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { MaterialListItem, MaterialKind, MaterialStatus } from '../../types/materials';
import ProgressBar from '../shared/ProgressBar';
import ConfirmDialog from '../shared/ConfirmDialog';

interface MaterialCardProps {
  material: MaterialListItem;
  onPress: () => void;
  onRetry?: (materialId: string) => void;
  onDelete?: (materialId: string) => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material, onPress, onRetry, onDelete }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const themeColors = useMemo(
    () => ({
      background: Colors.surface,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      accent: Colors.accent,
      border: Colors.border,
      shadow: Colors.shadow,
      error: '#dc3545',
      warning: '#ffc107',
      success: '#28a745',
      processing: '#17a2b8',
    }),
    []
  );

  const getKindIcon = (kind: MaterialKind): string => {
    switch (kind) {
      case 'book':
        return 'book';
      case 'study_guide':
        return 'file-alt';
      case 'paper':
        return 'file-pdf';
      default:
        return 'file';
    }
  };

  const getKindLabel = (kind: MaterialKind): string => {
    switch (kind) {
      case 'book':
        return 'Book';
      case 'study_guide':
        return 'Study Guide';
      case 'paper':
        return 'Paper';
      default:
        return 'Material';
    }
  };

  const getStatusBadge = (status: MaterialStatus) => {
    switch (status) {
      case 'uploading':
        return {
          label: 'Uploading',
          color: themeColors.processing,
          icon: 'cloud-upload-alt',
        };
      case 'processing':
        return {
          label: 'Processing',
          color: themeColors.processing,
          icon: 'cog',
        };
      case 'failed':
        return {
          label: 'Failed',
          color: themeColors.error,
          icon: 'exclamation-triangle',
        };
      case 'needs_verification':
        return {
          label: 'Needs Review',
          color: themeColors.warning,
          icon: 'check-circle',
        };
      default:
        return null;
    }
  };

  const progressPercentage = Math.round(material.overall_progress * 100);
  const statusBadge = getStatusBadge(material.status);
  const showProgress = material.status === 'ready';
  const showRetryButton = material.status === 'failed' && onRetry;
  const isProcessing = material.status === 'uploading' || material.status === 'processing';

  const handleCardPress = () => {
    // Only allow navigation to detail if material is ready
    if (material.status === 'ready') {
      onPress();
    }
  };

  const handleRetry = (e: any) => {
    e.stopPropagation();
    if (onRetry) {
      onRetry(material.id);
    }
  };

  const handleDeletePress = (e: any) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteDialog(false);
    if (onDelete) {
      onDelete(material.id);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const handleImageError = () => {
    setImageLoadError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  console.log('MaterialCard cover_image_url:', material.cover_image_url);

  // Determine if we should show the cover image
  const hasCoverImage = material.cover_image_url && !imageLoadError;

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: themeColors.background }]}
        onPress={handleCardPress}
        activeOpacity={material.status === 'ready' ? 0.8 : 1}
        disabled={material.status !== 'ready'}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            {hasCoverImage ? (
              <>
                <Image
                  source={{ uri: material.cover_image_url }}
                  style={styles.coverImage}
                  resizeMode="cover"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                />
                {imageLoading && (
                  <View style={styles.imageLoadingOverlay}>
                    <ActivityIndicator size="small" color={themeColors.accent} />
                  </View>
                )}
              </>
            ) : isProcessing ? (
              <ActivityIndicator size="small" color={themeColors.processing} />
            ) : (
              <FontAwesome5
                name={getKindIcon(material.kind)}
                size={24}
                color={themeColors.accent}
              />
            )}
          </View>

          <View style={styles.headerContent}>
            <Text
              style={[styles.title, { color: themeColors.text }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {material.title}
            </Text>

            <View style={styles.badgeContainer}>
              <View style={[styles.badge, { backgroundColor: themeColors.border }]}>
                <Text style={[styles.badgeText, { color: themeColors.textSecondary }]}>
                  {getKindLabel(material.kind)}
                </Text>
              </View>

              {statusBadge && (
                <View style={[styles.badge, styles.statusBadge, { backgroundColor: statusBadge.color }]}>
                  <FontAwesome5 name={statusBadge.icon} size={10} color="#FFFFFF" />
                  <Text style={[styles.badgeText, styles.statusBadgeText]}>
                    {statusBadge.label}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeletePress}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="trash" size={18} color={themeColors.error} />
            </TouchableOpacity>
          )}
        </View>

      <View style={styles.metadata}>
        {material.author && (
          <Text
            style={[styles.metadataText, { color: themeColors.textSecondary }]}
            numberOfLines={1}
          >
            <FontAwesome5 name="user" size={12} color={themeColors.textSecondary} />{' '}
            {material.author}
          </Text>
        )}

        <Text style={[styles.metadataText, { color: themeColors.textSecondary }]}>
          <FontAwesome5 name="list" size={12} color={themeColors.textSecondary} />{' '}
          {material.chapter_count} {material.chapter_count === 1 ? 'chapter' : 'chapters'}
        </Text>

        {material.current_chapter_title && (
          <Text
            style={[styles.metadataText, { color: themeColors.textSecondary }]}
            numberOfLines={1}
          >
            <FontAwesome5 name="bookmark" size={12} color={themeColors.textSecondary} />{' '}
            {material.current_chapter_title}
          </Text>
        )}
      </View>

      {showProgress && (
        <View style={styles.progressContainer}>
          <ProgressBar progress={material.overall_progress} height={8} animated />

          <Text style={[styles.progressText, { color: themeColors.textSecondary }]}>
            {progressPercentage === 0
              ? 'Not started'
              : progressPercentage === 100
              ? 'Completed'
              : `${progressPercentage}% complete`}
          </Text>
        </View>
      )}

      {showRetryButton && (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: themeColors.processing }]}
          onPress={handleRetry}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="redo" size={14} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Retry Processing</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>

    <ConfirmDialog
      visible={showDeleteDialog}
      title="Delete Material"
      message={`Are you sure you want to delete "${material.title}"? This action cannot be undone and will delete all reading progress.`}
      confirmText="Delete"
      cancelText="Cancel"
      confirmDestructive
      onConfirm={handleConfirmDelete}
      onCancel={handleCancelDelete}
    />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBadgeText: {
    color: '#FFFFFF',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  metadata: {
    marginBottom: 12,
  },
  metadataText: {
    fontSize: 14,
    marginBottom: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MaterialCard;
