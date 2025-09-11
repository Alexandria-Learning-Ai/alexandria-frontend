// =============================
// 📄 screens/PhD/ResearchSkillsScreen.js
// =============================

/**
 * Research Skills Training Screen
 * Grant writing, peer review, conference defense, and other academic skills
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SafeBackButton from '../../components/SafeBackButton';
import NavigationHelper from '../../utils/NavigationHelper';
import { Picker } from '@react-native-picker/picker';

import { PhDService } from '../../services/PhDService';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomButton from '../../components/CustomButton';
import logger from '../utils/logger';


const { width } = Dimensions.get('window');

const ResearchSkillsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseType, setExerciseType] = useState('');
  const [exerciseData, setExerciseData] = useState(null);
  const [working, setWorking] = useState(false);
  
  // Grant Writing Form State
  const [fundingAgency, setFundingAgency] = useState('');
  const [researchArea, setResearchArea] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  
  // Peer Review Form State
  const [manuscriptType, setManuscriptType] = useState('');
  const [reviewField, setReviewField] = useState('');

  useEffect(() => {
    loadSkillModules();
  }, []);

  const loadSkillModules = async () => {
    try {
      setLoading(true);
      const result = await PhDService.getResearchSkillModules();
      setModules(result.modules || []);
    } catch (error) {
      logger.error('❌ Error loading skill modules:', error);
      // Set default modules if API fails
      setModules(defaultModules);
    } finally {
      setLoading(false);
    }
  };

  const defaultModules = [
    {
      id: 'grant_writing',
      title: 'Grant Proposal Writing',
      description: 'Master the art of competitive grant writing',
      duration: '2-3 hours',
      skills: ['proposal_structure', 'budget_planning', 'impact_articulation'],
      icon: 'request-quote',
      color: '#3498DB',
      difficulty: 'Advanced'
    },
    {
      id: 'peer_review',
      title: 'Peer Review Mastery',
      description: 'Learn to provide constructive, thorough peer reviews',
      duration: '1-2 hours',
      skills: ['critique_methodology', 'constructive_feedback', 'review_ethics'],
      icon: 'rate-review',
      color: '#9B59B6',
      difficulty: 'Intermediate'
    },
    {
      id: 'conference_defense',
      title: 'Conference Presentation Defense',
      description: 'Prepare for challenging Q&A sessions',
      duration: '1 hour',
      skills: ['rapid_response', 'question_anticipation', 'confident_delivery'],
      icon: 'present-to-all',
      color: '#E67E22',
      difficulty: 'Advanced'
    },
    {
      id: 'literature_synthesis',
      title: 'Literature Synthesis & Gap Analysis',
      description: 'Identify research gaps and synthesize complex literature',
      duration: '2 hours',
      skills: ['gap_identification', 'synthesis_writing', 'citation_analysis'],
      icon: 'library-books',
      color: '#27AE60',
      difficulty: 'Intermediate'
    }
  ];

  const startGrantWritingExercise = async () => {
    if (!fundingAgency || !researchArea || !budgetRange) {
      Alert.alert('Missing Information', 'Please fill in all fields to start the exercise');
      return;
    }

    try {
      setWorking(true);
      const result = await PhDService.practiceGrantWriting(
        fundingAgency,
        researchArea,
        budgetRange
      );
      setExerciseData(result.exercise);
      setExerciseType('grant_writing');
      setShowExerciseModal(true);
    } catch (error) {
      logger.error('Grant writing exercise error:', error);
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
        Alert.alert('Error', errorInfo.message);
      }
    } finally {
      setWorking(false);
    }
  };

  const startPeerReviewSimulation = async () => {
    if (!manuscriptType || !reviewField) {
      Alert.alert('Missing Information', 'Please select manuscript type and field');
      return;
    }

    try {
      setWorking(true);
      const result = await PhDService.simulatePeerReview(manuscriptType, reviewField);
      setExerciseData(result.simulation);
      setExerciseType('peer_review');
      setShowExerciseModal(true);
    } catch (error) {
      logger.error('Peer review simulation error:', error);
      Alert.alert('Error', 'Failed to start peer review simulation');
    } finally {
      setWorking(false);
    }
  };

  const renderModuleCard = (module) => (
    <TouchableOpacity
      key={module.id}
      style={styles.moduleCard}
      onPress={() => setSelectedModule(module)}
    >
      <View style={[styles.moduleIcon, { backgroundColor: module.color }]}>
        <Icon name={module.icon} size={32} color="#FFFFFF" />
      </View>
      
      <View style={styles.moduleContent}>
        <View style={styles.moduleHeader}>
          <Text style={styles.moduleTitle}>{module.title}</Text>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{module.difficulty}</Text>
          </View>
        </View>
        
        <Text style={styles.moduleDescription} numberOfLines={2}>
          {module.description}
        </Text>
        
        <View style={styles.moduleFooter}>
          <View style={styles.durationContainer}>
            <Icon name="access-time" size={16} color="#666666" />
            <Text style={styles.durationText}>{module.duration}</Text>
          </View>
          <Icon name="arrow-forward" size={16} color="#4A90E2" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGrantWritingForm = () => (
    <View style={styles.exerciseForm}>
      <Text style={styles.formTitle}>Grant Writing Practice Setup</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Funding Agency</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={fundingAgency}
            onValueChange={setFundingAgency}
            style={styles.picker}
          >
            <Picker.Item label="Select funding agency..." value="" />
            <Picker.Item label="National Science Foundation (NSF)" value="NSF" />
            <Picker.Item label="National Institutes of Health (NIH)" value="NIH" />
            <Picker.Item label="Department of Energy (DOE)" value="DOE" />
            <Picker.Item label="European Research Council (ERC)" value="ERC" />
            <Picker.Item label="Gates Foundation" value="Gates" />
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Research Area</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your research area (e.g., Machine Learning, Cancer Biology)"
          value={researchArea}
          onChangeText={setResearchArea}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Budget Range</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={budgetRange}
            onValueChange={setBudgetRange}
            style={styles.picker}
          >
            <Picker.Item label="Select budget range..." value="" />
            <Picker.Item label="$50K - $100K (Small Grant)" value="50K-100K" />
            <Picker.Item label="$100K - $500K (Standard Grant)" value="100K-500K" />
            <Picker.Item label="$500K - $1M (Large Grant)" value="500K-1M" />
            <Picker.Item label="$1M+ (Center/Program Grant)" value="1M+" />
          </Picker>
        </View>
      </View>

      <CustomButton
        title="Start Grant Writing Exercise"
        onPress={startGrantWritingExercise}
        disabled={!fundingAgency || !researchArea || !budgetRange}
        icon="start"
        style={styles.startButton}
      />
    </View>
  );

  const renderPeerReviewForm = () => (
    <View style={styles.exerciseForm}>
      <Text style={styles.formTitle}>Peer Review Simulation Setup</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Manuscript Type</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={manuscriptType}
            onValueChange={setManuscriptType}
            style={styles.picker}
          >
            <Picker.Item label="Select manuscript type..." value="" />
            <Picker.Item label="Original Research Article" value="research_article" />
            <Picker.Item label="Review Article" value="review_article" />
            <Picker.Item label="Case Study" value="case_study" />
            <Picker.Item label="Short Communication" value="short_communication" />
            <Picker.Item label="Meta-Analysis" value="meta_analysis" />
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Research Field</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={reviewField}
            onValueChange={setReviewField}
            style={styles.picker}
          >
            <Picker.Item label="Select research field..." value="" />
            {PhDService.getResearchFields().map((field) => (
              <Picker.Item key={field} label={field} value={field} />
            ))}
          </Picker>
        </View>
      </View>

      <CustomButton
        title="Start Peer Review Simulation"
        onPress={startPeerReviewSimulation}
        disabled={!manuscriptType || !reviewField}
        icon="start"
        style={styles.startButton}
      />
    </View>
  );

  const renderExerciseContent = () => {
    if (!exerciseData) return null;

    return (
      <ScrollView style={styles.exerciseContent}>
        <Text style={styles.exerciseTitle}>{exerciseData.title}</Text>
        <Text style={styles.exerciseDescription}>{exerciseData.description}</Text>
        
        {exerciseData.scenario && (
          <View style={styles.scenarioContainer}>
            <Text style={styles.scenarioTitle}>Scenario</Text>
            <Text style={styles.scenarioText}>{exerciseData.scenario}</Text>
          </View>
        )}

        {exerciseData.tasks && (
          <View style={styles.tasksContainer}>
            <Text style={styles.tasksTitle}>Your Tasks</Text>
            {exerciseData.tasks.map((task, index) => (
              <View key={index} style={styles.taskItem}>
                <View style={styles.taskNumber}>
                  <Text style={styles.taskNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.taskText}>{task}</Text>
              </View>
            ))}
          </View>
        )}

        {exerciseData.guidelines && (
          <View style={styles.guidelinesContainer}>
            <Text style={styles.guidelinesTitle}>Guidelines</Text>
            {exerciseData.guidelines.map((guideline, index) => (
              <View key={index} style={styles.guidelineItem}>
                <Icon name="check-circle-outline" size={16} color="#27AE60" />
                <Text style={styles.guidelineText}>{guideline}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.exerciseActions}>
          <CustomButton
            title="Start Exercise"
            onPress={() => {
              setShowExerciseModal(false);
              navigation.navigate('SkillExercise', { 
                exerciseType, 
                exerciseData 
              });
            }}
            icon="play-arrow"
            style={styles.exerciseButton}
          />
        </View>
      </ScrollView>
    );
  };

  if (loading || working) {
    return <LoadingSpinner message={loading ? "Loading research skill modules..." : "Preparing exercise..."} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => NavigationHelper.safeGoBack(navigation, 'PhD')}
        >
          <Icon name="arrow-back" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <Text style={styles.title}>Research Skills</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PhD Research Skills Training</Text>
          <Text style={styles.sectionDescription}>
            Develop essential research skills through interactive exercises and realistic simulations
          </Text>
        </View>

        {/* Skill Modules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Modules</Text>
          {modules.map(renderModuleCard)}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          
          <View style={styles.quickActionCard}>
            <View style={styles.quickActionHeader}>
              <Icon name="request-quote" size={24} color="#3498DB" />
              <Text style={styles.quickActionTitle}>Grant Writing Practice</Text>
            </View>
            {renderGrantWritingForm()}
          </View>

          <View style={styles.quickActionCard}>
            <View style={styles.quickActionHeader}>
              <Icon name="rate-review" size={24} color="#9B59B6" />
              <Text style={styles.quickActionTitle}>Peer Review Simulation</Text>
            </View>
            {renderPeerReviewForm()}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Module Detail Modal */}
      <Modal
        visible={!!selectedModule}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedModule(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedModule?.title}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedModule(null)}
            >
              <Icon name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedModule && (
              <View style={styles.moduleDetail}>
                <View style={[styles.moduleDetailIcon, { backgroundColor: selectedModule.color }]}>
                  <Icon name={selectedModule.icon} size={48} color="#FFFFFF" />
                </View>
                
                <Text style={styles.moduleDetailDescription}>
                  {selectedModule.description}
                </Text>
                
                <View style={styles.moduleStats}>
                  <View style={styles.statItem}>
                    <Icon name="access-time" size={20} color="#666666" />
                    <Text style={styles.statText}>{selectedModule.duration}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Icon name="trending-up" size={20} color="#666666" />
                    <Text style={styles.statText}>{selectedModule.difficulty}</Text>
                  </View>
                </View>

                <View style={styles.skillsList}>
                  <Text style={styles.skillsTitle}>Skills You'll Develop</Text>
                  {selectedModule.skills?.map((skill, index) => (
                    <View key={index} style={styles.skillItem}>
                      <Icon name="check-circle" size={16} color="#27AE60" />
                      <Text style={styles.skillText}>{skill.replace(/_/g, ' ')}</Text>
                    </View>
                  ))}
                </View>

                <CustomButton
                  title="Start Training Module"
                  onPress={() => {
                    setSelectedModule(null);
                    if (selectedModule.id === 'grant_writing') {
                      // Scroll to grant writing form
                    } else if (selectedModule.id === 'peer_review') {
                      // Scroll to peer review form
                    } else {
                      navigation.navigate('SkillModule', { 
                        moduleId: selectedModule.id,
                        moduleData: selectedModule
                      });
                    }
                  }}
                  icon="play-arrow"
                  style={styles.startModuleButton}
                />
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Exercise Modal */}
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Exercise Ready</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowExerciseModal(false)}
            >
              <Icon name="close" size={24} color="#666666" />
            </TouchableOpacity>
          </View>
          {renderExerciseContent()}
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
    width: 34,
  },
  scrollView: {
    flex: 1,
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
  },
  moduleCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
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
  moduleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  moduleContent: {
    flex: 1,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
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
  moduleDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 10,
  },
  moduleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
  quickActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 12,
  },
  exerciseForm: {
    marginTop: 10,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 15,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  picker: {
    height: 50,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 15,
    fontSize: 14,
    color: '#2C3E50',
  },
  startButton: {
    marginTop: 10,
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
  modalContent: {
    flex: 1,
  },
  moduleDetail: {
    padding: 20,
    alignItems: 'center',
  },
  moduleDetailIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  moduleDetailDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  moduleStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  skillsList: {
    width: '100%',
    marginBottom: 30,
  },
  skillsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  skillText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    textTransform: 'capitalize',
  },
  startModuleButton: {
    width: '100%',
  },

  // Exercise Content
  exerciseContent: {
    flex: 1,
    padding: 20,
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  exerciseDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 20,
  },
  scenarioContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  scenarioText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  tasksContainer: {
    marginBottom: 20,
  },
  tasksTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  taskText: {
    flex: 1,
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 18,
  },
  guidelinesContainer: {
    marginBottom: 20,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  guidelineText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    lineHeight: 18,
  },
  exerciseActions: {
    marginTop: 20,
  },
  exerciseButton: {
    paddingVertical: 16,
  },
});

export default ResearchSkillsScreen;