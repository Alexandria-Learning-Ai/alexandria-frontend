import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import logger from '../utils/logger';

// EventSource types for React Native
// Note: Requires 'react-native-sse' or 'react-native-event-source' package
// Install with: npm install react-native-sse
// @ts-ignore - EventSource from react-native-sse
import EventSource from 'react-native-sse';

interface AsyncQuizOptions {
    quizTypes: string[];
    numQuestions: number;
    difficulty: string;
    language?: string;
    visualEnhancement?: string;
    subjectContext?: any;
}

interface ProgressUpdate {
    job_id: string;
    status: 'connected' | 'processing' | 'completed' | 'failed';
    progress: number; // 0.0 to 1.0
    stage: 'hashing' | 'extraction' | 'generation' | 'storing' | 'caching' | 'complete';
    message: string;
    word_count?: number;
    quiz_id?: string;
    questions_generated?: number;
    processing_time?: number;
    error?: string;
    updated_at?: string;
}

interface UseAsyncQuizGenerationResult {
    // State
    isGenerating: boolean;
    progress: number; // 0-100
    stage: string;
    message: string;
    jobId: string | null;
    quizId: string | null;
    error: string | null;

    // Methods
    generateQuizAsync: (file: any, options: AsyncQuizOptions, userId: string) => Promise<void>;
    cancelGeneration: () => void;
    resetState: () => void;
}

/**
 * Hook for async quiz generation with real-time progress tracking via SSE.
 *
 * Features:
 * - Immediate response (<5s) after upload
 * - Real-time progress updates (0-100%)
 * - Stage-specific messages
 * - Automatic reconnection on network issues
 * - Cleanup on unmount
 *
 * Usage:
 * ```typescript
 * const {
 *   isGenerating,
 *   progress,
 *   stage,
 *   message,
 *   quizId,
 *   error,
 *   generateQuizAsync,
 *   cancelGeneration
 * } = useAsyncQuizGeneration();
 *
 * // Start generation
 * await generateQuizAsync(selectedFile, {
 *   quizTypes: ['multiple_choice'],
 *   numQuestions: 10,
 *   difficulty: 'medium'
 * }, userId);
 *
 * // Monitor progress
 * console.log(`${progress}% - ${message}`);
 *
 * // Quiz ready when quizId is set
 * if (quizId) {
 *   navigation.navigate('Quiz', { quizId });
 * }
 * ```
 */
export const useAsyncQuizGeneration = (): UseAsyncQuizGenerationResult => {
    // State
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState('');
    const [message, setMessage] = useState('');
    const [jobId, setJobId] = useState<string | null>(null);
    const [quizId, setQuizId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Refs for cleanup
    const eventSourceRef = useRef<any>(null);
    const isMountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            closeEventSource();
        };
    }, []);

    /**
     * Close EventSource connection
     */
    const closeEventSource = useCallback(() => {
        if (eventSourceRef.current) {
            try {
                eventSourceRef.current.close();
                logger.info('📡 SSE: EventSource closed');
            } catch (e) {
                logger.warn('Error closing EventSource:', e);
            }
            eventSourceRef.current = null;
        }
    }, []);

    /**
     * Reset all state
     */
    const resetState = useCallback(() => {
        setIsGenerating(false);
        setProgress(0);
        setStage('');
        setMessage('');
        setJobId(null);
        setQuizId(null);
        setError(null);
        closeEventSource();
    }, [closeEventSource]);

    /**
     * Fallback polling mechanism when SSE connection fails
     */
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const startFallbackPolling = useCallback(async (job_id: string) => {
        logger.info('Starting fallback polling for job:', job_id);

        let pollAttempts = 0;
        const maxPollAttempts = 60; // Poll for up to 5 minutes (60 * 5s = 300s)
        const pollInterval = 5000; // Poll every 5 seconds

        const pollStatus = async () => {
            try {
                pollAttempts++;

                if (pollAttempts > maxPollAttempts) {
                    logger.error('Polling timeout: exceeded max attempts');
                    setError('Quiz generation timed out. Please try again.');
                    setIsGenerating(false);
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                    return;
                }

                // Check job status via API
                const statusUrl = `${API_BASE_URL}/async/quiz/status/${job_id}`;
                logger.debug(`Polling attempt ${pollAttempts}: ${statusUrl}`);

                const response = await axios.get(statusUrl);
                const data = response.data;

                logger.info('Poll response:', data);

                // Update progress based on response
                if ((data.status === 'finished' || data.is_finished) && data.quiz_id) {
                    logger.info('Quiz generation completed! Quiz ID:', data.quiz_id);
                    setQuizId(data.quiz_id);
                    setProgress(100);
                    setStage('complete');
                    setMessage('Quiz generation complete!');
                    setIsGenerating(false);

                    // Stop polling
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                } else if (data.status === 'failed' || data.is_failed) {
                    logger.error('Quiz generation failed:', data.error);
                    setError(data.error || 'Quiz generation failed');
                    setIsGenerating(false);

                    // Stop polling
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                } else if (data.status === 'started' || data.status === 'queued' || data.status === 'processing') {
                    // Update progress
                    const progressPercent = Math.round((data.progress || 0) * 100);
                    setProgress(progressPercent);
                    setStage(data.stage || 'processing');
                    setMessage(data.message || 'Processing...');
                }

            } catch (error: any) {
                logger.error('Polling error:', error);

                // If we get a 404, the job might be done but result was deleted
                // Or the job never existed
                if (error.response?.status === 404) {
                    logger.warn('Job not found, stopping polling');
                    setError('Quiz generation status not found');
                    setIsGenerating(false);

                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }
                }
                // For other errors, continue polling (network issues, etc.)
            }
        };

        // Start polling immediately
        await pollStatus();

        // Then poll every 5 seconds
        pollingIntervalRef.current = setInterval(pollStatus, pollInterval);

    }, []);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, []);


    /**
     * Subscribe to SSE progress updates
     */
    const subscribeToProgress = useCallback((jobId: string) => {
        const sseUrl = `${API_BASE_URL}/async/quiz/progress/${jobId}`;
        logger.info(`📡 SSE: Connecting to ${sseUrl}`);

        try {
            // Create EventSource connection
            const es = new EventSource(sseUrl, {
                headers: {
                    // Add any auth headers if needed
                },
                method: 'GET',
            });

            eventSourceRef.current = es;

            // Handle incoming messages
            es.addEventListener('message', (event: any) => {
                if (!isMountedRef.current) return;

                try {
                    const data: ProgressUpdate = JSON.parse(event.data);
                    logger.info('📡 SSE: Progress update:', data);

                    // Update progress state
                    if (data.progress !== undefined) {
                        setProgress(Math.round(data.progress * 100));
                    }

                    if (data.stage) {
                        setStage(data.stage);
                    }

                    if (data.message) {
                        setMessage(data.message);
                    }

                    // Handle completion
                    if ((data.status === 'finished' || data.is_finished) && data.quiz_id) {
                        logger.info('✅ Quiz generation complete! Quiz ID:', data.quiz_id);
                        setQuizId(data.quiz_id);
                        setIsGenerating(false);
                        setProgress(100);
                        closeEventSource();
                    }

                    // Handle failure
                    if (data.status === 'failed') {
                        const errorMsg = data.error || 'Quiz generation failed';
                        logger.error('❌ Quiz generation failed:', errorMsg);
                        setError(errorMsg);
                        setIsGenerating(false);
                        closeEventSource();
                    }
                } catch (parseError) {
                    logger.error('Failed to parse SSE message:', parseError);
                }
            });

            // Handle connection open
            es.addEventListener('open', () => {
                logger.info('📡 SSE: Connection opened');
            });

            // Handle errors
            es.addEventListener('error', (event: any) => {
                logger.error('📡 SSE: Connection error:', event);

                if (!isMountedRef.current) return;

                // Close the SSE connection
                closeEventSource();

                // If we haven't completed successfully, start fallback polling
                if (!quizId) {
                    logger.warn('📡 SSE connection lost, starting fallback polling...');
                    setMessage('Connection interrupted, checking status...');
                    startFallbackPolling(job_id);
                }
            });

        } catch (error) {
            logger.error('Failed to create EventSource:', error);
            setError('Failed to connect to progress stream');
            setIsGenerating(false);
        }
    }, [closeEventSource, quizId, startFallbackPolling]);

    /**
     * Generate quiz asynchronously
     */
    const generateQuizAsync = useCallback(async (
        file: any,
        options: AsyncQuizOptions,
        userId: string
    ): Promise<void> => {
        // Reset previous state
        resetState();

        try {
            setIsGenerating(true);
            setProgress(0);
            setStage('uploading');
            setMessage('Uploading file...');

            logger.info('🚀 Starting async quiz generation');
            logger.info('File:', file.name || file.fileName);
            logger.info('Options:', options);

            // Create FormData
            const formData = new FormData();

            formData.append('file', {
                uri: file.uri,
                name: file.name || file.fileName || 'upload.pdf',
                type: file.mimeType || file.type || 'application/octet-stream',
            } as any);

            formData.append('quiz_types', options.quizTypes.join(','));
            formData.append('num_questions', options.numQuestions.toString());
            formData.append('difficulty', options.difficulty);
            formData.append('user_id', userId);

            if (options.language) {
                formData.append('language', options.language);
            }

            if (options.visualEnhancement) {
                formData.append('visual_preference', options.visualEnhancement);
            }

            if (options.subjectContext) {
                formData.append('subject_context', JSON.stringify(options.subjectContext));
            }

            // Upload file and get job_id
            const uploadUrl = `${API_BASE_URL}/async/quiz/generate`;
            logger.info('📤 Uploading to:', uploadUrl);

            const response = await axios.post(uploadUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 30000, // 30 second timeout for upload
            });

            const { job_id, progress_url } = response.data;

            if (!job_id) {
                throw new Error('No job_id returned from server');
            }

            logger.info('✅ Upload complete! Job ID:', job_id);
            logger.info('📡 Progress URL:', progress_url);

            setJobId(job_id);
            setProgress(5);
            setStage('queued');
            setMessage('Quiz generation started. Connecting to progress stream...');

            // Subscribe to SSE progress updates
            subscribeToProgress(job_id);

        } catch (error: any) {
            logger.error('❌ Failed to start quiz generation:', error);

            let errorMessage = 'Failed to start quiz generation';

            if (error.response) {
                // Server responded with error
                errorMessage = error.response.data?.detail || error.response.data?.message || errorMessage;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setError(errorMessage);
            setIsGenerating(false);
            closeEventSource();

            throw error;
        }
    }, [resetState, subscribeToProgress, closeEventSource]);

    /**
     * Cancel ongoing generation
     */
    const cancelGeneration = useCallback(async () => {
        if (!jobId) {
            logger.warn('No job to cancel');
            return;
        }

        try {
            logger.info('🛑 Canceling job:', jobId);

            await axios.delete(`${API_BASE_URL}/async/quiz/cancel/${jobId}`);

            logger.info('✅ Job canceled successfully');

            setIsGenerating(false);
            setMessage('Quiz generation canceled');
            closeEventSource();

        } catch (error) {
            logger.error('Failed to cancel job:', error);
            // Still close the connection even if cancel fails
            closeEventSource();
            setIsGenerating(false);
        }
    }, [jobId, closeEventSource]);

    return {
        // State
        isGenerating,
        progress,
        stage,
        message,
        jobId,
        quizId,
        error,

        // Methods
        generateQuizAsync,
        cancelGeneration,
        resetState,
    };
};

/**
 * Helper function to get user-friendly stage names
 */
export const getStageName = (stage: string): string => {
    const stageNames: Record<string, string> = {
        uploading: 'Uploading',
        queued: 'Queued',
        hashing: 'Analyzing File',
        extraction: 'Extracting Text',
        generation: 'Generating Questions',
        storing: 'Saving Results',
        caching: 'Finalizing',
        complete: 'Complete',
    };

    return stageNames[stage] || stage;
};

/**
 * Helper function to get stage icon name (FontAwesome5)
 */
export const getStageIcon = (stage: string): string => {
    const stageIcons: Record<string, string> = {
        uploading: 'cloud-upload-alt',
        queued: 'clock',
        hashing: 'calculator',
        extraction: 'file-alt',
        generation: 'edit',
        storing: 'save',
        caching: 'tachometer-alt',
        complete: 'check-circle',
    };

    return stageIcons[stage] || 'question-circle';
};
