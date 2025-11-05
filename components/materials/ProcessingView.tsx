/**
 * ProcessingView - Material processing status indicator
 *
 * Features:
 * - Processing animation (spinner)
 * - Status message based on material status
 * - Polls material status every 3 seconds
 * - Navigates to BookDetail when status="ready"
 * - Shows error if status="failed"
 * - Cancel button (navigate back to library)
 * - Progress percentage (if available)
 * - Alexandria theme styling
 *
 * @param materialId - ID of the material being processed
 * @param onComplete - Callback when processing completes (status="ready")
 * @param onCancel - Callback to cancel and go back
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { Colors } from '../../constants/Colors';
import { API_BASE_URL } from '../../config/api';
import { auth } from '../../firebaseConfig';
import logger from '../../utils/logger';

interface ProcessingViewProps {
  materialId: string;
  onComplete: (materialId: string) => void;
  onCancel: () => void;
}

interface MaterialStatusResponse {
  id: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  error_message?: string;
  progress_pct?: number; // Optional: 0-100 percentage
  current_step?: string; // Optional: "Extracting text", "Splitting chapters", etc.
}

const ProcessingView: React.FC<ProcessingViewProps> = ({ materialId, onComplete, onCancel }) => {
  const themeColors = useMemo(
    () => ({
      background: Colors.background,
      surface: Colors.surface,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      textMuted: Colors.textMuted,
      accent: Colors.accent,
      accentLight: Colors.accentLight,
      success: Colors.success,
      error: Colors.error,
      warning: Colors.warning,
    }),
    []
  );

  // Poll material status
  const { data: statusData, isLoading } = useQuery<MaterialStatusResponse>({
    queryKey: ['materialStatus', materialId],
    queryFn: async () => {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }

      logger.info('Polling material status', { materialId });

      const response = await axios.get<MaterialStatusResponse>(
        `${API_BASE_URL}/api/materials/${materialId}/status`,
        {
          headers: {
            'X-User-ID': user.uid,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Material status fetched', {
        materialId,
        status: response.data.status,
        progress: response.data.progress_pct,
      });

      return response.data;
    },
    enabled: !!materialId && !!auth.currentUser,
    // CRITICAL FIX: Stop polling when status is terminal (ready/failed)
    // Increased from 3s to 10s to reduce API load
    refetchInterval: (data) => {
      if (data?.status === 'ready' || data?.status === 'failed') {
        return false; // Stop polling
      }
      return 10000; // Poll every 10 seconds (reduced from 3s)
    },
    refetchIntervalInBackground: false,
    retry: 2,
  });

  // Auto-navigate on completion
  useEffect(() => {
    if (statusData?.status === 'ready') {
      logger.success('Material processing complete', { materialId });
      onComplete(materialId);
    }
  }, [statusData, materialId, onComplete]);

  // Get status message
  const getStatusMessage = (): string => {
    if (!statusData) return 'Initializing...';

    switch (statusData.status) {
      case 'pending':
        return 'Preparing to process...';
      case 'processing':
        return statusData.current_step || 'Extracting text and splitting chapters...';
      case 'ready':
        return 'Processing complete!';
      case 'failed':
        return `Processing failed: ${statusData.error_message || 'Unknown error'}`;
      default:
        return 'Processing...';
    }
  };

  // Get status icon
  const getStatusIcon = (): string => {
    if (!statusData) return 'spinner';

    switch (statusData.status) {
      case 'failed':
        return 'exclamation-triangle';
      case 'ready':
        return 'check-circle';
      default:
        return 'spinner';
    }
  };

  // Get status color
  const getStatusColor = (): string => {
    if (!statusData) return themeColors.accent;

    switch (statusData.status) {
      case 'failed':
        return themeColors.error;
      case 'ready':
        return themeColors.success;
      case 'processing':
        return themeColors.accentLight;
      default:
        return themeColors.accent;
    }
  };

  const isFailed = statusData?.status === 'failed';
  const isReady = statusData?.status === 'ready';
  const isProcessing = statusData?.status === 'processing';
  const statusMessage = getStatusMessage();
  const statusIcon = getStatusIcon();
  const statusColor = getStatusColor();
  const progressPct = statusData?.progress_pct;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.card, { backgroundColor: themeColors.surface }]}>
        {/* Icon/Spinner */}
        <View style={styles.iconContainer}>
          {isProcessing || isLoading ? (
            <ActivityIndicator size="large" color={statusColor} />
          ) : (
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${statusColor}20` },
              ]}
            >
              <FontAwesome5
                name={statusIcon}
                size={48}
                color={statusColor}
                solid={isReady}
              />
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: themeColors.text }]}>
          {isFailed ? 'Processing Failed' : isReady ? 'Processing Complete' : 'Processing Material'}
        </Text>

        {/* Status Message */}
        <Text
          style={[
            styles.message,
            {
              color: isFailed ? themeColors.error : themeColors.textSecondary,
            },
          ]}
        >
          {statusMessage}
        </Text>

        {/* Progress Percentage */}
        {progressPct !== undefined && isProcessing && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPct}%`,
                    backgroundColor: statusColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: themeColors.textSecondary }]}>
              {Math.round(progressPct)}%
            </Text>
          </View>
        )}

        {/* Processing Steps (if available) */}
        {isProcessing && (
          <View style={styles.stepsContainer}>
            <View style={styles.stepItem}>
              <FontAwesome5
                name="check-circle"
                size={16}
                color={themeColors.success}
                solid
                style={styles.stepIcon}
              />
              <Text style={[styles.stepText, { color: themeColors.textSecondary }]}>
                File uploaded
              </Text>
            </View>

            <View style={styles.stepItem}>
              <FontAwesome5
                name={progressPct && progressPct > 30 ? 'check-circle' : 'circle'}
                size={16}
                color={progressPct && progressPct > 30 ? themeColors.success : themeColors.textMuted}
                solid={progressPct !== undefined && progressPct > 30}
                style={styles.stepIcon}
              />
              <Text style={[styles.stepText, { color: themeColors.textSecondary }]}>
                Extracting text
              </Text>
            </View>

            <View style={styles.stepItem}>
              <FontAwesome5
                name={progressPct && progressPct > 70 ? 'check-circle' : 'circle'}
                size={16}
                color={progressPct && progressPct > 70 ? themeColors.success : themeColors.textMuted}
                solid={progressPct !== undefined && progressPct > 70}
                style={styles.stepIcon}
              />
              <Text style={[styles.stepText, { color: themeColors.textSecondary }]}>
                Splitting chapters
              </Text>
            </View>
          </View>
        )}

        {/* Cancel/Back Button */}
        <TouchableOpacity
          style={[
            styles.cancelButton,
            {
              backgroundColor: isFailed ? themeColors.error : themeColors.textMuted,
              opacity: isFailed ? 1 : 0.8,
            },
          ]}
          onPress={onCancel}
          activeOpacity={0.8}
        >
          <FontAwesome5
            name={isFailed ? 'times-circle' : 'arrow-left'}
            size={16}
            color={Colors.white}
            style={styles.buttonIcon}
          />
          <Text style={styles.cancelButtonText}>
            {isFailed ? 'Cancel' : 'Go Back'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepsContainer: {
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIcon: {
    marginRight: 10,
    width: 20,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 140,
  },
  buttonIcon: {
    marginRight: 8,
  },
  cancelButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProcessingView;
