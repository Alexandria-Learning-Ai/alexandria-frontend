/**
 * MaterialViewerScreen Styles
 * Extracted styles for material viewing and study modes
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 10,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
    },
    headerInfo: {
        flex: 1,
        marginHorizontal: 16,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#E0E0E0',
        marginTop: 2,
    },
    moreButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    modeSelector: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    modeSelectorScroll: {
        flexGrow: 1,
    },
    modeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginHorizontal: 2,
        minWidth: 80,
        gap: 6,
    },
    activeModeButton: {
        backgroundColor: '#4A90E2',
    },
    modeButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    contentArea: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    contentContainer: {
        flex: 1,
    },
    readingControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
        gap: 16,
    },
    controlButton: {
        padding: 8,
        borderRadius: 6,
        minWidth: 32,
        alignItems: 'center',
    },
    fontSizeText: {
        fontSize: 14,
        fontWeight: '500',
    },
    contentScroll: {
        flex: 1,
        padding: 20,
    },
    contentText: {
        lineHeight: 26,
        textAlign: 'justify',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    keyPointItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        paddingRight: 8,
    },
    keyPointIcon: {
        marginTop: 2,
        marginRight: 12,
    },
    keyPointText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
    },
    summaryText: {
        fontSize: 16,
        lineHeight: 26,
        textAlign: 'justify',
    },
    audioContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    audioControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
        marginBottom: 40,
    },
    audioButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressContainer: {
        width: '100%',
        alignItems: 'center',
        gap: 12,
    },
    progressBar: {
        width: '100%',
        height: 4,
        backgroundColor: '#E9ECEF',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4A90E2',
    },
    timeText: {
        fontSize: 14,
        fontWeight: '500',
    },
    audioStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 20,
    },
    audioStatusText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveToPlaylistButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        gap: 8,
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    saveToPlaylistText: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Audio Loading State
    audioLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 16,
    },
    audioLoadingText: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 16,
    },
    audioLoadingSubtext: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic',
    },
    generationProgressContainer: {
        width: '100%',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
    },
    generationProgressBar: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    generationProgressFill: {
        height: '100%',
        backgroundColor: '#D4AF37',
    },
    progressPercentText: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Audio Error State
    audioErrorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 16,
    },
    audioErrorTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 16,
    },
    audioErrorMessage: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 8,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D4AF37',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        gap: 8,
        marginTop: 16,
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    backToReadButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginTop: 8,
    },
    backToReadText: {
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },

    // Voice Settings
    voiceSettingsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    voiceSettingsText: {
        fontSize: 14,
        fontWeight: '500',
    },

    // Deep Study Mode Styles
    studyAnalyticsHeader: {
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    analyticsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    analyticsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    analyticsText: {
        fontSize: 12,
        fontWeight: '500',
    },
    deepStudyContent: {
        padding: 16,
    },
    learningObjectives: {
        marginBottom: 20,
        padding: 16,
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        borderRadius: 8,
    },
    objectiveItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        gap: 8,
    },
    objectiveText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    interactiveTextContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    bookmarkIndicator: {
        position: 'absolute',
        right: 10,
        zIndex: 10,
    },
    studyControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 16,
        paddingHorizontal: 8,
    },
    studyControlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
    },
    controlButtonText: {
        fontSize: 12,
        fontWeight: '500',
    },
    keyConcepts: {
        marginTop: 20,
        padding: 16,
        backgroundColor: 'rgba(255, 165, 0, 0.1)',
        borderRadius: 8,
    },
    conceptItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 8,
    },
    conceptContent: {
        flex: 1,
    },
    conceptName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    conceptDefinition: {
        fontSize: 14,
        lineHeight: 20,
    },
    notesPanel: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(212, 175, 55, 0.3)',
        padding: 16,
    },
    notesInput: {
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        maxHeight: 80,
    },

    // Quick Review Mode Styles
    quickReviewHeader: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    reviewStats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    reviewModeText: {
        fontSize: 16,
        fontWeight: '700',
    },
    reviewTimer: {
        fontSize: 12,
        fontWeight: '500',
    },
    quickReviewSection: {
        marginBottom: 24,
        padding: 16,
        backgroundColor: 'rgba(248, 244, 227, 0.05)',
        borderRadius: 8,
    },
    quickPointItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 12,
    },
    pointNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#D4AF37',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pointNumberText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1A2C5B',
    },
    quickPointText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
    },
    quickConceptCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#D4AF37',
    },
    quickConceptName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    quickConceptDef: {
        fontSize: 14,
        lineHeight: 20,
    },
    quickSummaryText: {
        fontSize: 15,
        lineHeight: 24,
        textAlign: 'justify',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        gap: 16,
    },
    quickActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D4AF37',
        borderRadius: 25,
        paddingVertical: 12,
        gap: 8,
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Hybrid Mode Styles
    hybridControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        gap: 12,
    },
    hybridButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hybridProgress: {
        flex: 1,
        paddingHorizontal: 8,
    },
    hybridProgressText: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
        textAlign: 'center',
    },
    hybridProgressBar: {
        height: 4,
        backgroundColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    hybridProgressFill: {
        height: '100%',
        backgroundColor: '#D4AF37',
    },
    hybridSettingsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hybridTextContainer: {
        padding: 16,
        position: 'relative',
    },
    emphasisIndicator: {
        position: 'absolute',
        right: 10,
        zIndex: 5,
    },
    hybridFeaturesPanel: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(212, 175, 55, 0.3)',
        padding: 12,
    },
    hybridFeatureButton: {
        alignItems: 'center',
        padding: 8,
        gap: 4,
    },
    hybridFeatureText: {
        fontSize: 10,
        fontWeight: '500',
    },
});
