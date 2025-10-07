import { useState, useCallback } from 'react';
import { Alert, Vibration, Animated } from 'react-native';
import axios from 'axios';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import logger from '../utils/logger';

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

            let res = null;
            let storedMaterialId: string | null = null;

            // ✅ Use different endpoints based on upload purpose
            if (uploadPurpose === 'study') {
                // ✅ Study Mode: Use dedicated study materials endpoint
                const formData = new FormData();
                formData.append('file', {
                    uri: firstFile.uri,
                    name: firstFile.name,
                    type: firstFile.mimeType || 'application/octet-stream',
                } as any);
                formData.append('user_id', user?.uid || 'anonymous');
                formData.append('subject', selectedSubject?.name || '');
                formData.append('course', selectedCourse?.name || '');

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
                const formData = new FormData();
                formData.append('file', {
                    uri: firstFile.uri,
                    name: firstFile.name,
                    type: firstFile.mimeType || 'application/octet-stream',
                } as any);

                formData.append('quiz_types', JSON.stringify(quizTypes));
                formData.append('num_questions', numQuestions.toString());
                formData.append('difficulty', difficulty);
                formData.append('language', language || 'en');
                formData.append('upload_purpose', 'quiz');
                formData.append('visual_preference', visualEnhancement);

                if (user) {
                    formData.append('user_id', user.uid);
                }

                if (selectedSubject) {
                    formData.append('subject_context', JSON.stringify({
                        manual_subject: selectedSubject.name,
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

                Animated.timing(containerAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    navigation.navigate('MaterialViewer', {
                        material: studyMaterial,
                        mode: 'read'
                    });
                });

                Alert.alert(
                    '📚 Study Material Added!',
                    `"${studyMaterial.title}" has been added to your study library. You can now read, listen, or use deep study modes!`,
                    [
                        { text: 'View Library', onPress: () => navigation.navigate('StudyMaterials') },
                        { text: 'Start Reading', style: 'default' }
                    ]
                );

                result.studyMaterial = studyMaterial;

            } else if (uploadPurpose === 'quiz' && res.data?.quiz) {
                Animated.timing(containerAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
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
                });

                Alert.alert('🧠 Quiz Generated!', 'Your practice quiz is ready. Test your knowledge!');

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
            const errorDetail = error.response?.data?.detail || error.message || "Unknown error occurred";

            // Special handling for study uploads when AI service fails
            if (uploadPurpose === 'study' && errorDetail.includes('AI response format error')) {
                Alert.alert(
                    '🤖 AI Service Temporarily Unavailable',
                    'The AI processing service is currently having issues, but we can still add your material to the study library with basic functionality.',
                    [
                        {
                            text: 'Add Anyway',
                            onPress: () => {
                                const basicStudyMaterial = {
                                    id: `material_${Date.now()}`,
                                    title: files[0].name.replace(/\.[^/.]+$/, ""),
                                    fileName: files[0].name,
                                    extractedText: `Material: ${files[0].name}\n\nThis document was added to your study library, but AI text extraction is temporarily unavailable. You can:\n\n• View the document title and details\n• Organize it by subject (${selectedSubject?.name || 'General'})\n• Try text extraction again later when the service is restored\n\nThe document is safely stored and ready for when full functionality returns.`,
                                    extractionQuality: 0,
                                    characterCount: 0,
                                    subject: selectedSubject?.name || 'General',
                                    course: selectedCourse?.name || '',
                                    uploadDate: new Date().toISOString(),
                                    hasAudio: false,
                                    hasSummary: false,
                                    type: getFileIcon(files[0].name),
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
                const errorMessage = uploadPurpose === 'study'
                    ? `Could not process study material: ${errorDetail}`
                    : `The wisdom could not be forged: ${errorDetail}`;

                Alert.alert(
                    uploadPurpose === 'study' ? "📚 Study Upload Failed" : "🏛️ Quiz Creation Failed",
                    errorMessage
                );
                setResponseText(`Error: ${errorDetail}`);
            }

            return { success: false, error: errorDetail };
        }
    }, []);

    return {
        responseText,
        setResponseText,
        handleQuizGeneration
    };
};
