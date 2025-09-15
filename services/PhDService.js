// =============================
// 📄 services/PhDService.js
// =============================

/**
 * PhD Research Companion Service
 * Handles all API calls for MASTERMIND tier features
 */

import ApiService from './ApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig'; // ✅ Add auth import
import logger from '../utils/logger';


class PhDService {
  static BASE_URL = '/api/phd';

  // ✅ NEW: Get user-specific auth token
  static async getUserAuthToken() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to access PhD features');
      }

      const tokenKey = `authToken_${user.uid}`;
      const token = await AsyncStorage.getItem(tokenKey);

      if (!token) {
        logger.warn('No auth token found for user:', user.uid);
        return null;
      }

      return token;
    } catch (error) {
      logger.error('Error getting user auth token:', error);
      throw error;
    }
  }

  // ✅ NEW: Store user-specific auth token
  static async setUserAuthToken(token) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to store auth token');
      }

      const tokenKey = `authToken_${user.uid}`;
      await AsyncStorage.setItem(tokenKey, token);
      logger.info('Auth token stored for user:', user.uid);
    } catch (error) {
      logger.error('Error storing user auth token:', error);
      throw error;
    }
  }

  // ============================================================================
  // DASHBOARD & OVERVIEW
  // ============================================================================

  static async getDashboardStats() {
    try {
      const token = await this.getUserAuthToken();
      const response = await ApiService.get(`${this.BASE_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      logger.error('❌ Error fetching PhD dashboard stats:', error);
      // Return fallback data
      return {
        questionsCompleted: 0,
        essaysEvaluated: 0,
        documentsProcessed: 0,
        skillsAssessed: 0
      };
    }
  }

  static async getRecentActivity() {
    try {
      const token = await this.getUserAuthToken();
      const response = await ApiService.get(`${this.BASE_URL}/dashboard/activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.activities || [];
    } catch (error) {
      logger.error('❌ Error fetching recent activity:', error);
      return [];
    }
  }

  static async getCognitiveProfileSummary() {
    try {
      const token = await this.getUserAuthToken();
      const response = await ApiService.get(`${this.BASE_URL}/analytics/cognitive-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Extract summary scores
      const profile = response.data;
      return {
        criticalThinking: Math.round(profile.cognitive_profile?.scores?.critical_thinking || 0),
        researchSkills: Math.round(
          (profile.research_skills?.proficiency_scores?.methodology_understanding || 0 +
           profile.research_skills?.proficiency_scores?.literature_synthesis || 0) / 2
        ),
        biasAwareness: profile.bias_analysis?.bias_awareness_level || 'developing',
        overallLevel: profile.cognitive_profile?.cognitive_level || 'developing'
      };
    } catch (error) {
      logger.error('❌ Error fetching cognitive profile:', error);
      return {
        criticalThinking: 0,
        researchSkills: 0,
        biasAwareness: 'developing',
        overallLevel: 'developing'
      };
    }
  }

  // ============================================================================
  // QUESTION GENERATION
  // ============================================================================

  static async generatePhDQuestion(requestData) {
    try {
      const token = await this.getUserAuthToken();
      const response = await ApiService.post(
        `${this.BASE_URL}/questions/generate`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      logger.error('❌ Error generating PhD question:', error);
      throw error;
    }
  }

  static async generateScenarioQuestion(researchField, specialization, complexity) {
    try {
      const token = await this.getUserAuthToken();
      const response = await ApiService.post(
        `${this.BASE_URL}/questions/scenario-based`,
        {
          research_field: researchField,
          specialization,
          complexity_level: complexity
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      logger.error('❌ Error generating scenario question:', error);
      throw error;
    }
  }

  static async generatePaperCritique(paperAbstract, researchField, focusAreas) {
    try {
      const token = await this.getUserAuthToken();
      const response = await ApiService.post(
        `${this.BASE_URL}/questions/paper-critique`,
        {
          paper_abstract: paperAbstract,
          research_field: researchField,
          critique_focus: focusAreas
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      logger.error('❌ Error generating paper critique:', error);
      throw error;
    }
  }

  // ============================================================================
  // DOCUMENT PROCESSING
  // ============================================================================

  static async uploadDocument(fileData, documentType, researchField) {
    try {
      const token = await this.getUserAuthToken();
      
      const formData = new FormData();
      formData.append('file', {
        uri: fileData.uri,
        type: fileData.type || 'application/pdf',
        name: fileData.name || 'document.pdf'
      });
      formData.append('document_type', documentType);
      formData.append('research_field', researchField);

      const response = await ApiService.post(
        `${this.BASE_URL}/documents/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      logger.error('❌ Error uploading document:', error);
      throw error;
    }
  }

  static async generateQuestionsFromDocument(documentId, questionCount, questionTypes) {
    try {
      const token = await this.getUserAuthToken();
      const response = await ApiService.post(
        `${this.BASE_URL}/documents/${documentId}/generate-questions`,
        {
          question_count: questionCount,
          question_types: questionTypes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      logger.error('❌ Error generating questions from document:', error);
      throw error;
    }
  }

  // ============================================================================
  // ESSAY EVALUATION
  // ============================================================================

  static async submitEssayResponse(essayData) {
    try {
      const token = await this.getUserAuthToken();
      const response = await ApiService.post(
        `${this.BASE_URL}/responses/submit-essay`,
        essayData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      logger.error('❌ Error submitting essay:', error);
      throw error;
    }
  }

  static async getDetailedFeedback(responseId) {
    try {
      const token = await this.getUserAuthToken();
      const response = await ApiService.get(
        `${this.BASE_URL}/responses/${responseId}/detailed-feedback`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      logger.error('❌ Error fetching detailed feedback:', error);
      throw error;
    }
  }

  // ============================================================================
  // RESEARCH SKILLS
  // ============================================================================

  static async getResearchSkillModules(researchField) {
    try {
      const token = await this.getUserAuthToken();
      const params = researchField ? { research_field: researchField } : {};
      const response = await ApiService.get(
        `${this.BASE_URL}/skills/modules`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          params
        }
      );
      return response.data;
    } catch (error) {
      logger.error('❌ Error fetching skill modules:', error);
      throw error;
    }
  }

  static async practiceGrantWriting(fundingAgency, researchArea, budgetRange) {
    try {
      const token = await this.getUserAuthToken();
      const response = await ApiService.post(
        `${this.BASE_URL}/skills/grant-writing/practice`,
        {
          funding_agency: fundingAgency,
          research_area: researchArea,
          budget_range: budgetRange
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      logger.error('❌ Error practicing grant writing:', error);
      throw error;
    }
  }

  static async simulatePeerReview(manuscriptType, researchField) {
    try {
      const token = await this.getUserAuthToken();
      const response = await ApiService.post(
        `${this.BASE_URL}/skills/peer-review/simulate`,
        {
          manuscript_type: manuscriptType,
          research_field: researchField
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      logger.error('❌ Error simulating peer review:', error);
      throw error;
    }
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  static async getCognitiveProfile() {
    try {
      const token = await this.getUserAuthToken();
      const response = await ApiService.get(
        `${this.BASE_URL}/analytics/cognitive-profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      logger.error('❌ Error fetching cognitive profile:', error);
      throw error;
    }
  }

  static async detectCognitiveBiases() {
    try {
      const token = await this.getUserAuthToken();
      const response = await ApiService.get(
        `${this.BASE_URL}/analytics/bias-detection`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      logger.error('❌ Error detecting biases:', error);
      throw error;
    }
  }

  static async generateKnowledgeMap(researchField) {
    try {
      const token = await this.getUserAuthToken();
      const response = await ApiService.get(
        `${this.BASE_URL}/analytics/knowledge-map`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          params: { research_field: researchField }
        }
      );
      return response.data;
    } catch (error) {
      logger.error('❌ Error generating knowledge map:', error);
      throw error;
    }
  }

  // ============================================================================
  // COLLABORATION
  // ============================================================================

  static async createLabGroup(groupName, researchFocus) {
    try {
      const token = await this.getUserAuthToken();
      const response = await ApiService.post(
        `${this.BASE_URL}/collaborate/create-group`,
        {
          group_name: groupName,
          research_focus: researchFocus
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      logger.error('❌ Error creating lab group:', error);
      throw error;
    }
  }

  static async shareQuizWithGroup(groupId, quizId) {
    try {
      const token = await this.getUserAuthToken();
      const response = await ApiService.post(
        `${this.BASE_URL}/collaborate/${groupId}/share-quiz`,
        { quiz_id: quizId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      logger.error('❌ Error sharing quiz with group:', error);
      throw error;
    }
  }

  // ============================================================================
  // ACADEMIC INTEGRATIONS
  // ============================================================================

  static async connectAcademicService(serviceName, credentials) {
    try {
      const token = await this.getUserAuthToken();
      const response = await ApiService.post(
        `${this.BASE_URL}/integrations/connect`,
        {
          service_name: serviceName,
          api_credentials: credentials
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      logger.error('❌ Error connecting academic service:', error);
      throw error;
    }
  }

  static async syncReferenceLibrary(service) {
    try {
      const token = await this.getUserAuthToken();
      const response = await ApiService.get(
        `${this.BASE_URL}/integrations/sync-library`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          params: { service }
        }
      );
      return response.data;
    } catch (error) {
      logger.error('❌ Error syncing library:', error);
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  static getResearchFields() {
    return [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Computer Science',
      'Engineering',
      'Medicine',
      'Psychology',
      'Sociology',
      'Economics',
      'Political Science',
      'Philosophy',
      'History',
      'Literature',
      'Linguistics',
      'Anthropology',
      'Environmental Science',
      'Neuroscience',
      'Materials Science',
      'Data Science'
    ];
  }

  static getQuestionTypes() {
    return [
      { value: 'scenario_based', label: 'Scenario-Based Analysis' },
      { value: 'multi_step_reasoning', label: 'Multi-Step Reasoning' },
      { value: 'paper_critique', label: 'Paper Critique' },
      { value: 'data_interpretation', label: 'Data Interpretation' },
      { value: 'methodology_evaluation', label: 'Methodology Evaluation' },
      { value: 'synthesis_analysis', label: 'Synthesis Analysis' },
      { value: 'hypothesis_testing', label: 'Hypothesis Testing' },
      { value: 'grant_proposal', label: 'Grant Proposal' },
      { value: 'peer_review', label: 'Peer Review' },
      { value: 'conference_defense', label: 'Conference Defense' }
    ];
  }

  static getCognitiveLevels() {
    return [
      { value: 'analysis', label: 'Analysis', description: 'Break down complex information' },
      { value: 'synthesis', label: 'Synthesis', description: 'Combine elements to form coherent whole' },
      { value: 'evaluation', label: 'Evaluation', description: 'Make judgments based on criteria' },
      { value: 'creation', label: 'Creation', description: 'Generate new ideas or solutions' }
    ];
  }

  static getDifficultyLevels() {
    return [
      { value: 7, label: 'Advanced Undergraduate', description: 'Senior-level complexity' },
      { value: 8, label: 'Masters Level', description: 'Graduate-level analysis' },
      { value: 9, label: 'PhD Level', description: 'Doctoral-level complexity' },
      { value: 10, label: 'Expert Level', description: 'Professional researcher level' }
    ];
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  static handleSubscriptionError(error) {
    if (error.response?.status === 403) {
      const errorData = error.response.data;
      if (errorData.error === 'premium_feature_required') {
        return {
          requiresUpgrade: true,
          currentTier: errorData.current_tier,
          requiredTier: errorData.required_tier,
          message: errorData.message,
          benefits: errorData.feature_benefits || []
        };
      }
    }
    return {
      requiresUpgrade: false,
      message: error.message || 'An error occurred'
    };
  }
}

export { PhDService };