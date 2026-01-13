import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import DragDropZone from './DragDropZone';
import FileUploadButton from './FileUploadButton';
import UploadPurposeToggle from './UploadPurposeToggle';
import SmartQuizCard from './SmartQuizCard';
import StudyModeToggle from './StudyModeToggle';
import AsyncQuizProgress from './AsyncQuizProgress';
import type { SmartDefaults } from '../../types/smartDefaults';
import type { QuizType, DifficultyLevel } from '../../types/upload.types';

interface UploadConfigurationFormProps {
  // File state
  files: any[];
  onFileSelected: (file: any) => void;
  onSelectFiles: () => void;

  // Purpose state
  uploadPurpose: 'study' | 'quiz';
  onPurposeChange: (purpose: 'study' | 'quiz') => void;

  // Smart quiz card (replaces wizard + course selection)
  smartDefaults: SmartDefaults | null;
  analyzingFile: boolean;
  customizationExpanded: boolean;
  selectedSubject: any | null;
  selectedCourse: any | null;
  selectedHierarchicalCourse: string | null;
  fileName: string | null;
  onEditFileName: () => void;

  // Quiz/Study config
  quizTypes: QuizType[];
  setQuizTypes: (types: QuizType[]) => void;
  difficulty: DifficultyLevel;
  setDifficulty: (difficulty: DifficultyLevel) => void;
  numQuestions: number;
  setNumQuestions: (num: number) => void;
  quizTypeModalVisible: boolean;
  setQuizTypeModalVisible: (visible: boolean) => void;
  difficultyModalVisible: boolean;
  setDifficultyModalVisible: (visible: boolean) => void;
  enableStudyMode: boolean;
  setEnableStudyMode: (enabled: boolean) => void;

  // Actions
  dispatch: any;
  handleUploadAndGenerateQuiz: () => Promise<void>;

  // UI
  isDisabled: boolean;
  isAsyncGenerating: boolean;
  themeColors: any;
  styles: any;
  t: (key: string, options?: any) => string;

  // Async Quiz Progress (for card swap animation)
  asyncProgress?: number;
  asyncStage?: string;
  asyncMessage?: string;
  onCancelAsync?: () => void;
  useAsyncMode?: boolean;
}

const UploadConfigurationForm: React.FC<UploadConfigurationFormProps> = ({
  files,
  onFileSelected,
  onSelectFiles,
  uploadPurpose,
  onPurposeChange,
  smartDefaults,
  analyzingFile,
  customizationExpanded,
  selectedSubject,
  selectedCourse,
  selectedHierarchicalCourse,
  fileName,
  onEditFileName,
  quizTypes,
  setQuizTypes,
  difficulty,
  setDifficulty,
  numQuestions,
  setNumQuestions,
  quizTypeModalVisible,
  setQuizTypeModalVisible,
  difficultyModalVisible,
  setDifficultyModalVisible,
  enableStudyMode,
  setEnableStudyMode,
  dispatch,
  handleUploadAndGenerateQuiz,
  isDisabled,
  isAsyncGenerating,
  themeColors,
  styles,
  t,
  asyncProgress = 0,
  asyncStage = '',
  asyncMessage = '',
  onCancelAsync = () => {},
  useAsyncMode = false,
}) => {
  // All helper functions have been moved to SmartQuizCard component

  return (
    <View style={localStyles.container}>
      {/* Phase 1: File Upload (Always visible) */}
      {files.length === 0 && (
        <View style={localStyles.uploadSection}>
          {/* Web: Show DragDropZone with browse fallback */}
          {Platform.OS === 'web' && (
            <DragDropZone
              onFileSelect={onFileSelected}
              error={null}
            />
          )}

          {/* Show divider only on web */}
          {Platform.OS === 'web' && (
            <Text style={localStyles.orText}>- OR -</Text>
          )}

          {/* Mobile & Web: Show FileUploadButton (native pickers on mobile, web fallback) */}
          <FileUploadButton
            files={files}
            onPress={onSelectFiles}
            isDisabled={isDisabled}
            t={t}
          />
        </View>
      )}

      {/* Phase 2: File Selected - Show Metadata Form */}
      {files.length > 0 && (
        <Animatable.View animation="fadeInUp" duration={600}>

          {/* Purpose Toggle */}
          <View style={localStyles.section}>
            <Text style={localStyles.sectionLabel}>
              <FontAwesome5 name="bullseye" size={14} color="#D4AF37" /> {t('upload.purpose')}
            </Text>
            <UploadPurposeToggle
              purpose={uploadPurpose}
              onPurposeChange={onPurposeChange}
              disabled={isDisabled}
            />
          </View>

          {/* QUIZ MODE: Smart Quiz Card */}
          {files.length > 0 && uploadPurpose === 'quiz' && !isAsyncGenerating && (
            <Animatable.View
              animation={isAsyncGenerating ? "slideOutLeft" : undefined}
              duration={400}
              useNativeDriver
            >
              <SmartQuizCard
              defaults={smartDefaults}
              analyzingFile={analyzingFile}
              quizTypes={quizTypes}
              difficulty={difficulty}
              numQuestions={numQuestions}
              customizationExpanded={customizationExpanded}
              selectedSubject={selectedSubject}
              selectedCourse={selectedCourse}
              selectedHierarchicalCourse={selectedHierarchicalCourse}
              fileName={fileName}
              onToggleCustomization={() => dispatch({
                type: 'SET_CUSTOMIZATION_EXPANDED',
                payload: !customizationExpanded
              })}
              onQuizTypesChange={setQuizTypes}
              onDifficultyChange={setDifficulty}
              onNumQuestionsChange={setNumQuestions}
              onQuickQuiz={handleUploadAndGenerateQuiz}
              onGenerateCustom={handleUploadAndGenerateQuiz}
              onEditSubject={() => dispatch({ type: 'OPEN_MODAL', payload: 'course' })}
              onEditFileName={onEditFileName}
              quizTypeModalVisible={quizTypeModalVisible}
              setQuizTypeModalVisible={setQuizTypeModalVisible}
              difficultyModalVisible={difficultyModalVisible}
              setDifficultyModalVisible={setDifficultyModalVisible}
              disabled={isDisabled || isAsyncGenerating}
              themeColors={themeColors}
            />
            </Animatable.View>
          )}

          {/* QUIZ MODE: Async Quiz Progress (slides in when generating) */}
          {files.length > 0 && uploadPurpose === 'quiz' && isAsyncGenerating && useAsyncMode && (
            <Animatable.View
              animation="slideInRight"
              duration={400}
              useNativeDriver
            >
              <AsyncQuizProgress
                isVisible={isAsyncGenerating}
                progress={asyncProgress}
                stage={asyncStage}
                message={asyncMessage}
                onCancel={onCancelAsync}
                themeColors={themeColors}
                styles={styles}
              />
            </Animatable.View>
          )}

          {/* STUDY MODE: Study Mode Toggle */}
          {uploadPurpose === 'study' && (
            <View style={localStyles.section}>
              <StudyModeToggle
                enableStudyMode={enableStudyMode}
                setEnableStudyMode={setEnableStudyMode}
                themeColors={themeColors}
                styles={styles}
              />
            </View>
          )}
        </Animatable.View>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  uploadSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
    paddingVertical: 40,
  },
  orText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '600',
    marginVertical: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#F8F4E3',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
});

export default UploadConfigurationForm;
