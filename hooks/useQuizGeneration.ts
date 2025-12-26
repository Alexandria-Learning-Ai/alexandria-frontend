import { useState, useCallback } from 'react';
import { Alert, Vibration, Animated } from 'react-native';
import axios from 'axios';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import logger from '../utils/logger';
import { getUserFriendlyError } from '../utils/errorMessages';
import { calculateFileHash, generateCacheKey } from '../utils/fileHash';
import { uploadCache } from '../utils/uploadCache';
import { sanitizeQuizFormData, sanitizeStudyFormData, sanitizeUserId } from '../utils/inputSanitization';

interface QuizGenerationParams {
    files: any[];
    uploadPurpose: 'study' | 'quiz';
    quizTypes: string[];
    numQuestions: number;
    difficulty: string;
    language?: string;
    visualEnhancement: string;
    selectedSubject: any;
    selectedCourse: any;
    selectedHierarchicalSubject: string | null;
    selectedHierarchicalCourse: string | null;
    courseSelectionMode: 'profile' | 'hierarchical';
    subjectValidation: any;
    getFileIcon: (fileName: string) => string;
    navigation: any;
    containerAnim: Animated.Value;
    onFilesCleared?: () => void;
    onSubjectCleared?: () => void;
}

interface QuizGenerationResult {
    success: boolean;
    data?: any;
    uploadPurpose?: string;
    storedMaterialId?: string;
    firstFile?: any;
    showFreshnessIndicator?: boolean;
    studyMaterial?: any;
    error?: string;
}

export const useQuizGeneration = () => {
    const [responseText, setResponseText] = useState<string | null>(null);

    /**
     * Handles quiz generation from uploaded files
     */
    const handleQuizGeneration = useCallback(async (params: QuizGenerationParams): Promise<QuizGenerationResult> => {
        const {
            files,
            uploadPurpose,
            quizTypes,
            numQuestions,
            difficulty,
            language,
            visualEnhancement,
            selectedSubject,
            selectedCourse,
            selectedHierarchicalSubject,
            selectedHierarchicalCourse,
            courseSelectionMode,
            subjectValidation,
            getFileIcon,
            navigation,
            containerAnim,
            onFilesCleared,
            onSubjectCleared
        } = params;

        if (files.length === 0) {
            Alert.alert(
                "🏛️ No Sacred Texts Found",
                "Please select study materials from the archives to begin your journey."
            );
            return { success: false };
        }

        // Only validate quiz settings if user chose quiz generation
        if (uploadPurpose === 'quiz' && quizTypes.length === 0) {
            Alert.alert('Select Quiz Type', 'Please select at least one quiz type.');
            return { success: false };
        }

        try {
            const user = auth.currentUser;
            const firstFile = files[0];

            // 🚀 PERFORMANCE: Check cache before uploading
            let fileHash: string | null = null;
            let cacheKey: string | null = null;

            try {
                logger.info('📊 Calculating file hash for cache check...');
                fileHash = await calculateFileHash(firstFile.uri, firstFile.size);

                // Generate cache key based on upload purpose and parameters
                const cacheParams = uploadPurpose === 'quiz'
                    ? {
                        quizTypes: quizTypes.sort(), // Sort for consistent cache keys
                        numQuestions,
                        difficulty,
                        visualEnhancement,
                    }
                    : {};

                cacheKey = generateCacheKey(fileHash, uploadPurpose, cacheParams);

                // Check if we have a cached result
                const cachedResult = await uploadCache.get(cacheKey);

                if (cachedResult) {
                    logger.info('🎯 Cache HIT! Returning cached result (skipping upload)');

                    // Return cached result with freshness indicator
                    return {
                        success: true,
                        data: cachedResult,
                        uploadPurpose,
                        storedMaterialId: cachedResult.material_id,
                        firstFile,
                        showFreshnessIndicator: true, // Show indicator for cached results
                        studyMaterial: uploadPurpose === 'study' ? cachedResult : undefined,
                    };
                }

                logger.info('💨 Cache MISS - Proceeding with upload');
            } catch (hashError) {
                // If hash calculation fails, continue with upload (don't break the flow)
                logger.warn('⚠️ File hash calculation failed, skipping cache:', hashError);
            }

            let res = null;
            let storedMaterialId: string | null = null;

            // ✅ Use different endpoints based on upload purpose
            if (uploadPurpose === 'study') {
                // ✅ Study Mode: Use dedicated study materials endpoint

                // Sanitize study form data
                const sanitizedStudy = sanitizeStudyFormData({
                    title: selectedSubject?.name,
                    description: selectedCourse?.name,
                });

                const sanitizedUserId = sanitizeUserId(user?.uid);

                const formData = new FormData();
                formData.append('file', {
                    uri: firstFile.uri,
                    name: firstFile.name,
                    type: firstFile.mimeType || 'application/octet-stream',
                } as any);
                formData.append('user_id', sanitizedUserId || 'anonymous');
                formData.append('subject', sanitizedStudy.title || '');
                formData.append('course', sanitizedStudy.description || '');

                logger.info('🔗 Study Mode - Uploading to:', `${API_BASE_URL}/api/study/extract-text`);

                res = await axios.post(`${API_BASE_URL}/api/study/extract-text`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-User-ID': user?.uid || 'anonymous',
                    },
                    timeout: 600000,
                });

                logger.info('✅ Study material upload successful:', res.status);
                logger.info('📦 Response data:', res.data);

                storedMaterialId = res.data?.material_id;

            } else {
                // ✅ Quiz Mode: Use quiz generation endpoint

                // Sanitize quiz form data
                const sanitizedQuiz = sanitizeQuizFormData({
                    subject: selectedSubject?.name,
                    course: selectedCourse?.name,
                    numQuestions,
                    difficulty,
                    quizTypes,
                });

                const sanitizedUserId = sanitizeUserId(user?.uid);

                const formData = new FormData();
                formData.append('file', {
                    uri: firstFile.uri,
                    name: firstFile.name,
                    type: firstFile.mimeType || 'application/octet-stream',
                } as any);

                formData.append('quiz_types', JSON.stringify(sanitizedQuiz.quizTypes));
                formData.append('num_questions', (sanitizedQuiz.numQuestions || 10).toString());
                formData.append('difficulty', sanitizedQuiz.difficulty || 'medium');
                formData.append('language', language || 'en');
                formData.append('upload_purpose', 'quiz');
                formData.append('visual_preference', visualEnhancement);

                if (sanitizedUserId) {
                    formData.append('user_id', sanitizedUserId);
                }

                if (selectedSubject && sanitizedQuiz.subject) {
                    formData.append('subject_context', JSON.stringify({
                        manual_subject: sanitizedQuiz.subject,
                        subject_key: selectedSubject.key,
                        subject_type: selectedSubject.type
                    }));
                }

                logger.info('🔗 Quiz Mode - Uploading to:', `${API_BASE_URL}/upload`);

                res = await axios.post(`${API_BASE_URL}/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-User-ID': user?.uid || 'anonymous',
                    },
                    timeout: 600000,
                });

                logger.info('✅ Quiz upload successful:', res.status);
            }

            // ✅ Handle response
            const result: QuizGenerationResult = {
                success: true,
                data: res.data,
                uploadPurpose,
                storedMaterialId: storedMaterialId || undefined,
                firstFile
            };

            // Handle anti-repetition indicator
            if (res.data?.metadata?.anti_repetition_applied) {
                result.showFreshnessIndicator = true;
            }

            // 🚀 PERFORMANCE: Store successful result in cache
            if (cacheKey && res.data) {
                try {
                    await uploadCache.set(cacheKey, res.data);
                    logger.info('💾 Upload result cached successfully');
                } catch (cacheError) {
                    // Don't fail the upload if caching fails
                    logger.warn('⚠️ Failed to cache upload result:', cacheError);
                }
            }

            // ✅ Handle navigation based on upload purpose
            if (uploadPurpose === 'study') {
                const extractedText = res.data?.extracted_text || '';
                const studyMaterial = {
                    id: storedMaterialId || `material_${Date.now()}`,
                    title: firstFile.name.replace(/\.[^/.]+$/, ""),
                    fileName: firstFile.name,
                    extractedText: extractedText,
                    extractionQuality: res.data?.extraction_quality || 85,
                    characterCount: extractedText?.length || 0,
                    subject: selectedSubject?.name || 'General',
                    course: selectedCourse?.name || '',
                    uploadDate: new Date().toISOString(),
                    hasAudio: false,
                    hasSummary: false,
                    type: getFileIcon(firstFile.name),
                };

                // Check if text extraction was successful
                if (!extractedText || extractedText.length < 10) {
                    Alert.alert(
                        '⚠️ Text Extraction Issue',
                        'We had trouble extracting readable text from this file. You can still view it, but some study features may be limited.',
                        [
                            {
                                text: 'Continue Anyway',
                                onPress: () => {
                                    studyMaterial.extractedText = `Content from ${firstFile.name}\n\nText extraction was not successful for this file type. This could be due to:\n• Image-based PDF without OCR\n• Unsupported file format\n• File corruption\n\nYou can still use this material, but text-based features like summaries and audio may not work properly.`;
                                }
                            },
                            {
                                text: 'Try Again',
                                style: 'cancel',
                                onPress: () => {
                                    onFilesCleared?.();
                                    return;
                                }
                            }
                        ]
                    );
                }

                // Navigate with proper cleanup and race condition handling
                let animationCompleted = false;

                Animated.timing(containerAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(({ finished }) => {
                    animationCompleted = true;
                    // Only navigate if animation completed successfully (not interrupted)
                    if (finished) {
                        try {
                            navigation.navigate('MaterialViewer', {
                                material: studyMaterial,
                                mode: 'read'
                            });

                            // Show success alert AFTER navigation to avoid showing on wrong screen
                            setTimeout(() => {
                                Alert.alert(
                                    '📚 Study Material Added!',
                                    `"${studyMaterial.title}" has been added to your study library. You can now read, listen, or use deep study modes!`,
                                    [
                                        { text: 'View Library', onPress: () => navigation.navigate('StudyMaterials') },
                                        { text: 'Start Reading', style: 'default' }
                                    ]
                                );
                            }, 300);
                        } catch (navError) {
                            logger.error('Navigation error:', navError);
                        }
                    }
                });

                result.studyMaterial = studyMaterial;

            } else if (uploadPurpose === 'quiz' && res.data?.quiz) {
                // Navigate with proper cleanup and race condition handling
                Animated.timing(containerAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(({ finished }) => {
                    // Only navigate if animation completed successfully (not interrupted)
                    if (finished) {
                        try {
                            navigation.navigate('QuizScreen', {
                                quiz: res.data.quiz,
                                source: 'Upload',
                                metadata: {
                                    ...res.data.metadata,
                                    title: 'Alexandria Trial of Wisdom',
                                    category: selectedCourse?.name || selectedSubject?.name || 'Document Study',
                                    course: selectedCourse?.name,
                                    subject: selectedHierarchicalSubject || selectedCourse?.subject || selectedSubject?.name,
                                    topic: selectedHierarchicalCourse || selectedCourse?.name,
                                    manualSubject: selectedSubject,
                                    subjectKey: selectedSubject?.key,
                                    subjectType: selectedSubject?.type,
                                    subjectValidation: subjectValidation,
                                    fileName: firstFile.name,
                                    hierarchical: {
                                        enabled: courseSelectionMode === 'hierarchical',
                                        subject: selectedHierarchicalSubject,
                                        course: selectedHierarchicalCourse,
                                        source: selectedCourse?.source || 'profile'
                                    }
                                }
                            });

                            // Show success alert AFTER navigation to avoid showing on wrong screen
                            setTimeout(() => {
                                Alert.alert('🧠 Quiz Generated!', 'Your practice quiz is ready. Test your knowledge!');
                            }, 300);
                        } catch (navError) {
                            logger.error('Navigation error:', navError);
                        }
                    }
                });

            } else if (res.data?.detail) {
                Alert.alert("🏛️ Processing Error", res.data.detail);
                setResponseText(`Oracle speaks: ${res.data.detail}`);
            } else {
                const successMessage = "Your material has been processed successfully!";
                Alert.alert("🏛️ Success", res.data?.message || successMessage);
                setResponseText(res.data?.message || successMessage);
            }

            // Clean up after successful upload
            onFilesCleared?.();
            onSubjectCleared?.();
            Vibration.vibrate([100, 50, 200]);

            return result;

        } catch (error: any) {
            logger.error("Upload error: ", error.response ? error.response.data : error.message);

            // Get user-friendly error message
            const friendlyError = getUserFriendlyError(error, {
                operation: uploadPurpose === 'study' ? 'upload your study material' : 'generate your quiz',
                resource: uploadPurpose === 'study' ? 'study material' : 'quiz',
            });

            // Ensure files array exists before accessing
            const firstFile = files && files.length > 0 ? files[0] : null;

            // Special handling for study uploads when AI service fails
            if (uploadPurpose === 'study' && firstFile && (error.response?.data?.detail?.includes('AI') || error.message?.includes('AI'))) {
                Alert.alert(
                    '🤖 AI Service Temporarily Unavailable',
                    'The AI processing service is currently having issues, but we can still add your material to the study library with basic functionality.',
                    [
                        {
                            text: 'Add Anyway',
                            onPress: () => {
                                const basicStudyMaterial = {
                                    id: `material_${Date.now()}`,
                                    title: firstFile.name.replace(/\.[^/.]+$/, ""),
                                    fileName: firstFile.name,
                                    extractedText: `Material: ${firstFile.name}\n\nThis document was added to your study library, but AI text extraction is temporarily unavailable. You can:\n\n• View the document title and details\n• Organize it by subject (${selectedSubject?.name || 'General'})\n• Try text extraction again later when the service is restored\n\nThe document is safely stored and ready for when full functionality returns.`,
                                    extractionQuality: 0,
                                    characterCount: 0,
                                    subject: selectedSubject?.name || 'General',
                                    course: selectedCourse?.name || '',
                                    uploadDate: new Date().toISOString(),
                                    hasAudio: false,
                                    hasSummary: false,
                                    type: getFileIcon(firstFile.name),
                                    isBasicMode: true,
                                };

                                Animated.timing(containerAnim, {
                                    toValue: 0,
                                    duration: 300,
                                    useNativeDriver: true,
                                }).start(() => {
                                    navigation.navigate('MaterialViewer', {
                                        material: basicStudyMaterial,
                                        mode: 'read'
                                    });
                                });

                                onFilesCleared?.();
                                onSubjectCleared?.();
                                Vibration.vibrate([100, 50, 200]);
                            }
                        },
                        {
                            text: 'Try Again',
                            style: 'cancel'
                        }
                    ]
                );
            } else {
                // Show friendly error alert
                Alert.alert(
                    uploadPurpose === 'study' ? "Study Upload Failed" : "Quiz Creation Failed",
                    friendlyError
                );
                setResponseText(`Error: ${friendlyError}`);
            }

            return { success: false, error: friendlyError };
        }
    }, []);

    return {
        responseText,
        setResponseText,
        handleQuizGeneration
    };
};
