/**
 * FlashcardScreen Styles
 * Enhanced Alexandria-themed styles for flashcard study interface
 */

import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 10,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  sessionMenuButton: {
    padding: 10,
  },
  sessionStatsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 20,
    borderRadius: 15,
    marginBottom: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  accuracyIndicator: {
    marginLeft: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    backfaceVisibility: 'hidden',
  },
  cardVisible: {
    zIndex: 1,
  },
  cardBack: {
    zIndex: 0,
  },
  cardContent: {
    flex: 1,
    padding: 25,
  },
  subjectIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  subjectBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    flex: 1,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  questionScrollContainer: {
    flex: 1,
    marginBottom: 20,
  },
  questionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 120,
  },
  cardQuestion: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 32,
    textAlign: 'center',
  },
  interactionHints: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    marginBottom: 10,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 12,
    marginLeft: 6,
    opacity: 0.7,
  },
  showAnswerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  showAnswerText: {
    fontSize: 18,
    fontWeight: '700',
  },
  answerScrollView: {
    flex: 1,
  },
  flashcardAnswerLayout: {
    flex: 1,
    paddingBottom: 20,
  },
  correctAnswerSection: {
    alignItems: 'center',
    marginBottom: 25,
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
  },
  correctAnswerText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },
  explanationSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  explanationLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
  },
  optionsSection: {
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    width: 30,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  selfAssessmentFooter: {
    borderTopWidth: 2,
    paddingTop: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  assessmentPrompt: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  assessmentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  assessmentButton: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hardButton: {
    backgroundColor: '#ef4444',
  },
  goodButton: {
    backgroundColor: '#f59e0b',
  },
  easyButton: {
    backgroundColor: '#10b981',
  },
  assessmentEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  assessmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth * 0.85,
    borderRadius: 20,
    padding: 20,
    maxHeight: screenHeight * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  settingsOptions: {
    gap: 15,
  },
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 15,
  },
  // Enhanced hierarchical subject display styles
  hierarchicalSubjectDisplay: {
    flex: 1,
    marginRight: 10,
  },
  courseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 2,
    marginLeft: 8,
  },
  courseText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
    opacity: 0.8,
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 16,
  },
  topicText: {
    fontSize: 11,
    fontWeight: '400',
    marginLeft: 4,
    opacity: 0.6,
    fontStyle: 'italic',
  },
});
