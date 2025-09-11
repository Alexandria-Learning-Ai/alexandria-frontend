// =============================
// 📄 screens/PhD/DocumentUploadScreen.js
// =============================

/**
 * Academic Document Upload Screen
 * Upload PDFs, papers, datasets for PhD-level question generation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DocumentPicker from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SafeBackButton from '../../components/SafeBackButton';
import NavigationHelper from '../../utils/NavigationHelper';
import { Picker } from '@react-native-picker/picker';

import { PhDService } from '../../services/PhDService';
import { SubscriptionService } from '../../services/SubscriptionService';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomButton from '../../components/CustomButton';
import logger from '../utils/logger';


const { width } = Dimensions.get('window');

const DocumentUploadScreen = ({ navigation, route }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('paper');
  const [researchField, setResearchField] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [subscriptionTier, setSubscriptionTier] = useState('explorer');

  const documentTypes = [
    { value: 'paper', label: 'Research Paper', icon: 'article' },
    { value: 'thesis', label: 'Thesis/Dissertation', icon: 'school' },
    { value: 'dataset', label: 'Dataset/Data Analysis', icon: 'bar-chart' },
    { value: 'preprint', label: 'Preprint/Manuscript', icon: 'draft' },
    { value: 'proposal', label: 'Research Proposal', icon: 'description' }
  ];

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.plainText,
          DocumentPicker.types.json
        ],
        allowMultiSelection: false,
      });

      const file = result[0];
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a file smaller than 10MB');
        return;
      }

      setSelectedFile(file);
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled
        return;
      }
      logger.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to select document');
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile || !researchField) {
      Alert.alert('Missing Information', 'Please select a file and research field');
      return;
    }

    try {
      setUploading(true);
      
      const result = await PhDService.uploadDocument(
        selectedFile,
        documentType,
        researchField
      );
      
      setUploadedDocument(result);
      setSelectedFile(null);
      
      Alert.alert(
        'Upload Successful',
        `Document processed successfully!\n\nExtracted ${result.concepts_extracted} concepts\nGenerated ${result.potential_questions} question seeds`,
        [
          { text: 'OK', onPress: () => setProcessing(false) }
        ]
      );
      
    } catch (error) {
      logger.error('Upload error:', error);
      
      const errorInfo = PhDService.handleSubscriptionError(error);
      if (errorInfo.requiresUpgrade) {
        Alert.alert(
          'Premium Feature Required',
          errorInfo.message,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') }
          ]
        );
      } else {
        Alert.alert('Upload Failed', errorInfo.message);
      }
    } finally {
      setUploading(false);
    }
  };

  const generateQuestions = async () => {
    if (!uploadedDocument) return;

    try {
      setProcessing(true);
      
      // Get current subscription tier
      const currentTier = await SubscriptionService.getCurrentTier();
      setSubscriptionTier(currentTier);
      
      // Determine question count based on subscription tier
      let questionCount;
      let questionTypes = ['scenario_based', 'paper_critique', 'methodology_evaluation'];
      
      switch (currentTier) {
        case 'mastermind':
          questionCount = 50;
          // MASTERMIND gets all question types
          questionTypes = [
            'scenario_based', 
            'paper_critique', 
            'methodology_evaluation',
            'multi_step_reasoning',
            'data_interpretation',
            'synthesis_analysis',
            'hypothesis_testing'
          ];
          break;
        case 'scholar':
          questionCount = 20;
          questionTypes = ['scenario_based', 'paper_critique', 'methodology_evaluation', 'multi_step_reasoning'];
          break;
        case 'explorer':
        default:
          questionCount = 10;
          questionTypes = ['scenario_based', 'paper_critique'];
          break;
      }
      
      const result = await PhDService.generateQuestionsFromDocument(
        uploadedDocument.document_id,
        questionCount,
        questionTypes
      );
      
      setGeneratedQuestions(result.questions);
      
      // Show tier-specific success message
      const tierMessages = {
        'mastermind': `Generated ${questionCount} advanced PhD-level questions with comprehensive question types!`,
        'scholar': `Generated ${questionCount} enhanced questions with multiple analysis types!`,
        'explorer': `Generated ${questionCount} foundational questions. Upgrade for more questions and advanced types!`
      };
      
      Alert.alert(
        'Questions Generated!',
        tierMessages[currentTier] || tierMessages['explorer']
      );
      
    } catch (error) {
      logger.error('Question generation error:', error);
      
      const errorInfo = PhDService.handleSubscriptionError(error);
      if (errorInfo.requiresUpgrade) {
        Alert.alert(
          'Upgrade Required',
          errorInfo.message,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to generate questions from document');
      }
    } finally {
      setProcessing(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeInfo = (type) => {
    return documentTypes.find(dt => dt.value === type) || documentTypes[0];
  };

  if (uploading || processing) {
    return (
      <LoadingSpinner 
        message={uploading ? "Uploading and processing document..." : "Generating questions..."}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => NavigationHelper.safeGoBack(navigation, 'PhD')}
          >
            <Icon name="arrow-back" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <Text style={styles.title}>Document Upload</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Academic Document</Text>
          <Text style={styles.sectionDescription}>
            Upload PDFs, research papers, datasets, or manuscripts to generate PhD-level questions
          </Text>

          {/* File Selection */}
          <TouchableOpacity 
            style={[styles.uploadArea, selectedFile && styles.uploadAreaSelected]}
            onPress={pickDocument}
          >
            {selectedFile ? (
              <View style={styles.selectedFileContainer}>
                <Icon name="insert-drive-file" size={48} color="#4A90E2" />
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileInfo}>
                  {formatFileSize(selectedFile.size)} • {selectedFile.type?.split('/')[1]?.toUpperCase() || 'Unknown'}
                </Text>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => setSelectedFile(null)}
                >
                  <Icon name="close" size={20} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadPrompt}>
                <Icon name="cloud-upload" size={48} color="#BDC3C7" />
                <Text style={styles.uploadText}>Tap to select document</Text>
                <Text style={styles.uploadSubtext}>PDF, TXT, JSON • Max 10MB</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Document Type Selection */}
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Document Type</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={documentType}
                onValueChange={setDocumentType}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {documentTypes.map((type) => (
                  <Picker.Item 
                    key={type.value} 
                    label={type.label} 
                    value={type.value} 
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Research Field Selection */}
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Research Field</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={researchField}
                onValueChange={setResearchField}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Select research field..." value="" />
                {PhDService.getResearchFields().map((field) => (
                  <Picker.Item key={field} label={field} value={field} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Upload Button */}
          <CustomButton
            title="Upload & Process Document"
            onPress={uploadDocument}
            disabled={!selectedFile || !researchField}
            style={styles.uploadButton}
            icon="upload"
          />
        </View>

        {/* Processing Results */}
        {uploadedDocument && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Processing Results</Text>
            
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Icon name="check-circle" size={24} color="#27AE60" />
                <Text style={styles.resultTitle}>Document Processed Successfully</Text>
              </View>
              
              <View style={styles.resultStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{uploadedDocument.concepts_extracted}</Text>
                  <Text style={styles.statLabel}>Concepts Extracted</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{uploadedDocument.potential_questions}</Text>
                  <Text style={styles.statLabel}>Question Seeds</Text>
                </View>
              </View>

              {uploadedDocument.summary && (
                <View style={styles.summaryContainer}>
                  <Text style={styles.summaryTitle}>Document Summary</Text>
                  <Text style={styles.summaryText}>{uploadedDocument.summary}</Text>
                </View>
              )}

              {/* Tier Info */}
              <View style={styles.tierInfoContainer}>
                <View style={[styles.tierBadge, { 
                  backgroundColor: subscriptionTier === 'mastermind' ? '#FFD700' : 
                                  subscriptionTier === 'scholar' ? '#E8F5E8' : '#F0F8FF' 
                }]}>
                  <Text style={[styles.tierText, {
                    color: subscriptionTier === 'mastermind' ? '#8B4513' :
                           subscriptionTier === 'scholar' ? '#2E7D32' : '#1976D2'
                  }]}>
                    {subscriptionTier.toUpperCase()} TIER
                  </Text>
                </View>
                <Text style={styles.questionLimitText}>
                  {subscriptionTier === 'mastermind' ? '50 questions with 7 question types' :
                   subscriptionTier === 'scholar' ? '20 questions with 4 question types' :
                   '10 questions with 2 question types'}
                </Text>
              </View>

              <CustomButton
                title="Generate Questions"
                onPress={generateQuestions}
                style={styles.generateButton}
                icon="quiz"
              />
            </View>
          </View>
        )}

        {/* Generated Questions */}
        {generatedQuestions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.questionHeaderContainer}>
              <Text style={styles.sectionTitle}>Generated Questions</Text>
              {subscriptionTier !== 'mastermind' && (
                <TouchableOpacity 
                  style={styles.upgradePrompt}
                  onPress={() => navigation.navigate('Subscription')}
                >
                  <Icon name="upgrade" size={16} color="#4A90E2" />
                  <Text style={styles.upgradeText}>
                    Upgrade for {subscriptionTier === 'scholar' ? '50' : subscriptionTier === 'explorer' ? '20-50' : 'more'} questions
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {generatedQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.questionCard}
                onPress={() => navigation.navigate('PhDQuestionView', { 
                  question,
                  source: 'document',
                  documentId: uploadedDocument.document_id
                })}
              >
                <View style={styles.questionHeader}>
                  <Text style={styles.questionType}>{question.type?.replace('_', ' ').toUpperCase()}</Text>
                  <View style={styles.difficultyBadge}>
                    <Text style={styles.difficultyText}>Level {question.difficulty || 8}</Text>
                  </View>
                </View>
                <Text style={styles.questionTitle}>{question.title}</Text>
                <Text style={styles.questionDescription} numberOfLines={2}>
                  {question.description}
                </Text>
                <View style={styles.questionFooter}>
                  <Text style={styles.estimatedTime}>~{question.estimated_time || 25} min</Text>
                  <Icon name="arrow-forward" size={16} color="#4A90E2" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Upload Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips for Better Results</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tipItem}>
              <Icon name="lightbulb-outline" size={20} color="#F39C12" />
              <Text style={styles.tipText}>
                Upload papers with clear abstracts and methodology sections for optimal question generation
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="security" size={20} color="#27AE60" />
              <Text style={styles.tipText}>
                Your documents are processed securely and not stored permanently on our servers
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="speed" size={20} color="#9B59B6" />
              <Text style={styles.tipText}>
                Processing time depends on document length - typically 30 seconds to 2 minutes
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  placeholder: {
    width: 34, // Same as back button to center title
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 20,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  uploadAreaSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#F8FBFF',
  },
  uploadPrompt: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginTop: 10,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 5,
  },
  selectedFileContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginTop: 10,
    textAlign: 'center',
  },
  fileInfo: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 10,
  },
  pickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  picker: {
    height: 50,
  },
  pickerItem: {
    fontSize: 16,
  },
  uploadButton: {
    marginTop: 10,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
    marginLeft: 10,
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
  },
  summaryContainer: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  generateButton: {
    marginTop: 15,
  },
  tierInfoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 6,
  },
  tierText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  questionLimitText: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
  },
  questionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  upgradePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  upgradeText: {
    fontSize: 11,
    color: '#4A90E2',
    fontWeight: '500',
    marginLeft: 4,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  difficultyBadge: {
    backgroundColor: '#FFE5CC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D35400',
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 6,
  },
  questionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 10,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimatedTime: {
    fontSize: 12,
    color: '#999999',
  },
  tipsContainer: {
    marginTop: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
    marginLeft: 10,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default DocumentUploadScreen;