import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    Dimensions,
    Alert,
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { Colors } from '../constants/Colors';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';
import logger from '../utils/logger';
import { styles } from '../styles/MaterialViewerScreenStyles';
import AddToPlaylistModal from '../components/playlist/AddToPlaylistModal';

const { width, height } = Dimensions.get('window');

const MaterialViewerScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const scrollViewRef = useRef(null);

    const { material, mode } = route.params || {};

    const [viewMode, setViewMode] = useState(mode || 'read'); // 'read', 'summary', 'listen', 'deep_study', 'quick_review', 'hybrid'
    const [isLoading, setIsLoading] = useState(false);
    const [summaryContent, setSummaryContent] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [fontSize, setFontSize] = useState(16);
    const [audioUrl, setAudioUrl] = useState(null);
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioLoading, setAudioLoading] = useState(false);
    const [audioError, setAudioError] = useState(null);
    const [audioGenerationProgress, setAudioGenerationProgress] = useState(0);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryType, setSummaryType] = useState('comprehensive'); // 'brief', 'comprehensive', 'key_points'
    const [selectedVoice, setSelectedVoice] = useState('default'); // 'default', 'male', 'female', 'neutral'
    const [sound, setSound] = useState(null);
    const [soundPosition, setSoundPosition] = useState(0);

    // New states for enhanced study modes
    const [contentAnalysis, setContentAnalysis] = useState(null);
    const [studyProgress, setStudyProgress] = useState({ position: 0, sectionsCompleted: [], timeSpent: 0 });
    const [highlightedText, setHighlightedText] = useState([]);
    const [studyNotes, setStudyNotes] = useState('');
    const [bookmarks, setBookmarks] = useState([]);
    const [comprehensionQuestions, setComprehensionQuestions] = useState([]);
    const [currentSection, setCurrentSection] = useState(0);
    const [studyTimer, setStudyTimer] = useState(0);
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [emphasizedSegments, setEmphasizedSegments] = useState([]);
    const [audioSyncPosition, setAudioSyncPosition] = useState(0);
    const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);

    // Use the light theme colors from Colors constants
    const themeStyles = {
        container: { backgroundColor: Colors.background },
        headerGradient: [Colors.primary, Colors.primaryLight],
        contentBackground: { backgroundColor: Colors.surface },
        textPrimary: { color: Colors.text },
        textSecondary: { color: Colors.textSecondary },
        buttonPrimary: { backgroundColor: Colors.primary },
        buttonSecondary: { backgroundColor: Colors.gray200 },
        border: { borderColor: Colors.border },
    };

    useEffect(() => {
        if (!material) {
            Alert.alert('Error', 'Material data not found');
            navigation.goBack();
        } else {
            // Debug: Log the received material
            logger.info('📖 MaterialViewer received material:', {
                id: material.id,
                title: material.title,
                hasExtractedText: !!material.extractedText,
                textLength: material.extractedText?.length || 0,
                firstChars: material.extractedText?.substring(0, 100) || 'No text'
            });

            // Check if material already has summary or audio
            checkExistingContent();
        }
    }, [material, navigation]);

    // Cleanup audio on component unmount
    useEffect(() => {
        return () => {
            if (sound) {
                logger.info('🔇 Cleaning up audio on unmount');
                sound.unloadAsync().catch(err => logger.error('Error unloading sound:', err));
            }
        };
    }, [sound]);

    const checkExistingContent = async () => {
        if (!material) return;

        try {
            // Check if material has audio flag
            if (material.hasAudio || material.has_audio) {
                logger.info('🔊 Material has audio, attempting to load cached version...');

                const user = auth.currentUser;
                if (!user) return;

                // Try to GET existing audio
                const response = await axios.get(
                    `${API_BASE_URL}/api/study/materials/${material.id}/audio`,
                    {
                        params: {
                            user_id: user.uid,
                            voice: selectedVoice,
                            speed: 1.0,
                            content_type: 'full'
                        },
                        headers: { 'X-User-ID': user.uid },
                        timeout: 10000
                    }
                );

                if (response.data && response.data.audio_url) {
                    logger.info('✅ Loaded cached audio from server');
                    setAudioUrl(response.data.audio_url);
                    setAudioDuration(response.data.duration || 0);
                    // Don't auto-play, just make it available
                }
            }

            // Check for summary
            if (material.hasSummary || material.has_summary) {
                logger.info('📝 Material has summary available');
                // Could optionally pre-load summary here
            }

        } catch (error) {
            // 404 is expected if no audio exists yet
            if (error.response?.status !== 404) {
                logger.error('❌ Error loading existing content:', error);
            }
            // Don't show error to user - they can still generate new audio
        }
    };

    const handleGenerateSummary = async () => {
        if (!material) {
            Alert.alert('Error', 'Material data not available');
            return;
        }

        setSummaryLoading(true);
        setIsLoading(true);

        try {
            const user = auth.currentUser;
            if (!user) {
                Alert.alert('Authentication Error', 'Please log in again to generate summaries.');
                return;
            }

            logger.info(`📝 Generating summary for material: ${material.id}`);

            const formData = new FormData();
            formData.append('user_id', user.uid);
            formData.append('summary_type', summaryType);
            formData.append('language', 'en');

            const response = await axios.post(
                `${API_BASE_URL}/study/materials/${material.id}/summary`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-User-ID': user.uid,
                    },
                    timeout: 120000, // 2 minutes for AI processing
                }
            );

            if (response.data) {
                const summaryData = {
                    summary: response.data.summary,
                    keyPoints: response.data.key_points || [],
                    wordCount: response.data.word_count || 0,
                    estimatedReadingTime: response.data.estimated_reading_time || 1,
                    confidenceScore: response.data.confidence_score || 0.8
                };

                setSummaryContent(summaryData);
                setViewMode('summary');

                logger.info(`✅ Summary generated: ${summaryData.wordCount} words, ${summaryData.keyPoints.length} key points`);

                // Show success message briefly
                Alert.alert(
                    '✅ Summary Generated',
                    `Created ${summaryData.keyPoints.length} key points and a ${summaryData.wordCount}-word summary!`
                );

            } else {
                throw new Error('Invalid response format from server');
            }

        } catch (error) {
            logger.error('❌ Summary generation failed:', error);

            // Handle specific error cases
            if (error.response?.status === 401) {
                Alert.alert('Authentication Error', 'Please log in again to generate summaries.');
            } else if (error.response?.status === 404) {
                Alert.alert('Material Not Found', 'This study material could not be found on the server.');
            } else if (error.response?.status === 429) {
                Alert.alert('Rate Limit', 'Too many requests. Please wait a moment before generating another summary.');
            } else if (error.code === 'ECONNABORTED') {
                Alert.alert('Timeout', 'Summary generation is taking longer than expected. Please try again.');
            } else {
                Alert.alert('Error', 'Failed to generate summary. Please check your internet connection and try again.');
            }

        } finally {
            setIsLoading(false);
            setSummaryLoading(false);
        }
    };

    const handleSummaryOptions = () => {
        Alert.alert(
            'Summary Type',
            'Choose the type of summary to generate:',
            [
                {
                    text: 'Brief',
                    onPress: () => {
                        setSummaryType('brief');
                        setSummaryContent(null); // Clear existing summary
                        handleGenerateSummary();
                    }
                },
                {
                    text: 'Comprehensive',
                    onPress: () => {
                        setSummaryType('comprehensive');
                        setSummaryContent(null); // Clear existing summary
                        handleGenerateSummary();
                    }
                },
                {
                    text: 'Key Points',
                    onPress: () => {
                        setSummaryType('key_points');
                        setSummaryContent(null); // Clear existing summary
                        handleGenerateSummary();
                    }
                },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const handleToggleAudio = async () => {
        if (isPlaying) {
            // Pause audio
            if (sound) {
                await sound.pauseAsync();
            }
            setIsPlaying(false);
        } else {
            // Generate audio if not already available
            if (!audioUrl) {
                await handleGenerateAudio();
            } else {
                // Resume or start audio playback
                if (sound) {
                    await sound.playAsync();
                } else {
                    await loadAndPlaySound();
                }
                setIsPlaying(true);
                setViewMode('listen');
            }
        }
    };

    const handleGenerateAudio = async () => {
        if (!material) {
            Alert.alert('Error', 'Material data not available');
            return;
        }

        // If audio already loaded, just play it
        if (audioUrl) {
            logger.info('▶️ Audio already available, starting playback...');
            await loadAndPlaySound();
            setIsPlaying(true);
            setViewMode('listen');
            return;
        }

        setAudioLoading(true);
        setIsLoading(true);
        setAudioError(null);
        setAudioGenerationProgress(0);

        try {
            const user = auth.currentUser;
            if (!user) {
                setAudioError('Authentication required');
                Alert.alert('Authentication Error', 'Please log in again to generate audio.');
                return;
            }

            logger.info(`🔊 Requesting audio for material: ${material.id}`);

            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setAudioGenerationProgress(prev => Math.min(prev + 10, 90));
            }, 1000);

            const formData = new FormData();
            formData.append('user_id', user.uid);
            formData.append('voice', selectedVoice);
            formData.append('speed', '1.0');
            formData.append('language', 'en');
            formData.append('content_type', 'full'); // full text
            formData.append('force_regenerate', 'false'); // ✅ Use cached if available

            // POST will return cached audio if available
            const response = await axios.post(
                `${API_BASE_URL}/api/study/materials/${material.id}/audio`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-User-ID': user.uid,
                    },
                    timeout: 180000, // 3 minutes for audio generation
                }
            );

            clearInterval(progressInterval);
            setAudioGenerationProgress(100);

            if (response.data) {
                setAudioUrl(response.data.audio_url);
                setAudioDuration(response.data.duration || 0);
                setIsPlaying(true);
                setViewMode('listen');
                setAudioError(null);

                logger.info(`✅ Audio ready: ${response.data.duration}s duration`);

                // Show success message
                Alert.alert(
                    'Audio Ready',
                    `Audio narration ready! Duration: ${Math.round(response.data.duration / 60)} minutes`
                );

                // Start actual audio playback
                await loadAndPlaySound();

            } else {
                throw new Error('Invalid response format from server');
            }

        } catch (error) {
            logger.error('❌ Audio generation failed:', error);

            let errorMessage = 'Unable to generate audio. ';
            let errorDetails = '';

            // Handle specific error cases with detailed messages
            if (error.response?.status === 401) {
                errorMessage = 'Authentication failed';
                errorDetails = 'Please log in again to generate audio.';
                setAudioError('Authentication required');
            } else if (error.response?.status === 404) {
                errorMessage = 'Material not found';
                errorDetails = 'This study material could not be found on the server.';
                setAudioError('Material not found on server');
            } else if (error.response?.status === 429) {
                errorMessage = 'Rate limit exceeded';
                errorDetails = 'Too many requests. Please wait a moment before generating audio again.';
                setAudioError('Too many requests - please wait');
            } else if (error.response?.status === 500) {
                errorMessage = 'Server error';
                errorDetails = 'The audio generation service encountered an error. Please try again.';
                setAudioError('Server error - please retry');
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout';
                errorDetails = 'Audio generation is taking longer than expected. The document might be too long. Try again or break it into smaller sections.';
                setAudioError('Generation timeout - document may be too long');
            } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network')) {
                errorMessage = 'Network error';
                errorDetails = 'Please check your internet connection and try again.';
                setAudioError('No internet connection');
            } else {
                errorMessage = 'Generation failed';
                errorDetails = 'An unexpected error occurred. Please try again or contact support if the issue persists.';
                setAudioError('Unexpected error occurred');
            }

            // Show retry dialog
            Alert.alert(
                errorMessage,
                errorDetails,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Retry',
                        onPress: () => handleGenerateAudio()
                    }
                ]
            );

        } finally {
            setIsLoading(false);
            setAudioLoading(false);
            setAudioGenerationProgress(0);
        }
    };

    const loadAndPlaySound = async () => {
        try {
            logger.info(`🔊 Loading audio from: ${audioUrl}`);

            // Unload previous sound if exists
            if (sound) {
                await sound.unloadAsync();
            }

            // Configure audio mode for playback
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
            });

            // Construct full audio URL
            const fullAudioUrl = `${API_BASE_URL}${audioUrl}`;
            logger.info(`🔊 Full audio URL: ${fullAudioUrl}`);

            // Load and play the sound
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: fullAudioUrl },
                { shouldPlay: true, progressUpdateIntervalMillis: 1000 },
                onPlaybackStatusUpdate
            );

            setSound(newSound);
            setIsPlaying(true);
            logger.info('✅ Audio loaded and playing');

        } catch (error) {
            logger.error('❌ Error playing audio:', error);
            Alert.alert('Playback Error', 'Unable to play audio. Please try again.');
            setIsPlaying(false);
        }
    };

    const onPlaybackStatusUpdate = (status) => {
        if (status.isLoaded) {
            setSoundPosition(status.positionMillis / 1000); // Convert to seconds
            setCurrentPosition(Math.floor(status.positionMillis / 1000));

            if (status.didJustFinish) {
                setIsPlaying(false);
                setSoundPosition(0);
                setCurrentPosition(0);
            }
        }
    };

    const handleAudioOptions = () => {
        Alert.alert(
            'Audio Settings',
            'Choose voice type for audio generation:',
            [
                {
                    text: 'Default Voice',
                    onPress: () => {
                        setSelectedVoice('default');
                        setAudioUrl(null); // Clear existing audio
                        handleGenerateAudio();
                    }
                },
                {
                    text: 'Male Voice',
                    onPress: () => {
                        setSelectedVoice('male');
                        setAudioUrl(null); // Clear existing audio
                        handleGenerateAudio();
                    }
                },
                {
                    text: 'Female Voice',
                    onPress: () => {
                        setSelectedVoice('female');
                        setAudioUrl(null); // Clear existing audio
                        handleGenerateAudio();
                    }
                },
                {
                    text: 'Neutral Voice',
                    onPress: () => {
                        setSelectedVoice('neutral');
                        setAudioUrl(null); // Clear existing audio
                        handleGenerateAudio();
                    }
                },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const handleFontSizeChange = (increment) => {
        const newSize = fontSize + increment;
        if (newSize >= 12 && newSize <= 24) {
            setFontSize(newSize);
        }
    };

    // Enhanced study mode handlers
    const handleDeepStudyMode = async () => {
        setViewMode('deep_study');
        setSessionStartTime(new Date());

        // Initialize content analysis if not done
        if (!contentAnalysis) {
            await analyzeContent();
        }

        // Start tracking session
        trackStudySession('deep_study');
    };

    const handleQuickReviewMode = async () => {
        setViewMode('quick_review');
        setSessionStartTime(new Date());

        // Generate quick review content if needed
        if (!summaryContent) {
            await handleGenerateSummary();
        }

        trackStudySession('quick_review');
    };

    const handleHybridMode = async () => {
        setViewMode('hybrid');
        setSessionStartTime(new Date());

        // Ensure we have both summary and audio
        if (!summaryContent) {
            await handleGenerateSummary();
        }
        if (!audioUrl) {
            await handleGenerateAudio();
        }

        trackStudySession('hybrid');
    };

    const analyzeContent = async () => {
        if (!material) return;

        try {
            setIsLoading(true);
            const user = auth.currentUser;
            if (!user) return;

            logger.info(`🔍 Analyzing content for material: ${material.id}`);

            const response = await axios.post(
                `${API_BASE_URL}/study/materials/${material.id}/analyze`,
                {
                    user_id: user.uid,
                    text: material.extractedText,
                    subject: material.subject
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': user.uid,
                    },
                    timeout: 60000,
                }
            );

            if (response.data) {
                setContentAnalysis(response.data);
                setEmphasizedSegments(response.data.emphasis_points || []);
                logger.info(`✅ Content analysis completed`);
            }

        } catch (error) {
            logger.error('❌ Content analysis failed:', error);
            // Set basic fallback analysis
            setContentAnalysis({
                difficulty_analysis: { difficulty_score: 50, complexity_level: 'intermediate' },
                subject_classification: { primary_subject: material.subject || 'general' },
                study_time_estimate: { estimated_study_time: 20 }
            });
        } finally {
            setIsLoading(false);
        }
    };

    const trackStudySession = (sessionType) => {
        // Track study session analytics
        logger.info(`📊 Starting ${sessionType} session for material ${material.id}`);

        // This would integrate with your analytics system
        // For now, we'll just update local state
        setStudyProgress(prev => ({
            ...prev,
            timeSpent: 0,
            position: 0
        }));
    };

    const addBookmark = (position, note = '') => {
        const bookmark = {
            id: Date.now(),
            position,
            note,
            timestamp: new Date().toISOString()
        };

        setBookmarks(prev => [...prev, bookmark]);
        logger.info(`🔖 Added bookmark at position ${position}`);
    };

    const highlightText = (start, end, type = 'highlight') => {
        const highlight = {
            id: Date.now(),
            start,
            end,
            type,
            timestamp: new Date().toISOString()
        };

        setHighlightedText(prev => [...prev, highlight]);
        logger.info(`✨ Highlighted text from ${start} to ${end}`);
    };

    const renderModeSelector = () => (
        <View style={styles.modeSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeSelectorScroll}>
                <TouchableOpacity
                    style={[
                        styles.modeButton,
                        viewMode === 'read' && styles.activeModeButton,
                        themeStyles.buttonSecondary,
                        viewMode === 'read' && themeStyles.buttonPrimary
                    ]}
                    onPress={() => setViewMode('read')}
                >
                    <FontAwesome5
                        name="book-open"
                        size={14}
                        color={viewMode === 'read' ? '#FFFFFF' : themeStyles.textPrimary.color}
                    />
                    <Text style={[
                        styles.modeButtonText,
                        { color: viewMode === 'read' ? '#FFFFFF' : themeStyles.textPrimary.color }
                    ]}>
                        Read
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.modeButton,
                        viewMode === 'deep_study' && styles.activeModeButton,
                        themeStyles.buttonSecondary,
                        viewMode === 'deep_study' && themeStyles.buttonPrimary
                    ]}
                    onPress={() => handleDeepStudyMode()}
                >
                    <FontAwesome5
                        name="brain"
                        size={14}
                        color={viewMode === 'deep_study' ? '#FFFFFF' : themeStyles.textPrimary.color}
                    />
                    <Text style={[
                        styles.modeButtonText,
                        { color: viewMode === 'deep_study' ? '#FFFFFF' : themeStyles.textPrimary.color }
                    ]}>
                        Deep Study
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.modeButton,
                        viewMode === 'quick_review' && styles.activeModeButton,
                        themeStyles.buttonSecondary,
                        viewMode === 'quick_review' && themeStyles.buttonPrimary
                    ]}
                    onPress={() => handleQuickReviewMode()}
                >
                    <FontAwesome5
                        name="bolt"
                        size={14}
                        color={viewMode === 'quick_review' ? '#FFFFFF' : themeStyles.textPrimary.color}
                    />
                    <Text style={[
                        styles.modeButtonText,
                        { color: viewMode === 'quick_review' ? '#FFFFFF' : themeStyles.textPrimary.color }
                    ]}>
                        Quick Review
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.modeButton,
                        viewMode === 'summary' && styles.activeModeButton,
                        themeStyles.buttonSecondary,
                        viewMode === 'summary' && themeStyles.buttonPrimary
                    ]}
                    onPress={summaryContent ? () => setViewMode('summary') : handleGenerateSummary}
                    onLongPress={handleSummaryOptions}
                    disabled={summaryLoading}
                >
                    {summaryLoading ? (
                        <ActivityIndicator size="small" color={themeStyles.textPrimary.color} />
                    ) : (
                        <FontAwesome5
                            name="list-ul"
                            size={14}
                            color={viewMode === 'summary' ? '#FFFFFF' : themeStyles.textPrimary.color}
                        />
                    )}
                    <Text style={[
                        styles.modeButtonText,
                        { color: viewMode === 'summary' ? '#FFFFFF' : themeStyles.textPrimary.color }
                    ]}>
                        {summaryLoading ? 'Generating...' : 'Summary'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.modeButton,
                        viewMode === 'listen' && styles.activeModeButton,
                        themeStyles.buttonSecondary,
                        viewMode === 'listen' && themeStyles.buttonPrimary
                    ]}
                    onPress={handleToggleAudio}
                    onLongPress={handleAudioOptions}
                    disabled={audioLoading}
                >
                    {audioLoading ? (
                        <ActivityIndicator size="small" color={themeStyles.textPrimary.color} />
                    ) : (
                        <FontAwesome5
                            name={isPlaying ? "pause" : "play"}
                            size={14}
                            color={viewMode === 'listen' ? '#FFFFFF' : themeStyles.textPrimary.color}
                        />
                    )}
                    <Text style={[
                        styles.modeButtonText,
                        { color: viewMode === 'listen' ? '#FFFFFF' : themeStyles.textPrimary.color }
                    ]}>
                        {audioLoading ? 'Generating...' : 'Listen'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.modeButton,
                        viewMode === 'hybrid' && styles.activeModeButton,
                        themeStyles.buttonSecondary,
                        viewMode === 'hybrid' && themeStyles.buttonPrimary
                    ]}
                    onPress={() => handleHybridMode()}
                >
                    <FontAwesome5
                        name="magic"
                        size={14}
                        color={viewMode === 'hybrid' ? '#FFFFFF' : themeStyles.textPrimary.color}
                    />
                    <Text style={[
                        styles.modeButtonText,
                        { color: viewMode === 'hybrid' ? '#FFFFFF' : themeStyles.textPrimary.color }
                    ]}>
                        Hybrid
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );

    const renderReadingControls = () => (
        <View style={styles.readingControls}>
            <TouchableOpacity
                style={[styles.controlButton, themeStyles.buttonSecondary]}
                onPress={() => handleFontSizeChange(-2)}
            >
                <FontAwesome5 name="minus" size={14} color={themeStyles.textPrimary.color} />
            </TouchableOpacity>

            <Text style={[styles.fontSizeText, themeStyles.textSecondary]}>
                Font: {fontSize}px
            </Text>

            <TouchableOpacity
                style={[styles.controlButton, themeStyles.buttonSecondary]}
                onPress={() => handleFontSizeChange(2)}
            >
                <FontAwesome5 name="plus" size={14} color={themeStyles.textPrimary.color} />
            </TouchableOpacity>
        </View>
    );

    const renderContent = () => {
        if (viewMode === 'read') {
            return (
                <View style={styles.contentContainer}>
                    {renderReadingControls()}
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.contentScroll}
                        showsVerticalScrollIndicator={true}
                    >
                        <Text style={[
                            styles.contentText,
                            themeStyles.textPrimary,
                            { fontSize: fontSize, lineHeight: fontSize * 1.6 }
                        ]}>
                            {material?.extractedText || "No content available. Please ensure the document was properly uploaded and text extraction was successful."}
                        </Text>
                    </ScrollView>
                </View>
            );
        }

        if (viewMode === 'deep_study') {
            return renderDeepStudyMode();
        }

        if (viewMode === 'quick_review') {
            return renderQuickReviewMode();
        }

        if (viewMode === 'hybrid') {
            return renderHybridMode();
        }

        if (viewMode === 'summary' && summaryContent) {
            return (
                <View style={styles.contentContainer}>
                    <ScrollView style={styles.contentScroll}>
                        <Text style={[styles.sectionTitle, themeStyles.textPrimary]}>
                            Key Points
                        </Text>
                        {summaryContent.keyPoints.map((point, index) => (
                            <View key={index} style={styles.keyPointItem}>
                                <FontAwesome5
                                    name="check-circle"
                                    size={16}
                                    color="#28a745"
                                    style={styles.keyPointIcon}
                                />
                                <Text style={[styles.keyPointText, themeStyles.textPrimary]}>
                                    {point}
                                </Text>
                            </View>
                        ))}

                        <Text style={[styles.sectionTitle, themeStyles.textPrimary, { marginTop: 24 }]}>
                            Summary
                        </Text>
                        <Text style={[styles.summaryText, themeStyles.textPrimary]}>
                            {summaryContent.summary}
                        </Text>
                    </ScrollView>
                </View>
            );
        }

        if (viewMode === 'listen') {
            return (
                <View style={styles.audioContainer}>
                    {/* Loading State with Progress */}
                    {audioLoading && (
                        <View style={styles.audioLoadingContainer}>
                            <ActivityIndicator size="large" color="#D4AF37" />
                            <Text style={[styles.audioLoadingText, themeStyles.textPrimary]}>
                                Generating Audio Narration...
                            </Text>
                            {audioGenerationProgress > 0 && (
                                <View style={styles.generationProgressContainer}>
                                    <View style={styles.generationProgressBar}>
                                        <View
                                            style={[
                                                styles.generationProgressFill,
                                                { width: `${audioGenerationProgress}%` }
                                            ]}
                                        />
                                    </View>
                                    <Text style={[styles.progressPercentText, themeStyles.textSecondary]}>
                                        {audioGenerationProgress}%
                                    </Text>
                                </View>
                            )}
                            <Text style={[styles.audioLoadingSubtext, themeStyles.textSecondary]}>
                                This may take up to 3 minutes for long documents
                            </Text>
                        </View>
                    )}

                    {/* Error State with Retry Button */}
                    {audioError && !audioLoading && (
                        <View style={styles.audioErrorContainer}>
                            <FontAwesome5 name="exclamation-triangle" size={48} color="#E74C3C" />
                            <Text style={[styles.audioErrorTitle, themeStyles.textPrimary]}>
                                Audio Generation Failed
                            </Text>
                            <Text style={[styles.audioErrorMessage, themeStyles.textSecondary]}>
                                {audioError}
                            </Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={() => handleGenerateAudio()}
                            >
                                <FontAwesome5 name="redo" size={16} color="#FFFFFF" />
                                <Text style={styles.retryButtonText}>Retry Generation</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.backToReadButton}
                                onPress={() => setViewMode('read')}
                            >
                                <Text style={[styles.backToReadText, themeStyles.textSecondary]}>
                                    Back to Reading
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Audio Controls (when audio is ready or playing) */}
                    {!audioLoading && !audioError && (
                        <>
                            <View style={styles.audioControls}>
                                <TouchableOpacity
                                    style={[styles.audioButton, themeStyles.buttonPrimary]}
                                    onPress={async () => {
                                        if (sound) {
                                            const status = await sound.getStatusAsync();
                                            if (status.isLoaded) {
                                                const newPosition = Math.max(0, status.positionMillis - 15000);
                                                await sound.setPositionAsync(newPosition);
                                            }
                                        }
                                    }}
                                    disabled={!audioUrl}
                                >
                                    <FontAwesome5 name="backward" size={20} color="#FFFFFF" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.playButton, themeStyles.buttonPrimary]}
                                    onPress={handleToggleAudio}
                                >
                                    {audioUrl ? (
                                        <FontAwesome5
                                            name={isPlaying ? "pause" : "play"}
                                            size={32}
                                            color="#FFFFFF"
                                        />
                                    ) : (
                                        <FontAwesome5 name="play" size={32} color="#FFFFFF" />
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.audioButton, themeStyles.buttonPrimary]}
                                    onPress={async () => {
                                        if (sound) {
                                            const status = await sound.getStatusAsync();
                                            if (status.isLoaded) {
                                                const newPosition = Math.min(status.durationMillis, status.positionMillis + 15000);
                                                await sound.setPositionAsync(newPosition);
                                            }
                                        }
                                    }}
                                    disabled={!audioUrl}
                                >
                                    <FontAwesome5 name="forward" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.progressContainer}>
                                <View style={[styles.progressBar, themeStyles.border]}>
                                    <View style={[
                                        styles.progressFill,
                                        { width: audioUrl && audioDuration > 0 ? `${(currentPosition / audioDuration) * 100}%` : '0%' }
                                    ]} />
                                </View>
                                <Text style={[styles.timeText, themeStyles.textSecondary]}>
                                    {audioUrl
                                        ? `${Math.floor(currentPosition / 60)}:${String(Math.floor(currentPosition % 60)).padStart(2, '0')} / ${Math.floor(audioDuration / 60)}:${String(Math.floor(audioDuration % 60)).padStart(2, '0')}`
                                        : 'Audio not generated yet'
                                    }
                                </Text>
                            </View>

                            <View style={styles.audioStatusContainer}>
                                <FontAwesome5
                                    name={audioUrl ? (isPlaying ? "volume-up" : "pause-circle") : "headphones"}
                                    size={20}
                                    color="#D4AF37"
                                />
                                <Text style={[styles.audioStatusText, themeStyles.textSecondary]}>
                                    {audioUrl
                                        ? (isPlaying ? "Playing..." : "Paused")
                                        : "Tap play to generate audio"
                                    }
                                </Text>
                            </View>

                            {/* Save to Playlist Button */}
                            {audioUrl && (
                                <TouchableOpacity
                                    style={styles.saveToPlaylistButton}
                                    onPress={() => setShowAddToPlaylistModal(true)}
                                >
                                    <FontAwesome5 name="plus-circle" size={18} color="#D4AF37" />
                                    <Text style={[styles.saveToPlaylistText, themeStyles.textSecondary]}>
                                        Save to Playlist
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Voice Selection Button */}
                            {!audioUrl && (
                                <TouchableOpacity
                                    style={styles.voiceSettingsButton}
                                    onPress={handleAudioOptions}
                                >
                                    <FontAwesome5 name="sliders-h" size={16} color="#D4AF37" />
                                    <Text style={[styles.voiceSettingsText, themeStyles.textSecondary]}>
                                        Choose Voice ({selectedVoice})
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            );
        }

        return null;
    };

    // Deep Study Mode - Comprehensive study interface with analytics, notes, and structured learning
    const renderDeepStudyMode = () => (
        <View style={styles.contentContainer}>
            {/* Study Analytics Header */}
            <View style={styles.studyAnalyticsHeader}>
                <View style={styles.analyticsRow}>
                    <View style={styles.analyticsItem}>
                        <FontAwesome5 name="clock" size={12} color="#D4AF37" />
                        <Text style={[styles.analyticsText, themeStyles.textSecondary]}>
                            {Math.floor(studyTimer / 60)}:{String(studyTimer % 60).padStart(2, '0')}
                        </Text>
                    </View>
                    <View style={styles.analyticsItem}>
                        <FontAwesome5 name="brain" size={12} color="#D4AF37" />
                        <Text style={[styles.analyticsText, themeStyles.textSecondary]}>
                            {contentAnalysis?.difficulty_analysis?.complexity_level || 'analyzing...'}
                        </Text>
                    </View>
                    <View style={styles.analyticsItem}>
                        <FontAwesome5 name="chart-line" size={12} color="#D4AF37" />
                        <Text style={[styles.analyticsText, themeStyles.textSecondary]}>
                            {Math.round((studyProgress.position / (material?.extractedText?.length || 1)) * 100)}%
                        </Text>
                    </View>
                </View>
            </View>

            {/* Content with highlighting and bookmarks */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.contentScroll}
                showsVerticalScrollIndicator={true}
                onScroll={(event) => {
                    const position = event.nativeEvent.contentOffset.y;
                    setStudyProgress(prev => ({ ...prev, position }));
                }}
            >
                <View style={styles.deepStudyContent}>
                    {/* Learning Objectives */}
                    {contentAnalysis?.learning_objectives?.length > 0 && (
                        <View style={styles.learningObjectives}>
                            <Text style={[styles.sectionTitle, themeStyles.textPrimary]}>
                                Learning Objectives
                            </Text>
                            {contentAnalysis.learning_objectives.map((objective, index) => (
                                <View key={index} style={styles.objectiveItem}>
                                    <FontAwesome5 name="bullseye" size={12} color="#28a745" />
                                    <Text style={[styles.objectiveText, themeStyles.textPrimary]}>
                                        {objective}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Main Content with Enhanced Interaction */}
                    <View style={styles.interactiveTextContainer}>
                        <Text
                            style={[
                                styles.contentText,
                                themeStyles.textPrimary,
                                { fontSize: fontSize, lineHeight: fontSize * 1.6 }
                            ]}
                            selectable={true}
                        >
                            {material?.extractedText || "Content loading..."}
                        </Text>

                        {/* Bookmarks Overlay */}
                        {bookmarks.map((bookmark) => (
                            <View
                                key={bookmark.id}
                                style={[styles.bookmarkIndicator, { top: bookmark.position * 0.1 }]}
                            >
                                <FontAwesome5 name="bookmark" size={16} color="#D4AF37" />
                            </View>
                        ))}
                    </View>

                    {/* Study Controls */}
                    <View style={styles.studyControls}>
                        <TouchableOpacity
                            style={[styles.studyControlButton, themeStyles.buttonSecondary]}
                            onPress={() => addBookmark(studyProgress.position)}
                        >
                            <FontAwesome5 name="bookmark" size={16} color="#D4AF37" />
                            <Text style={[styles.controlButtonText, themeStyles.textPrimary]}>
                                Bookmark
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.studyControlButton, themeStyles.buttonSecondary]}
                            onPress={() => setShowAnalytics(!showAnalytics)}
                        >
                            <FontAwesome5 name="chart-bar" size={16} color="#D4AF37" />
                            <Text style={[styles.controlButtonText, themeStyles.textPrimary]}>
                                Analytics
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.studyControlButton, themeStyles.buttonSecondary]}
                            onPress={() => {
                                // Navigate to quiz generation based on this content
                                Alert.alert('Quiz Generation', 'Generate practice questions from this material?', [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Generate', onPress: () => logger.info('Generate quiz') }
                                ]);
                            }}
                        >
                            <FontAwesome5 name="question-circle" size={16} color="#D4AF37" />
                            <Text style={[styles.controlButtonText, themeStyles.textPrimary]}>
                                Quiz Me
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Key Concepts */}
                    {contentAnalysis?.key_concepts?.length > 0 && (
                        <View style={styles.keyConcepts}>
                            <Text style={[styles.sectionTitle, themeStyles.textPrimary]}>
                                Key Concepts
                            </Text>
                            {contentAnalysis.key_concepts.slice(0, 5).map((concept, index) => (
                                <View key={index} style={styles.conceptItem}>
                                    <FontAwesome5 name="lightbulb" size={12} color="#FFA500" />
                                    <View style={styles.conceptContent}>
                                        <Text style={[styles.conceptName, themeStyles.textPrimary]}>
                                            {concept.concept}
                                        </Text>
                                        {concept.definition && (
                                            <Text style={[styles.conceptDefinition, themeStyles.textSecondary]}>
                                                {concept.definition}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Study Notes Panel */}
            <View style={styles.notesPanel}>
                <TextInput
                    style={[styles.notesInput, themeStyles.textPrimary]}
                    placeholder="Take notes as you study..."
                    placeholderTextColor={themeStyles.textSecondary.color}
                    value={studyNotes}
                    onChangeText={setStudyNotes}
                    multiline={true}
                    numberOfLines={3}
                />
            </View>
        </View>
    );

    // Quick Review Mode - Fast-paced review for cramming
    const renderQuickReviewMode = () => (
        <View style={styles.contentContainer}>
            {/* Quick Review Header */}
            <View style={styles.quickReviewHeader}>
                <View style={styles.reviewStats}>
                    <FontAwesome5 name="bolt" size={16} color="#FFD700" />
                    <Text style={[styles.reviewModeText, themeStyles.textPrimary]}>
                        Quick Review Mode
                    </Text>
                    <Text style={[styles.reviewTimer, themeStyles.textSecondary]}>
                        Est. {contentAnalysis?.study_time_estimate?.estimated_review_time || 5} min
                    </Text>
                </View>
            </View>

            <ScrollView style={styles.contentScroll}>
                {/* Key Points Section */}
                {summaryContent?.keyPoints && (
                    <View style={styles.quickReviewSection}>
                        <Text style={[styles.sectionTitle, themeStyles.textPrimary]}>
                            📋 Key Points
                        </Text>
                        {summaryContent.keyPoints.map((point, index) => (
                            <View key={index} style={styles.quickPointItem}>
                                <View style={styles.pointNumber}>
                                    <Text style={styles.pointNumberText}>{index + 1}</Text>
                                </View>
                                <Text style={[styles.quickPointText, themeStyles.textPrimary]}>
                                    {point}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Essential Concepts */}
                {contentAnalysis?.key_concepts?.length > 0 && (
                    <View style={styles.quickReviewSection}>
                        <Text style={[styles.sectionTitle, themeStyles.textPrimary]}>
                            🎯 Essential Concepts
                        </Text>
                        {contentAnalysis.key_concepts.slice(0, 3).map((concept, index) => (
                            <View key={index} style={styles.quickConceptCard}>
                                <Text style={[styles.quickConceptName, themeStyles.textPrimary]}>
                                    {concept.concept}
                                </Text>
                                <Text style={[styles.quickConceptDef, themeStyles.textSecondary]}>
                                    {concept.definition}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Summary */}
                {summaryContent?.summary && (
                    <View style={styles.quickReviewSection}>
                        <Text style={[styles.sectionTitle, themeStyles.textPrimary]}>
                            📝 Summary
                        </Text>
                        <Text style={[styles.quickSummaryText, themeStyles.textPrimary]}>
                            {summaryContent.summary}
                        </Text>
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={() => setViewMode('listen')}
                    >
                        <FontAwesome5 name="headphones" size={20} color="#FFFFFF" />
                        <Text style={styles.quickActionText}>Listen</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={() => setViewMode('deep_study')}
                    >
                        <FontAwesome5 name="brain" size={20} color="#FFFFFF" />
                        <Text style={styles.quickActionText}>Deep Study</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );

    // Hybrid Mode - Synchronized visual and audio
    const renderHybridMode = () => (
        <View style={styles.contentContainer}>
            {/* Hybrid Controls */}
            <View style={styles.hybridControls}>
                <TouchableOpacity
                    style={[styles.hybridButton, themeStyles.buttonPrimary]}
                    onPress={handleToggleAudio}
                >
                    <FontAwesome5
                        name={isPlaying ? "pause" : "play"}
                        size={20}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>

                <View style={styles.hybridProgress}>
                    <Text style={[styles.hybridProgressText, themeStyles.textSecondary]}>
                        {audioUrl
                            ? `${Math.floor(currentPosition / 60)}:${String(Math.floor(currentPosition % 60)).padStart(2, '0')} / ${Math.floor(audioDuration / 60)}:${String(Math.floor(audioDuration % 60)).padStart(2, '0')}`
                            : 'Audio not ready'
                        }
                    </Text>
                    <View style={styles.hybridProgressBar}>
                        <View style={[
                            styles.hybridProgressFill,
                            { width: audioUrl ? `${(currentPosition / audioDuration) * 100}%` : '0%' }
                        ]} />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.hybridSettingsButton, themeStyles.buttonSecondary]}
                    onPress={() => {
                        Alert.alert('Sync Settings', 'Adjust synchronization between audio and text highlighting');
                    }}
                >
                    <FontAwesome5 name="cog" size={16} color="#D4AF37" />
                </TouchableOpacity>
            </View>

            {/* Synchronized Content */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.contentScroll}
                showsVerticalScrollIndicator={true}
            >
                <View style={styles.hybridTextContainer}>
                    <Text
                        style={[
                            styles.contentText,
                            themeStyles.textPrimary,
                            { fontSize: fontSize, lineHeight: fontSize * 1.8 }
                        ]}
                    >
                        {/* This would render with highlighting synchronized to audio position */}
                        {renderSynchronizedText(material?.extractedText || '', audioSyncPosition)}
                    </Text>
                </View>

                {/* Visual Emphasis Points */}
                {emphasizedSegments.map((segment, index) => (
                    <View
                        key={index}
                        style={[
                            styles.emphasisIndicator,
                            { top: segment.position * 0.05 }
                        ]}
                    >
                        <FontAwesome5
                            name="star"
                            size={12}
                            color="#FFD700"
                        />
                    </View>
                ))}
            </ScrollView>

            {/* Hybrid Features Panel */}
            <View style={styles.hybridFeaturesPanel}>
                <TouchableOpacity
                    style={styles.hybridFeatureButton}
                    onPress={() => {
                        // Highlight current sentence
                        logger.info('Highlight current sentence');
                    }}
                >
                    <FontAwesome5 name="highlighter" size={14} color="#D4AF37" />
                    <Text style={[styles.hybridFeatureText, themeStyles.textSecondary]}>
                        Highlight
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.hybridFeatureButton}
                    onPress={() => {
                        // Replay last 30 seconds
                        setCurrentPosition(Math.max(0, currentPosition - 30));
                    }}
                >
                    <FontAwesome5 name="undo" size={14} color="#D4AF37" />
                    <Text style={[styles.hybridFeatureText, themeStyles.textSecondary]}>
                        Replay
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.hybridFeatureButton}
                    onPress={() => addBookmark(audioSyncPosition)}
                >
                    <FontAwesome5 name="bookmark" size={14} color="#D4AF37" />
                    <Text style={[styles.hybridFeatureText, themeStyles.textSecondary]}>
                        Bookmark
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Helper function to render synchronized text with highlighting
    const renderSynchronizedText = (text, audioPosition) => {
        // This would implement real-time text highlighting based on audio position
        // For now, we'll return the basic text
        return text;
    };

    if (!material) {
        return (
            <SafeAreaView style={[styles.container, themeStyles.container]}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, themeStyles.container]}>
            <LinearGradient colors={themeStyles.headerGradient} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <FontAwesome5 name="arrow-left" size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            {material.title}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {material.type} • {material.characterCount} chars
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.moreButton}>
                        <FontAwesome5 name="ellipsis-v" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <Animatable.View animation="fadeInUp" style={styles.content}>
                {renderModeSelector()}
                <View style={[styles.contentArea, themeStyles.contentBackground, themeStyles.border]}>
                    {renderContent()}
                </View>
            </Animatable.View>

            {/* Add to Playlist Modal */}
            <AddToPlaylistModal
                visible={showAddToPlaylistModal}
                onClose={() => setShowAddToPlaylistModal(false)}
                audioData={{
                    audio_id: material.id,
                    material_id: material.id,
                    title: material.title,
                    duration: audioDuration
                }}
            />
        </SafeAreaView>
    );
};

// ✅ REMOVED: Styles moved to styles/MaterialViewerScreenStyles.ts

export default MaterialViewerScreen;