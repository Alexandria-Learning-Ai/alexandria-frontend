/**
 * useAskAlexandriaQuizSSE - Enhanced hook with Server-Sent Events support
 *
 * Provides real-time progress updates during quiz generation using SSE.
 * Matches the async architecture of the upload screen.
 */

import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
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

interface ProgressUpdate {
    progress: number;
    stage: string;
}

export const useAskAlexandriaQuizSSE = () => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState('');
    const eventSourceRef = useRef<EventSource | null>(null);

    /**
     * Generate quiz with SSE progress updates
     */
    const generateQuiz = useCallback(async (
        params: QuizGenerationParams,
        onProgress?: (update: ProgressUpdate) => void
    ): Promise<QuizGenerationResult> => {
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

        // Validation
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
            setProgress(0);
            setStage('Starting...');

            const user = auth.currentUser;

            // Get user's education level
            const userProfile = await StudentProfileService.getProfile(user?.uid);
            const gradeLevel = userProfile?.educationLevel || 'college';

            // Step 1: Initiate async quiz generation
            const formData = new FormData();
            formData.append('topic', quizTopic);
            formData.append('quiz_type', quizTypes.includes('all') ? 'mix' : quizTypes.join(','));
            formData.append('grade_level', gradeLevel);
            formData.append('difficulty', difficulty);
            formData.append('num_questions', numQuestions.toString());
            formData.append('language', language || 'en');
            formData.append('user_id', user?.uid || 'anonymous');

            if (details && details.trim()) {
                formData.append('details', details.trim());
            }

            // Add subject context for hierarchical tracking
            if (selectedHierarchicalSubject && selectedHierarchicalCourse) {
                formData.append('subject_context', JSON.stringify({
                    subject_key: selectedHierarchicalSubject,
                    course_key: selectedHierarchicalCourse,
                    manual_subject: selectedCourse.name
                }));
            }

            logger.info('🚀 Initiating async quiz generation:', quizTopic);

            // Start async job
            const initResponse = await fetch(`${API_BASE_URL}/async/ask-alexandria/generate`, {
                method: 'POST',
                headers: {
                    'X-User-ID': user?.uid || 'anonymous',
                },
                body: formData
            });

            if (!initResponse.ok) {
                throw new Error(`Failed to start quiz generation: ${initResponse.statusText}`);
            }

            const { job_id, progress_url } = await initResponse.json();
            logger.info('✅ Job created:', job_id);

            // Step 2: Connect to SSE for progress updates
            return new Promise((resolve) => {
                const sseUrl = `${API_BASE_URL}${progress_url}`;
                logger.info('📡 Connecting to SSE:', sseUrl);

                const eventSource = new EventSource(sseUrl);
                eventSourceRef.current = eventSource;

                eventSource.addEventListener('progress', (event: any) => {
                    try {
                        const data = JSON.parse(event.data);
                        logger.info('📊 Progress update:', data);

                        setProgress(data.progress || 0);
                        setStage(data.stage || '');

                        // Call optional progress callback
                        if (onProgress) {
                            onProgress({
                                progress: data.progress || 0,
                                stage: data.stage || ''
                            });
                        }
                    } catch (error) {
                        logger.error('Error parsing progress event:', error);
                    }
                });

                eventSource.addEventListener('complete', (event: any) => {
                    try {
                        const data = JSON.parse(event.data);
                        logger.info('✅ Quiz generation complete:', data);

                        eventSource.close();
                        eventSourceRef.current = null;

                        const quizData = data.quiz;
                        if (!quizData || !Array.isArray(quizData) || quizData.length === 0) {
                            throw new Error('Invalid quiz data received');
                        }

                        // Enhanced metadata
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
                            hierarchical: {
                                enabled: courseSelectionMode === 'hierarchical',
                                subject: selectedHierarchicalSubject,
                                course: selectedHierarchicalCourse,
                                source: selectedCourse.source || 'profile'
                            }
                        };

                        setLoading(false);
                        resolve({
                            success: true,
                            quizData,
                            metadata: enhancedMetadata,
                            showFreshnessIndicator: data.metadata?.freshness_features?.length > 0
                        });
                    } catch (error) {
                        logger.error('Error processing complete event:', error);
                        eventSource.close();
                        eventSourceRef.current = null;
                        setLoading(false);
                        resolve({
                            success: false,
                            error: 'Failed to process quiz data'
                        });
                    }
                });

                eventSource.addEventListener('error', (event: any) => {
                    try {
                        const data = JSON.parse(event.data);
                        logger.error('❌ SSE error:', data);

                        eventSource.close();
                        eventSourceRef.current = null;
                        setLoading(false);

                        Alert.alert('Quiz Generation Error', data.error || 'Failed to generate quiz');
                        resolve({
                            success: false,
                            error: data.error || 'Failed to generate quiz'
                        });
                    } catch (parseError) {
                        logger.error('Error parsing error event:', parseError);
                        eventSource.close();
                        eventSourceRef.current = null;
                        setLoading(false);
                        resolve({
                            success: false,
                            error: 'Connection error'
                        });
                    }
                });

                eventSource.onerror = (error) => {
                    logger.error('❌ EventSource error:', error);
                    eventSource.close();
                    eventSourceRef.current = null;
                    setLoading(false);

                    resolve({
                        success: false,
                        error: 'Connection to server lost'
                    });
                };
            });

        } catch (error: any) {
            logger.error('❌ Quiz generation error:', error);
            setLoading(false);

            const errorMessage = error.message || 'Failed to generate quiz. Please try again.';
            Alert.alert('Quiz Generation Error', errorMessage);

            return {
                success: false,
                error: errorMessage
            };
        }
    }, []);

    /**
     * Cancel ongoing quiz generation
     */
    const cancelGeneration = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            setLoading(false);
            setProgress(0);
            setStage('');
            logger.info('🛑 Quiz generation cancelled');
        }
    }, []);

    return {
        loading,
        progress,
        stage,
        generateQuiz,
        cancelGeneration
    };
};
