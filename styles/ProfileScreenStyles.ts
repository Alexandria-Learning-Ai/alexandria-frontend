/**
 * ProfileScreen Styles
 * Extracted styles for user profile and onboarding screens
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: { flex: 1 },
    keyboardAvoidingView: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 30,
        marginTop: 40,
        paddingHorizontal: 10,
    },
    backButton: {
        padding: 15,
        margin: 5,
        borderRadius: 8,
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#F8F4E3',
    },
    placeholder: { width: 36 },

    // Progress bar styles
    progressContainer: {
        marginBottom: 30,
    },
    progressText: {
        color: '#CBD5E0',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(248, 244, 227, 0.2)',
        borderRadius: 2,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#D4AF37',
        borderRadius: 2,
    },

    // Scroll container styles
    scrollContainer: { flex: 1 },
    scrollContent: { flexGrow: 1 },

    // Step styles
    stepContainer: { flex: 1, minHeight: 400 },
    stepHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    stepTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#F8F4E3',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    stepSubtitle: {
        fontSize: 16,
        color: '#CBD5E0',
        textAlign: 'center',
        lineHeight: 22,
    },

    // Input styles
    inputContainer: { marginBottom: 20 },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F8F4E3',
        marginBottom: 8,
    },
    helperText: {
        fontSize: 12,
        color: '#CBD5E0',
        marginTop: 4,
        fontStyle: 'italic',
    },
    input: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#F8F4E3',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    disabledInput: {
        opacity: 0.6,
        backgroundColor: 'rgba(248, 244, 227, 0.05)',
    },
    helpText: {
        fontSize: 12,
        color: '#CBD5E0',
        marginTop: 5,
    },

    // Options styles
    optionsContainer: { gap: 12 },
    optionCard: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    optionCardSelected: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderColor: '#D4AF37',
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F8F4E3',
        marginTop: 8,
        marginBottom: 4,
    },
    optionLabelSelected: {
        color: '#D4AF37',
    },
    optionDescription: {
        fontSize: 12,
        color: '#CBD5E0',
        textAlign: 'center',
    },

    // Course input styles
    courseInputContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    courseInput: {
        flex: 1,
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#F8F4E3',
    },
    addCourseButton: {
        backgroundColor: '#D4AF37',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addCourseButtonDisabled: {
        backgroundColor: '#666',
        opacity: 0.6,
    },
    courseInputError: {
        borderColor: '#ff6b7a',
        borderWidth: 2,
    },
    courseInputSuccess: {
        borderColor: '#4CAF50',
        borderWidth: 2,
    },
    coursesContainer: {
        maxHeight: 200,
    },
    courseChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 8,
        gap: 8,
    },
    courseChipText: {
        flex: 1,
        color: '#F8F4E3',
        fontSize: 14,
        fontWeight: '500',
    },

    // Course validation styles
    validationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 107, 122, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 12,
        gap: 8,
    },
    validationText: {
        color: '#ff6b7a',
        fontSize: 12,
        flex: 1,
    },

    // Course suggestions styles
    suggestionsContainer: {
        marginBottom: 16,
    },
    suggestionsTitle: {
        color: '#CBD5E0',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    suggestionChip: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    suggestionText: {
        color: '#D4AF37',
        fontSize: 12,
        fontWeight: '500',
    },

    // Preferences styles
    preferencesSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#F8F4E3',
        marginBottom: 12,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
    },
    chipSelected: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
    },
    chipText: {
        fontSize: 12,
        color: '#CBD5E0',
        fontWeight: '500',
    },
    chipTextSelected: {
        color: '#FFFFFF',
        fontWeight: '600',
    },

    // Navigation styles
    navigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
    },
    backNavButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    backButtonText: {
        color: '#CBD5E0',
        fontSize: 16,
        fontWeight: '500',
    },
    nextButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    nextButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        gap: 8,
    },
    nextButtonText: {
        color: '#1A2C5B',
        fontSize: 16,
        fontWeight: '700',
    },

    // Option chip styles
    optionChip: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 8,
        minWidth: 120,
        alignItems: 'center',
    },
    optionChipSelected: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
    },
    optionChipText: {
        color: '#F8F4E3',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    optionChipTextSelected: {
        color: '#1A2C5B',
        fontWeight: '700',
    },

    // Semester row styles
    semesterRow: {
        marginTop: 8,
    },
    semesterColumn: {
        marginBottom: 16,
    },
    subLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#CBD5E0',
        marginBottom: 8,
    },
    seasonContainer: { marginBottom: 12 },
    seasonChip: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
    },
    seasonChipSelected: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
    },
    seasonChipText: {
        color: '#F8F4E3',
        fontSize: 14,
        fontWeight: '500',
    },
    seasonChipTextSelected: {
        color: '#1A2C5B',
        fontWeight: '700',
    },
    yearContainer: {},
    yearChip: {
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        minWidth: 60,
        alignItems: 'center',
    },
    yearChipSelected: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
    },
    yearChipText: {
        color: '#F8F4E3',
        fontSize: 14,
        fontWeight: '500',
    },
    yearChipTextSelected: {
        color: '#1A2C5B',
        fontWeight: '700',
    },

    // Semester preview styles
    semesterPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 12,
        gap: 8,
    },
    semesterPreviewText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '600',
    },

    // Program suggestions styles
    programSuggestionsContainer: {
        marginTop: 12,
    },
    programSuggestions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    programSuggestionChip: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    programSuggestionText: {
        color: '#D4AF37',
        fontSize: 12,
        fontWeight: '500',
    },

    // Enhanced editing styles
    sectionContainer: {
        backgroundColor: 'rgba(248, 244, 227, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    optionsScroll: {
        flexGrow: 0,
    },
    multiSelectContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    multiSelectOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(248, 244, 227, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(248, 244, 227, 0.3)',
    },
    selectedMultiSelectOption: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
    },
    multiSelectLabel: {
        color: '#F8F4E3',
        fontSize: 14,
        marginLeft: 8,
    },
    selectedMultiSelectLabel: {
        color: '#1A2C5B',
        fontWeight: '600',
    },

    // Legacy styles for existing users
    saveButton: { marginTop: 30 },
    disabledButton: { opacity: 0.6 },
    saveButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 12,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A2C5B',
        marginLeft: 8,
    },
    disabledButtonText: { color: '#888' },
});
