import { StyleSheet } from 'react-native';
import { colors, gradients, radius, spacing, shadow, typography } from '../theme/tokens';


export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  innerContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flatListContentContainer: {
    paddingHorizontal: spacing[24],
    paddingTop: 32, // Increased breathing room at top
    paddingBottom: 40, // More space at bottom for sticky button
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32, // Increased breathing room
  },

  // Form Container
  formContainer: {
    gap: 32, // Space between major sections - requires React Native 0.71+
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 60,
    left: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.cardStroke,
  },

  titleSection: {
    alignItems: 'center',
    marginBottom: spacing[24],
  },
  titleIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[16],
    ...shadow.card,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing[8],
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMute,
    textAlign: 'center',
  },

  label: {
    ...typography.label,
    marginBottom: spacing[8],
  },

  // Upload Button
  uploadButton: {
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardStroke,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[16],
    marginBottom: 8, // Breathing room below button
  },
  uploadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  uploadButtonTextActive: {
    color: colors.goldDeep,
    fontWeight: '600',
  },
  uploadHelper: {
    color: colors.textMute,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: spacing[20],
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardStroke,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[20],
    borderBottomWidth: 1,
    borderBottomColor: colors.cardStroke,
  },
  modalTitle: {
    ...typography.h2,
  },
  modalCloseButton: {
    padding: 5,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[16],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  selectedOption: {
    backgroundColor: 'rgba(212,175,55,0.1)',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },

  // Dropdown
  dropdownButton: {
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardStroke,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[16],
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  dropdownPlaceholder: {
    color: colors.textMute,
    fontStyle: 'italic',
  },

  // Primary CTA (Test Button)
  selectButton: {
    width: '100%',
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.glow,
  },
  selectButtonGradient: {
    paddingVertical: spacing[20],
    paddingHorizontal: spacing[24],
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1400', // Dark contrast text over gold
  },

  // File Item
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[20],
    marginVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.cardStroke,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  fileSize: {
    fontSize: 12,
    color: colors.textMute,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cardStroke,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardStroke,
    marginVertical: 8,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textMute,
    textAlign: 'center',
  },

  // Sticky Footer
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[20],
    paddingTop: spacing[16],
    paddingBottom: spacing[24],
    backgroundColor: 'rgba(26, 44, 91, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
});
