import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import UploadProgressBar from './UploadProgressBar';
import { getStageName, getStageIcon } from '../../hooks/useAsyncQuizGeneration';

interface AsyncQuizProgressProps {
    isVisible: boolean;
    progress: number; // 0-100
    stage: string;
    message: string;
    onCancel?: () => void;
    themeColors: any;
    styles: any;
}

/**
 * AsyncQuizProgress - Real-time progress display for async quiz generation
 *
 * Displays:
 * - Current progress percentage
 * - Stage name and icon
 * - Progress message
 * - Cancel button
 * - Multi-stage progress bar
 *
 * Integrates with useAsyncQuizGeneration hook for real-time SSE updates
 */
export const AsyncQuizProgress: React.FC<AsyncQuizProgressProps> = ({
    isVisible,
    progress,
    stage,
    message,
    onCancel,
    themeColors,
    styles,
}) => {
    if (!isVisible) return null;

    // Map internal stages to UploadProgressBar stages
    const getProgressBarStage = (): 'upload' | 'extract' | 'process' | 'generate' => {
        if (stage === 'uploading' || stage === 'queued' || stage === 'hashing') {
            return 'upload';
        }
        if (stage === 'extraction') {
            return 'extract';
        }
        if (stage === 'generation') {
            return 'generate';
        }
        if (stage === 'storing' || stage === 'caching') {
            return 'process';
        }
        return 'upload';
    };

    // Calculate estimated time (very rough estimate)
    const getEstimatedTime = (): number => {
        if (progress >= 90) return 5; // Almost done
        if (progress >= 50) return 15; // Half way
        if (progress >= 20) return 30; // Started
        return 45; // Just started
    };

    return (
        <View style={asyncProgressStyles.container}>
            {/* Header */}
            <View style={asyncProgressStyles.header}>
                <View style={asyncProgressStyles.headerContent}>
                    <FontAwesome5
                        name={getStageIcon(stage)}
                        size={24}
                        color={themeColors.alexandriaGold}
                    />
                    <View style={asyncProgressStyles.headerText}>
                        <Text style={[asyncProgressStyles.title, { color: themeColors.text }]}>
                            {getStageName(stage)}
                        </Text>
                        <Text style={[asyncProgressStyles.subtitle, { color: themeColors.textSecondary }]}>
                            {Math.round(progress)}% complete
                        </Text>
                    </View>
                </View>

                {onCancel && (
                    <TouchableOpacity
                        onPress={onCancel}
                        style={asyncProgressStyles.cancelButton}
                        accessibilityLabel="Cancel quiz generation"
                        accessibilityRole="button"
                    >
                        <FontAwesome5 name="times" size={18} color={themeColors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Progress Message */}
            <Text style={[asyncProgressStyles.message, { color: themeColors.text }]}>
                {message}
            </Text>

            {/* Enhanced Progress Bar */}
            <UploadProgressBar
                isVisible={true}
                progressWidth={progress} // Pass actual progress
                themeColors={themeColors}
                styles={styles}
                currentStage={getProgressBarStage()}
                progress={progress}
                estimatedTime={getEstimatedTime()}
            />

            {/* Progress Details */}
            <View style={asyncProgressStyles.details}>
                <View style={asyncProgressStyles.detailItem}>
                    <FontAwesome5 name="clock" size={12} color={themeColors.textSecondary} />
                    <Text style={[asyncProgressStyles.detailText, { color: themeColors.textSecondary }]}>
                        ~{getEstimatedTime()}s remaining
                    </Text>
                </View>

                <View style={asyncProgressStyles.detailItem}>
                    <FontAwesome5 name="server" size={12} color={themeColors.textSecondary} />
                    <Text style={[asyncProgressStyles.detailText, { color: themeColors.textSecondary }]}>
                        Background processing
                    </Text>
                </View>
            </View>

            {/* Info Message */}
            <View style={[asyncProgressStyles.infoBox, { backgroundColor: themeColors.glass }]}>
                <FontAwesome5 name="info-circle" size={14} color={themeColors.alexandriaGold} />
                <Text style={[asyncProgressStyles.infoText, { color: themeColors.textSecondary }]}>
                    You can close this screen. We'll notify you when your quiz is ready!
                </Text>
            </View>
        </View>
    );
};

const asyncProgressStyles = StyleSheet.create({
    container: {
        padding: 20,
        borderRadius: 16,
        marginVertical: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerText: {
        marginLeft: 12,
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    cancelButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        fontSize: 15,
        marginBottom: 20,
        lineHeight: 22,
    },
    details: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        marginBottom: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 12,
        marginLeft: 6,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    infoText: {
        fontSize: 12,
        marginLeft: 8,
        flex: 1,
        lineHeight: 18,
    },
});

export default AsyncQuizProgress;
