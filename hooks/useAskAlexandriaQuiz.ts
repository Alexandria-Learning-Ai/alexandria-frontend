import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import { StudentProfileService } from '../services/StudentProfileService';
import logger from '../utils/logger';

interface QuizGenerationParams {
    topic: string;
    subject: string;
    selectedCourse: any;
    quizTypes: string[];
    difficulty: string;
    numQuestions: number;
    details: string;
    language: string;
    selectedHierarchicalSubject: string | null;
    selectedHierarchicalCourse: string | null;
    courseSelectionMode: 'profile' | 'hierarchical';
}

interface QuizGenerationResult {
    success: boolean;
    quizData?: any;
    metadata?: any;
    showFreshnessIndicator?: boolean;
    error?: string;
}

export const useAskAlexandriaQuiz = () => {
    const [loading, setLoading] = useState(false);

    /**
     * Generate quiz from Ask Alexandria screen
     */
    const generateQuiz = useCallback(async (params: QuizGenerationParams): Promise<QuizGenerationResult> => {
        const {
            topic,
            subject,
            selectedCourse,
            quizTypes,
            difficulty,
            numQuestions,
            details,
            language,
            selectedHierarchicalSubject,
            selectedHierarchicalCourse,
            courseSelectionMode
        } = params;

        // Use subject as topic if topic is empty
        const quizTopic = topic.trim() || subject.trim();

        if (!quizTopic) {
            Alert.alert('Missing Topic', 'Please enter a subject/topic for your quiz.');
            return { success: false };
        }

        if (!selectedCourse) {
            Alert.alert('Select Course', 'Please select a course from your program to track progress.');
            return { success: false };
        }

        if (quizTypes.length === 0) {
            Alert.alert('Select Quiz Type', 'Please select at least one quiz type.');
            return { success: false };
        }

        try {
            setLoading(true);

            const user = auth.currentUser;

            // Get user's education level from onboarding (default to college if not available)
            const userProfile = await StudentProfileService.getProfile(user?.uid);
            const gradeLevel = userProfile?.educationLevel || 'college';

            // Prepare streamlined API request
            const requestData = {
                topic: quizTopic,
                course: selectedCourse.name,
                course_code: selectedCourse.code,
                quiz_type: quizTypes.includes('all') ? 'mix' : quizTypes.join(','),
                grade_level: gradeLevel,
                difficulty: difficulty,
                num_questions: parseInt(numQuestions.toString(), 10),
                user_id: user?.uid || 'anonymous',
                language: language || 'en'
            };

            // Add exam details for better context
            if (details && details.trim()) {
                requestData['context'] = details.trim();
            }

            logger.info('🎯 Streamlined request:', requestData);

            const response = await axios.post(
                `${API_BASE_URL}/ask-alexandria`,
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': user?.uid || 'anonymous',
                    },
                    timeout: 120000,
                }
            );

            logger.info('🎯 Full API response:', JSON.stringify(response.data, null, 2));

            const quizData = response.data.quiz;
            logger.info('🎯 Quiz data received:', quizData);
            logger.info('📝 Number of questions:', quizData?.length || 0);

            // Better error handling with more informative messages
            if (!quizData) {
                logger.error('❌ No quiz property in response');
                throw new Error('No quiz data returned from server');
            }

            if (!Array.isArray(quizData)) {
                logger.error('❌ Quiz data is not an array:', typeof quizData);
                throw new Error('Invalid quiz data format - expected array');
            }

            if (quizData.length === 0) {
                logger.error('❌ Quiz data array is empty');
                logger.error('❌ Full response for debugging:', response.data);

                throw new Error(`Unable to generate questions for "${quizTopic}". Try using a more specific topic or check your internet connection.`);
            }

            // Enhanced metadata for hierarchical progress tracking
            const enhancedMetadata = {
                title: `${quizTopic} Quiz`,
                course: selectedCourse.name,
                course_code: selectedCourse.code,
                difficulty,
                numQuestions,
                source: 'AskAlexandria',
                category: selectedCourse.name,
                subject: selectedHierarchicalSubject || selectedCourse.subject || quizTopic,
                topic: quizTopic,
                quizTypes: quizTypes,
                // Hierarchical metadata
                hierarchical: {
                    enabled: courseSelectionMode === 'hierarchical',
                    subject: selectedHierarchicalSubject,
                    course: selectedHierarchicalCourse,
                    source: selectedCourse.source || 'profile'
                }
            };

            logger.info('🎮 Quiz metadata prepared:', enhancedMetadata);

            // Check for freshness features
            const showFreshnessIndicator =
                response.data.metadata?.freshness_features &&
                response.data.metadata.freshness_features.length > 0;

            return {
                success: true,
                quizData,
                metadata: enhancedMetadata,
                showFreshnessIndicator
            };

        } catch (error: any) {
            logger.error('❌ Full error object:', error);
            logger.error('📄 Error response data:', error.response?.data);

            let errorMessage = 'Failed to generate quiz. Please try again.';

            if (error.response?.status === 500) {
                errorMessage = 'Server error while generating quiz. Please try again in a moment.';
            } else if (error.response?.status === 422) {
                const validationErrors = error.response?.data?.detail;
                if (validationErrors && typeof validationErrors === 'object') {
                    logger.error('🔍 422 Validation errors:', validationErrors);
                    const errorFields = Object.keys(validationErrors).join(', ');
                    errorMessage = `Validation failed for: ${errorFields}. Please check your inputs.`;
                } else {
                    errorMessage = 'Invalid request format. Please check your inputs and try again.';
                }
            } else if (error.message?.includes('timeout')) {
                errorMessage = 'Request timed out. Please check your connection.';
            } else if (error.response?.status === 404) {
                errorMessage = 'Service endpoint not found. Please check your connection.';
            } else if (!error.response) {
                errorMessage = 'Network error. Please check your connection and try again.';
            }

            Alert.alert('Quiz Generation Error', errorMessage);
            return { success: false, error: errorMessage };

        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        generateQuiz
    };
};
