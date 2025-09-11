// =============================
// 📄 screens/PhD/EssayEvaluatorScreen.js
// =============================

/**
 * Essay Evaluation Screen with AI Feedback
 * Submit essays and receive comprehensive PhD-level feedback
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Dimensions,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SafeBackButton from '../../components/SafeBackButton';
import NavigationHelper from '../../utils/NavigationHelper';
import { LineChart } from 'react-native-chart-kit';

import { PhDService } from '../../services/PhDService';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomButton from '../../components/CustomButton';
import logger from '../utils/logger';


const { width } = Dimensions.get('window');

const EssayEvaluatorScreen = ({ navigation, route }) => {
  const { questionId, questionData } = route.params || {};
  
  const [essayText, setEssayText] = useState('');
  const [citations, setCitations] = useState(['']);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [activeTab, setActiveTab] = useState('scores');
  
  const scrollViewRef = useRef(null);
  
  const addCitation = () => {
    setCitations([...citations, '']);
  };
  
  const updateCitation = (index, value) => {
    const newCitations = [...citations];
    newCitations[index] = value;
    setCitations(newCitations);
  };
  
  const removeCitation = (index) => {
    if (citations.length > 1) {
      const newCitations = citations.filter((_, i) => i !== index);
      setCitations(newCitations);
    }
  };
  
  const submitEssay = async () => {
    if (!essayText.trim()) {
      Alert.alert('Missing Essay', 'Please write your essay response before submitting');
      return;
    }
    
    const wordCount = essayText.trim().split(/\s+/).length;
    if (wordCount < 50) {
      Alert.alert('Essay Too Short', 'Please write at least 50 words for meaningful evaluation');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const essayData = {
        question_id: questionId,
        response_text: essayText,
        citations: citations.filter(citation => citation.trim()),
        word_count: wordCount,
        submission_context: 'direct_submission'
      };
      
      const result = await PhDService.submitEssayResponse(essayData);
      setFeedback(result.feedback);
      setShowFeedbackModal(true);
      
    } catch (error) {
      logger.error('Essay submission error:', error);
      
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
        Alert.alert('Submission Failed', errorInfo.message);
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderScoreCircle = (score, maxScore, label, color) => {
    const percentage = (score / maxScore) * 100;
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
      <View style={styles.scoreCircle}>
        <View style={styles.circleContainer}>
          <View style={[styles.circle, { borderColor: color }]}>
            <Text style={[styles.scoreText, { color }]}>{score.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.scoreLabel}>{label}</Text>
      </View>
    );
  };
  
  const renderFeedbackContent = () => {
    if (!feedback) return null;
    
    switch (activeTab) {
      case 'scores':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.overallScore}>
              Overall Score: {feedback.overall_score?.toFixed(1) || 0}/100
            </Text>
            
            <View style={styles.scoresGrid}>
              {feedback.clarity_score && renderScoreCircle(feedback.clarity_score, 10, 'Clarity', '#3498DB')}
              {feedback.depth_score && renderScoreCircle(feedback.depth_score, 10, 'Depth', '#9B59B6')}
              {feedback.originality_score && renderScoreCircle(feedback.originality_score, 10, 'Originality', '#E67E22')}
              {feedback.evidence_score && renderScoreCircle(feedback.evidence_score, 10, 'Evidence', '#27AE60')}
            </View>
            
            {feedback.methodology_score && (
              <View style={styles.methodologyContainer}>
                <Text style={styles.methodologyLabel}>Methodology Understanding</Text>
                {renderScoreCircle(feedback.methodology_score, 10, 'Methodology', '#E74C3C')}
              </View>
            )}
          </View>
        );
        
      case 'strengths':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.feedbackSectionTitle}>Key Strengths Identified</Text>
            {feedback.strengths?.map((strength, index) => (
              <View key={index} style={styles.feedbackItem}>
                <Icon name="check-circle" size={20} color="#27AE60" />
                <Text style={styles.feedbackText}>{strength}</Text>
              </View>
            ))}
          </View>
        );
        
      case 'improvements':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.feedbackSectionTitle}>Areas for Improvement</Text>
            {feedback.areas_for_improvement?.map((area, index) => (
              <View key={index} style={styles.feedbackItem}>
                <Icon name="arrow-upward" size={20} color="#F39C12" />
                <Text style={styles.feedbackText}>{area}</Text>
              </View>
            ))}
            
            <Text style={styles.feedbackSectionTitle}>Specific Suggestions</Text>
            {feedback.specific_suggestions?.map((suggestion, index) => (
              <View key={index} style={styles.feedbackItem}>
                <Icon name="lightbulb-outline" size={20} color="#9B59B6" />
                <Text style={styles.feedbackText}>{suggestion}</Text>
              </View>
            ))}
          </View>
        );
        
      case 'biases':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.feedbackSectionTitle}>Cognitive Bias Analysis</Text>
            {feedback.bias_detection?.length > 0 ? (
              feedback.bias_detection.map((bias, index) => (
                <View key={index} style={styles.biasItem}>
                  <View style={styles.biasHeader}>
                    <Icon name="psychology" size={20} color="#E74C3C" />
                    <Text style={styles.biasTitle}>{bias.split(':')[0]}</Text>
                  </View>
                  <Text style={styles.biasDescription}>{bias.split(':')[1] || bias}</Text>
                </View>
              ))
            ) : (
              <View style={styles.noBiasContainer}>
                <Icon name="verified" size={40} color="#27AE60" />
                <Text style={styles.noBiasText}>
                  No significant cognitive biases detected in your response. Great critical thinking!
                </Text>
              </View>
            )}
            
            {feedback.cognitive_gaps?.length > 0 && (
              <>
                <Text style={styles.feedbackSectionTitle}>Knowledge Gaps</Text>
                {feedback.cognitive_gaps.map((gap, index) => (
                  <View key={index} style={styles.feedbackItem}>
                    <Icon name="school" size={20} color="#3498DB" />
                    <Text style={styles.feedbackText}>{gap}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        );
        
      case 'followup':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.feedbackSectionTitle}>Follow-up Questions</Text>
            <Text style={styles.followupDescription}>
              These questions will help deepen your understanding and critical thinking:
            </Text>
            {feedback.follow_up_questions?.map((question, index) => (
              <View key={index} style={styles.questionItem}>
                <View style={styles.questionNumber}>
                  <Text style={styles.questionNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.questionText}>{question}</Text>
              </View>
            ))}
            
            {feedback.research_recommendations?.length > 0 && (
              <>
                <Text style={styles.feedbackSectionTitle}>Research Recommendations</Text>
                {feedback.research_recommendations.map((rec, index) => (
                  <View key={index} style={styles.feedbackItem}>
                    <Icon name="library-books" size={20} color="#8E44AD" />
                    <Text style={styles.feedbackText}>{rec}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        );
        
      default:
        return null;
    }
  };
  
  if (submitting) {
    return <LoadingSpinner message="Analyzing your essay with advanced AI..." />;
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => NavigationHelper.safeGoBack(navigation, 'PhD')}
          >
            <Icon name="arrow-back" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <Text style={styles.title}>Essay Evaluator</Text>
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => Alert.alert(
              'Essay Evaluation Tips',
              '• Write at least 200 words for comprehensive feedback\n' +
              '• Include citations to demonstrate research depth\n' +
              '• Address the question directly with clear arguments\n' +
              '• Show critical thinking and analysis'
            )}
          >
            <Icon name="help-outline" size={24} color="#4A90E2" />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Question Display */}
          {questionData && (
            <View style={styles.questionContainer}>
              <Text style={styles.questionLabel}>Question</Text>
              <Text style={styles.questionText}>{questionData.question || questionData.title}</Text>
            </View>
          )}
          
          {/* Essay Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Response</Text>
            <TextInput
              style={styles.essayInput}
              placeholder="Write your comprehensive essay response here...

Consider:
• Clear thesis and supporting arguments
• Evidence from credible sources
• Critical analysis and evaluation
• Original insights and perspectives
• Logical organization and flow"
              placeholderTextColor="#999999"
              value={essayText}
              onChangeText={setEssayText}
              multiline
              textAlignVertical="top"
              autoCapitalize="sentences"
              autoCorrect={true}
              spellCheck={true}
            />
            
            <View style={styles.wordCountContainer}>
              <Text style={styles.wordCount}>
                {essayText.trim() ? essayText.trim().split(/\s+/).length : 0} words
              </Text>
              <Text style={styles.wordCountHint}>Minimum 50 words, 200+ recommended</Text>
            </View>
          </View>
          
          {/* Citations */}
          <View style={styles.section}>
            <View style={styles.citationHeader}>
              <Text style={styles.sectionTitle}>Citations (Optional)</Text>
              <TouchableOpacity style={styles.addButton} onPress={addCitation}>
                <Icon name="add" size={20} color="#4A90E2" />
                <Text style={styles.addButtonText}>Add Citation</Text>
              </TouchableOpacity>
            </View>
            
            {citations.map((citation, index) => (
              <View key={index} style={styles.citationRow}>
                <TextInput
                  style={styles.citationInput}
                  placeholder="Enter citation (APA, MLA, etc.)"
                  value={citation}
                  onChangeText={(value) => updateCitation(index, value)}
                />
                {citations.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeCitation(index)}
                  >
                    <Icon name="close" size={20} color="#E74C3C" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
          
          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <CustomButton
              title="Submit for AI Evaluation"
              onPress={submitEssay}
              disabled={!essayText.trim()}
              icon="send"
              style={styles.submitButton}
            />
          </View>
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Feedback & Analysis</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFeedbackModal(false)}
            >
              <Icon name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>
          
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { key: 'scores', label: 'Scores', icon: 'assessment' },
                { key: 'strengths', label: 'Strengths', icon: 'thumb-up' },
                { key: 'improvements', label: 'Improve', icon: 'trending-up' },
                { key: 'biases', label: 'Biases', icon: 'psychology' },
                { key: 'followup', label: 'Next Steps', icon: 'arrow-forward' }
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Icon 
                    name={tab.icon} 
                    size={20} 
                    color={activeTab === tab.key ? '#4A90E2' : '#999999'} 
                  />
                  <Text style={[
                    styles.tabText,
                    activeTab === tab.key && styles.activeTabText
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Tab Content */}
          <ScrollView style={styles.modalContent}>
            {renderFeedbackContent()}
          </ScrollView>
          
          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setShowFeedbackModal(false);
                navigation.navigate('PhDAnalytics');
              }}
            >
              <Icon name="analytics" size={20} color="#4A90E2" />
              <Text style={styles.actionButtonText}>View Full Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryActionButton]}
              onPress={() => {
                setShowFeedbackModal(false);
                setEssayText('');
                setCitations(['']);
              }}
            >
              <Icon name="refresh" size={20} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
                Write Another Essay
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
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
  helpButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  scrollView: {
    flex: 1,
  },
  questionContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginBottom: 10,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A90E2',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    color: '#2C3E50',
    lineHeight: 22,
  },
  section: {
    margin: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  essayInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    fontSize: 16,
    color: '#2C3E50',
    lineHeight: 24,
    minHeight: 300,
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
  wordCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  wordCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A90E2',
  },
  wordCountHint: {
    fontSize: 12,
    color: '#999999',
  },
  citationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    color: '#4A90E2',
    marginLeft: 5,
  },
  citationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  citationInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  removeButton: {
    marginLeft: 10,
    padding: 5,
  },
  submitContainer: {
    margin: 20,
    marginTop: 10,
  },
  submitButton: {
    paddingVertical: 16,
  },
  bottomSpacing: {
    height: 20,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  closeButton: {
    padding: 5,
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4A90E2',
  },
  tabText: {
    fontSize: 14,
    color: '#999999',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#4A90E2',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  overallScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 20,
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  scoreCircle: {
    alignItems: 'center',
    marginBottom: 15,
    width: '45%',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  methodologyContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  methodologyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 10,
  },
  feedbackSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
    marginTop: 10,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  feedbackText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
    marginLeft: 10,
  },
  biasItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#E74C3C',
  },
  biasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  biasTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginLeft: 8,
    textTransform: 'capitalize',
  },
  biasDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  noBiasContainer: {
    alignItems: 'center',
    padding: 30,
  },
  noBiasText: {
    fontSize: 16,
    color: '#27AE60',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  followupDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 20,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  questionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questionNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
    marginRight: 10,
  },
  primaryActionButton: {
    backgroundColor: '#4A90E2',
    marginRight: 0,
    marginLeft: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A90E2',
    marginLeft: 8,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
  },
});

export default EssayEvaluatorScreen;