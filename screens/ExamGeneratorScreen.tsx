/**
 * ExamGeneratorScreen - Exam Creation Form
 *
 * Allows users to generate custom exams with AI
 *
 * Features:
 * - Topic input with validation
 * - Section type multi-select
 * - Difficulty picker
 * - Exam length picker
 * - Style/tone picker (optional)
 * - File upload (PDF/images)
 * - Real-time validation
 * - Loading states during generation
 * - Error handling with retry
 * - Navigation to generated exam
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeBackButton from '../components/SafeBackButton';
import { useGenerateExam } from '../hooks/useExamQueries';
import { validateExamRequest } from '../services/examService';
import {
  ExamSectionType,
  ExamDifficulty,
  ExamLength,
  ExamStyle,
  ExamFile,
  ExamGenerationFormState
} from '../types/exam';
import { colors, radius, spacing } from '../theme/tokens';
import logger from '../utils/logger';

// Math keywords for detecting math-related topics
const MATH_KEYWORDS = [
  'calculus',
  'algebra',
  'trigonometry',
  'precalculus',
  'geometry',
  'math',
  'mathematics',
  'physics',
  'statistics'
];

type ExamGeneratorScreenNavigationProp = NativeStackNavigationProp<any, 'ExamGenerator'>;

interface ExamGeneratorScreenProps {
  navigation: ExamGeneratorScreenNavigationProp;
}

/**
 * Exam Generator Screen Component
 *
 * Form for creating AI-generated exams
 */
export default function ExamGeneratorScreen({ navigation }: ExamGeneratorScreenProps) {
  // Form state
  const [topic, setTopic] = useState('');
  const [selectedSections, setSelectedSections] = useState<ExamSectionType[]>(['Multiple Choice']);
  const [difficulty, setDifficulty] = useState<ExamDifficulty>('Moderate');
  const [examLength, setExamLength] = useState<ExamLength>('Standard');
  const [style, setStyle] = useState<ExamStyle>('Professor');
  const [uploadedFile, setUploadedFile] = useState<ExamFile | undefined>(undefined);
  const [includeGraph, setIncludeGraph] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: generate, isPending } = useGenerateExam();

  // Available options
  const sectionTypes: ExamSectionType[] = ['True/False', 'Multiple Choice', 'Written'];
  const difficultyLevels: ExamDifficulty[] = ['Easy', 'Moderate', 'Hard'];
  const examLengths: ExamLength[] = ['Short', 'Standard', 'Full-Length'];
  const styleOptions: ExamStyle[] = ['Professor', 'Conversational', 'Formal', 'Socratic'];

  // Detect if topic is math-related
  const isMathTopic = useMemo(() => {
    const topicLower = topic.toLowerCase().trim();
    if (!topicLower) return false;

    return MATH_KEYWORDS.some(keyword => topicLower.includes(keyword));
  }, [topic]);

  // Handle section toggle
  const toggleSection = (section: ExamSectionType) => {
    setSelectedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
    setErrors(prev => ({ ...prev, sections: '' }));
  };

  // Handle file upload
  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        // Check file size (10MB limit)
        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a file smaller than 10MB.');
          return;
        }

        setUploadedFile({
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
          size: file.size,
        });

        logger.info('File uploaded:', { name: file.name, size: file.size });
      }
    } catch (error) {
      logger.error('Error picking file:', error);
      Alert.alert('Upload Error', 'Failed to upload file. Please try again.');
    }
  };

  // Remove uploaded file
  const removeFile = () => {
    setUploadedFile(undefined);
  };

  // Validate and generate exam
  const handleGenerate = () => {
    const request = {
      topic: topic.trim(),
      sections: selectedSections,
      difficulty,
      exam_length: examLength,
      style,
      generate_graph: includeGraph,
    };

    // Validate
    const validationErrors = validateExamRequest(request);
    if (validationErrors) {
      setErrors(validationErrors);
      Alert.alert('Validation Error', 'Please fix the errors and try again.');
      return;
    }

    setErrors({});

    // Generate exam
    generate(
      { request, file: uploadedFile },
      {
        onSuccess: (data) => {
          logger.info('Exam generated successfully:', { examId: data.exam_id });

          Alert.alert(
            'Exam Generated! 🎓',
            `Your exam on "${topic}" has been created successfully.`,
            [
              {
                text: 'View Exam',
                onPress: () => {
                  navigation.navigate('ExamViewer', {
                    examId: data.exam_id,
                    mode: 'take',
                  });
                },
              },
              {
                text: 'Generate Another',
                style: 'cancel',
                onPress: () => {
                  // Reset form
                  setTopic('');
                  setSelectedSections(['Multiple Choice']);
                  setDifficulty('Moderate');
                  setExamLength('Standard');
                  setStyle('Professor');
                  setUploadedFile(undefined);
                  setIncludeGraph(false);
                },
              },
            ]
          );
        },
        onError: (error) => {
          logger.error('Failed to generate exam:', error);
          Alert.alert(
            'Generation Failed',
            error.message || 'Failed to generate exam. Please try again.',
            [
              { text: 'OK' },
              {
                text: 'Retry',
                onPress: handleGenerate,
              },
            ]
          );
        },
      }
    );
  };

  return (
    <LinearGradient colors={['#0B1223', '#0F1F33']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SafeBackButton style={styles.backButton} color={colors.text} size={20} />
        <Text style={styles.headerTitle}>Generate Exam</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Form */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Topic Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exam Topic *</Text>
            <TextInput
              style={[styles.input, errors.topic && styles.inputError]}
              value={topic}
              onChangeText={(text) => {
                setTopic(text);
                setErrors(prev => ({ ...prev, topic: '' }));
              }}
              placeholder="e.g., Biology Chapter 5: Cell Division"
              placeholderTextColor={colors.textMute}
              maxLength={200}
            />
            {errors.topic && <Text style={styles.errorText}>{errors.topic}</Text>}
            <Text style={styles.helpText}>
              {topic.length}/200 characters
            </Text>
          </View>

          {/* Section Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Question Types *</Text>
            <Text style={[styles.helpText, { marginBottom: spacing[12] }]}>
              Select one or more question types for your exam
            </Text>
            {sectionTypes.map((section) => (
              <TouchableOpacity
                key={section}
                style={[
                  styles.checkboxRow,
                  selectedSections.includes(section) && styles.checkboxRowSelected,
                ]}
                onPress={() => toggleSection(section)}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedSections.includes(section) && styles.checkboxChecked,
                  ]}
                >
                  {selectedSections.includes(section) && (
                    <FontAwesome5 name="check" size={12} color={colors.bg} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{section}</Text>
              </TouchableOpacity>
            ))}
            {errors.sections && <Text style={styles.errorText}>{errors.sections}</Text>}
          </View>

          {/* Difficulty */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Difficulty Level</Text>
            <View style={styles.optionsGrid}>
              {difficultyLevels.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.optionChip,
                    difficulty === level && styles.optionChipSelected,
                  ]}
                  onPress={() => setDifficulty(level)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      difficulty === level && styles.optionChipTextSelected,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Exam Length */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exam Length</Text>
            <View style={styles.optionsGrid}>
              {examLengths.map((length) => (
                <TouchableOpacity
                  key={length}
                  style={[
                    styles.optionChip,
                    examLength === length && styles.optionChipSelected,
                  ]}
                  onPress={() => setExamLength(length)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      examLength === length && styles.optionChipTextSelected,
                    ]}
                  >
                    {length}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.helpText}>
              {examLength === 'Short' && '10-15 questions'}
              {examLength === 'Standard' && '20-30 questions'}
              {examLength === 'Full-Length' && '40-50 questions'}
            </Text>
          </View>

          {/* Graph Visualization (Math topics + Full-Length only) */}
          {isMathTopic && examLength === 'Full-Length' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Graph Visualization (Optional)</Text>
              <Text style={[styles.helpText, { marginBottom: spacing[12] }]}>
                Add a visual graph to Section 3 for enhanced understanding
              </Text>
              <TouchableOpacity
                style={[
                  styles.checkboxRow,
                  includeGraph && styles.checkboxRowSelected,
                ]}
                onPress={() => setIncludeGraph(!includeGraph)}
              >
                <View
                  style={[
                    styles.checkbox,
                    includeGraph && styles.checkboxChecked,
                  ]}
                >
                  {includeGraph && (
                    <FontAwesome5 name="check" size={12} color={colors.bg} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  Include graph in Section 3
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Style (Optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Teaching Style (Optional)</Text>
            <View style={styles.optionsGrid}>
              {styleOptions.map((styleOption) => (
                <TouchableOpacity
                  key={styleOption}
                  style={[
                    styles.optionChip,
                    style === styleOption && styles.optionChipSelected,
                  ]}
                  onPress={() => setStyle(styleOption)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      style === styleOption && styles.optionChipTextSelected,
                    ]}
                  >
                    {styleOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* File Upload */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Study Material (Optional)</Text>
            <Text style={[styles.helpText, { marginBottom: spacing[12] }]}>
              Upload PDF notes or images to generate questions from your material
            </Text>
            {!uploadedFile ? (
              <TouchableOpacity style={styles.uploadButton} onPress={handleFileUpload}>
                <FontAwesome5 name="upload" size={16} color={colors.gold} />
                <Text style={styles.uploadButtonText}>Upload PDF or Image</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.fileCard}>
                <View style={styles.fileInfo}>
                  <FontAwesome5
                    name={uploadedFile.type.includes('pdf') ? 'file-pdf' : 'file-image'}
                    size={20}
                    color={colors.gold}
                  />
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {uploadedFile.name}
                    </Text>
                    {uploadedFile.size && (
                      <Text style={styles.fileSize}>
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={removeFile}>
                  <FontAwesome5 name="times-circle" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            style={[styles.generateButton, isPending && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={isPending}
          >
            <LinearGradient
              colors={isPending ? [colors.bg2, colors.bg2] : [colors.gold, '#D4AF37']}
              style={styles.generateButtonGradient}
            >
              {isPending ? (
                <>
                  <ActivityIndicator size="small" color={colors.text} />
                  <Text style={styles.generateButtonText}>Generating...</Text>
                </>
              ) : (
                <>
                  <FontAwesome5 name="magic" size={16} color={colors.bg} />
                  <Text style={styles.generateButtonText}>Generate Exam</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <FontAwesome5 name="info-circle" size={14} color={colors.blue} />
            <Text style={styles.infoText}>
              Generation typically takes 30-60 seconds. Your exam will be saved to history for later review.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[16],
    paddingTop: 50,
    paddingBottom: spacing[16],
  },
  backButton: {
    padding: spacing[8],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[20],
    paddingBottom: spacing[32],
  },
  section: {
    marginBottom: spacing[24],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing[12],
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    fontSize: 15,
    color: colors.text,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    marginTop: spacing[4],
  },
  helpText: {
    fontSize: 13,
    color: colors.textMute,
    marginTop: spacing[4],
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
    marginBottom: spacing[8],
  },
  checkboxRowSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.bg2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    backgroundColor: colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[12],
  },
  checkboxChecked: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  checkboxLabel: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
  },
  optionChip: {
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[16],
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
  },
  optionChipSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  optionChipTextSelected: {
    color: colors.bg,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
    paddingVertical: spacing[16],
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: radius.md,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gold,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[16],
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardStroke,
    borderRadius: radius.md,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    flex: 1,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: colors.textMute,
  },
  generateButton: {
    marginTop: spacing[8],
    marginBottom: spacing[16],
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[12],
    paddingVertical: spacing[16],
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.bg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[12],
    padding: spacing[16],
    backgroundColor: 'rgba(107, 169, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(107, 169, 255, 0.3)',
    borderRadius: radius.md,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textDim,
  },
});
