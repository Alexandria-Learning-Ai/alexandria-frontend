/**
 * ProgressTrackerScreen Styles
 * Extracted styles for progress tracking and analytics display
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    headerContainer: {
        marginBottom: 30,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    titleIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },

    // ✅ NEW: Data source indicator styles
    dataSourceIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignSelf: 'center',
    },
    dataSourceText: {
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
        opacity: 0.8,
    },
    periodSelector: {
        flexDirection: 'row',
        marginBottom: 30,
        borderRadius: 12,
        padding: 4,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    periodButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    tabSelector: {
        flexDirection: 'row',
        marginBottom: 30,
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderRadius: 8,
        gap: 4,
    },
    tabText: {
        fontSize: 10,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        marginBottom: 30,
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '800',
        marginVertical: 8,
    },
    statLabel: {
        fontSize: 12,
        textAlign: 'center',
        opacity: 0.8,
    },
    chartContainer: {
        marginBottom: 30,
        padding: 20,
        borderRadius: 20,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    chartTitle: {
        fontSize: 20,
        fontWeight: '700',
        // marginBottom: 16, // This margin is now handled by the parent container's 'gap' style
        textAlign: 'center',
    },
    chartSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        opacity: 0.7,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    noDataContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noDataText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        opacity: 0.7,
    },
    categoryItem: {
        marginBottom: 20,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
    },
    categoryAccuracy: {
        fontSize: 16,
        fontWeight: '700',
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 3,
        marginBottom: 4,
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    },
    categoryCount: {
        fontSize: 12,
        opacity: 0.7,
    },
    notificationStatus: {
        marginBottom: 16,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    statusLabel: {
        fontSize: 14,
    },
    statusValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    analysisPreview: {
        marginBottom: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    analysisTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    analysisText: {
        fontSize: 14,
        marginBottom: 4,
    },
    notificationActions: {
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    loadingText: {
        fontSize: 16,
        marginTop: 12,
        opacity: 0.8,
    },
    overviewStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    overviewStat: {
        alignItems: 'center',
    },
    overviewValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    overviewLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    highlightContainer: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    highlight: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    highlightText: {
        fontSize: 14,
    },
    subjectCard: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    subjectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    subjectInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    subjectIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    subjectDetails: {
        flex: 1,
    },
    subjectName: {
        fontSize: 16,
        fontWeight: '600',
    },
    activityText: {
        fontSize: 12,
        marginTop: 2,
    },
    trendIndicator: {
        padding: 4,
    },
    subjectStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        marginBottom: 16,
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    practiceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        gap: 6,
    },
    practiceButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    viewMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginTop: 8,
        borderRadius: 8,
        gap: 8,
    },
    viewMoreText: {
        fontSize: 14,
        fontWeight: '600',
    },
    recommendationItem: {
        marginBottom: 16,
        padding: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    recommendationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    recommendationPriority: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    recommendationMessage: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    // ✅ NEW: Styles for toggle chart
    chartHeaderWithToggle: {
        flexDirection: 'column', // Changed from 'row' to stack items vertically
        alignItems: 'center',    // Center the title and buttons
        marginBottom: 16,
        gap: 12,                 // Add space between the title and the buttons
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 8,
        padding: 2,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        marginHorizontal: 1,
        gap: 4,
    },
    activeToggleButton: {
        backgroundColor: '#1A2C5B',
    },
    toggleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    chartInsights: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    insightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    insightText: {
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    // 🚀 NEW: Advanced Analytics Styles
    predictionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    predictionStat: {
        alignItems: 'center',
        flex: 1,
    },
    predictionValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    predictionLabel: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
    recommendationText: {
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 12,
        paddingHorizontal: 8,
        textAlign: 'center',
    },
    factorsContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    factorsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    factorText: {
        fontSize: 12,
        marginBottom: 4,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    goalEditButton: {
        padding: 8,
        borderRadius: 16,
        borderWidth: 1,
    },
    goalsGrid: {
        gap: 12,
    },
    goalItem: {
        marginBottom: 12,
    },
    goalLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
    },
    goalProgress: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 3,
        marginBottom: 4,
    },
    goalProgressBar: {
        height: '100%',
        borderRadius: 3,
    },
    goalText: {
        fontSize: 12,
        textAlign: 'right',
    },
    velocityStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    velocityStat: {
        alignItems: 'center',
        flex: 1,
    },
    velocityValue: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    velocityLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    velocityTrend: {
        fontSize: 16,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    velocityAnalysis: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 8,
    },
    velocityDetails: {
        fontSize: 12,
        textAlign: 'center',
        opacity: 0.7,
    },
    difficultyHeader: {
        marginBottom: 16,
    },
    currentLevel: {
        fontSize: 16,
        marginBottom: 8,
    },
    readinessIndicator: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    readinessText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    difficultyRecommendation: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 16,
    },
    nextStepsContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    nextStepsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    nextStepItem: {
        fontSize: 12,
        marginBottom: 4,
    },
    timeStatsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    timeStat: {
        width: '48%',
        alignItems: 'center',
        marginBottom: 12,
    },
    timeValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    timeLabel: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
    timeRecommendations: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    recommendationsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    // ✅ NEW: Hierarchical Courses Styles
    hierarchicalStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    hierarchicalStat: {
        alignItems: 'center',
        flex: 1,
    },
    hierarchicalValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    hierarchicalLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    subjectHeaderExpanded: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    subjectTitleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    subjectIconLarge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    subjectNameLarge: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    subjectSummary: {
        fontSize: 14,
        marginTop: 4,
    },
    expandButton: {
        padding: 8,
        borderRadius: 16,
        borderWidth: 1,
    },
    coursesContainer: {
        marginTop: 16,
    },
    courseCard: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    courseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    courseInfo: {
        flex: 1,
    },
    courseName: {
        fontSize: 16,
        fontWeight: '600',
    },
    courseStats: {
        fontSize: 12,
        marginTop: 2,
    },
    courseScoreContainer: {
        alignItems: 'flex-end',
    },
    courseScore: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    topicsContainer: {
        marginTop: 12,
    },
    topicsTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    topicsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    topicChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    topicName: {
        fontSize: 11,
        fontWeight: '500',
    },
    topicScore: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    moreTopics: {
        fontSize: 11,
        fontStyle: 'italic',
        alignSelf: 'center',
    },
});
