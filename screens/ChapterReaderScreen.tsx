/**
 * ChapterReaderScreen - Full-screen chapter reading experience
 *
 * Features:
 * - ReaderHeader (sticky at top) with back button, title, circular progress
 * - Chapter content with scrolling (Text or WebView based on content type)
 * - WebView rendering for HTML content with embedded images from EPUBs
 * - Text rendering for plain text content (backward compatible)
 * - Font size controls (small=14, medium=16, large=18) with dynamic HTML resizing
 * - Scroll tracking for progress (debounced sync)
 * - End-of-chapter modal at 92% progress
 * - Chapter prefetching at 90% scroll for seamless navigation
 * - ActionBar (sticky at bottom) with prev/next navigation
 * - Progress syncing to backend
 * - Automatic cleanup on unmount
 *
 * Content Types:
 * - HTML: Rendered in WebView with Alexandria theme styling, supports images
 * - Text: Rendered in Text component for plain text chapters
 *
 * Route Params:
 * - materialId: string - ID of the material
 * - chapterId: string - ID of the chapter
 * - chapterIndex: number - Index of the chapter (0-based)
 * - totalChapters: number - Total number of chapters
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
  Alert,
  Switch,
  SafeAreaView,
  Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { NavigationProp } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '../constants/Colors';
import { useMaterialDetail } from '../hooks/useMaterials';
import { useChapter, prefetchChapter } from '../hooks/useChapter';
import { useProgressSync } from '../hooks/useProgressSync';
import { useChapterArtifact, useGenerateArtifact } from '../hooks/useArtifacts';
import { useChapterQuizResults } from '../hooks/useChapterQuizResults';
import { useBookStudyQuiz } from '../hooks/useBookStudyQuiz';
import { useReadingPreferences } from '../hooks/useReadingPreferences';
import { hasValidEpubCSS } from '../utils/cssSanitizer';
import logger from '../utils/logger';
import ReaderHeader from '../components/materials/ReaderHeader';
import ActionBar from '../components/materials/ActionBar';
import ProgressBar from '../components/materials/ProgressBar';
import ReadingSettingsModal from '../components/materials/ReadingSettingsModal';
import EndOfChapterModal from '../components/materials/EndOfChapterModal';
import ArtifactTabs from '../components/materials/ArtifactTabs';
import SummaryView from '../components/artifacts/SummaryView';
import FlashcardView from '../components/artifacts/FlashcardView';
import QuizView from '../components/artifacts/QuizView';
import AddToPlaylistModal from '../components/materials/AddToPlaylistModal';
import wrapHtmlContentAppleBooks from './AppleBooksStyleWrapper';

interface ChapterReaderScreenProps {
  route: {
    params: {
      materialId: string;
      chapterId: string;
      chapterIndex: number;
      totalChapters: number;
    };
  };
  navigation: NavigationProp<any>;
}

type FontSize = 'small' | 'medium' | 'large';

const FONT_SIZE_MAP: Record<FontSize, number> = {
  small: 14,
  medium: 16,
  large: 18,
};

const ChapterReaderScreen: React.FC<ChapterReaderScreenProps> = ({ route, navigation }) => {
  const { materialId, chapterId, chapterIndex, totalChapters } = route.params;

  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const [activeTab, setActiveTab] = useState<'read' | 'summary' | 'flashcards' | 'quiz'>('read');
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showStyleSettings, setShowStyleSettings] = useState(false);
  const [showReadingSettings, setShowReadingSettings] = useState(false);
  const [showUI, setShowUI] = useState(true);

  const hasShownModal = useRef(false);
  const hasPrefetched = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const uiOpacity = useRef(new Animated.Value(1)).current;

  // Reading preferences (EPUB styling toggle)
  const { preferences, updatePreference, isLoading: preferencesLoading } = useReadingPreferences();

  const themeColors = useMemo(
    () => ({
      background: Colors.background,
      surface: Colors.surface,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      accent: Colors.accent,
      error: Colors.error,
    }),
    []
  );

  // Fetch chapter content (two-step: metadata + S3 content)
  const {
    data: chapterData,
    isLoading: chapterLoading,
    error: chapterError,
  } = useChapter(chapterId);

  // Fetch material details (for navigation)
  const { data: material } = useMaterialDetail(materialId);

  // Progress sync hook
  const { syncProgress, syncImmediately } = useProgressSync();

  // Memoize HTML content for WebView (apply Apple Books styling to sanitized backend HTML)
  const wrappedHtmlContent = useMemo(() => {
    if (!chapterData || chapterData.chapter.content_type !== 'html') {
      return null;
    }

    // Defensive sanitization: Remove any HTML document wrapper tags that may have slipped through
    // This ensures our Apple Books styling wrapper is the ONLY HTML document structure
    // Backend now returns raw EPUB HTML (full documents), so we extract just the body content
    let rawHtml = chapterData.content;

    logger.info('🔍 DEBUG: Raw backend HTML received', {
      contentLength: rawHtml.length,
      startsWithXmlTag: rawHtml.trim().startsWith('<?xml'),
      startsWithDoctype: rawHtml.trim().startsWith('<!DOCTYPE'),
      startsWithHtml: rawHtml.trim().startsWith('<html'),
      startsWithBody: rawHtml.trim().startsWith('<body'),
      startsWithPTag: rawHtml.trim().startsWith('<p'),
      first500chars: rawHtml.substring(0, 500),
    });

    // Multi-pass stripping for robustness (handles nested tags and large head blocks)
    // Pass 1: Remove DOCTYPE
    rawHtml = rawHtml.replace(/<!DOCTYPE[^>]*>/gi, '');

    // Pass 2: Extract content between <body> tags if present, otherwise use full content
    const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      rawHtml = bodyMatch[1]; // Extract just the body content
      logger.info('✅ Extracted content from <body> tags');
    } else {
      // No body tags, clean up html/head tags manually
      rawHtml = rawHtml
        .replace(/<html[^>]*>/gi, '')
        .replace(/<\/html>/gi, '')
        .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
      logger.info('⚠️ No <body> tags found, manually cleaned html/head tags');
    }

    rawHtml = rawHtml.trim();

    logger.info('🔍 DEBUG: Cleaned HTML before wrapping', {
      cleanedLength: rawHtml.length,
      first300chars: rawHtml.substring(0, 300),
    });

    // Apply frontend wrapper with dynamic theme colors, font size, and optional EPUB styles
    const wrapped = wrapHtmlContentAppleBooks(
      rawHtml,
      fontSize,
      themeColors,
      chapterData.epub_styles,
      preferences.useOriginalStyles
    );

    logger.info('🔍 DEBUG: Final wrapped HTML for WebView', {
      wrappedLength: wrapped.length,
      startsWithDoctype: wrapped.trim().startsWith('<!DOCTYPE'),
      startsWithHtml: wrapped.trim().startsWith('<html'),
      containsBody: wrapped.includes('<body'),
      first500chars: wrapped.substring(0, 500),
    });

    return wrapped;
  }, [
    chapterData?.content,
    chapterData?.chapter.content_type,
    chapterData?.epub_styles,
    fontSize,
    themeColors,
    preferences.useOriginalStyles,
  ]);

  // Chapter quiz results
  const { hasPassedChapterQuiz } = useChapterQuizResults(materialId);
  const hasPassedQuiz = hasPassedChapterQuiz(chapterIndex);
  const isLastChapter = chapterIndex === totalChapters - 1;

  // Book Study quiz generation
  const { generateQuiz, isGenerating: isGeneratingQuiz, error: quizError, retry: retryQuiz } = useBookStudyQuiz(materialId);

  // Artifact hooks
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useChapterArtifact(chapterId, 'summary', activeTab === 'summary');

  const {
    data: flashcards,
    isLoading: flashcardsLoading,
    error: flashcardsError,
  } = useChapterArtifact(chapterId, 'flashcards', activeTab === 'flashcards');

  const {
    data: quiz,
    isLoading: quizLoading,
    error: quizArtifactError,
  } = useChapterArtifact(chapterId, 'quiz', activeTab === 'quiz');

  const generateArtifact = useGenerateArtifact();

  // Handle scroll tracking
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const scrollPosition = contentOffset.y;
      const maxScroll = contentSize.height - layoutMeasurement.height;

      // Prevent division by zero
      if (maxScroll <= 0) {
        setScrollPercentage(0);
        return;
      }

      const scrollPct = (scrollPosition / maxScroll) * 100;
      const clampedPct = Math.min(Math.max(scrollPct, 0), 100);

      setScrollPercentage(clampedPct);
      setLastScrollPosition(Math.floor(scrollPosition));

      // Trigger end-of-chapter modal at 92%
      if (clampedPct >= 92 && !hasShownModal.current) {
        setShowEndModal(true);
        hasShownModal.current = true;
      }

      // Prefetch next chapter around 90% scroll
      if (clampedPct >= 90 && !hasPrefetched.current && material && chapterIndex < totalChapters - 1) {
        const nextChapterId = material.chapters[chapterIndex + 1]?.id;
        if (nextChapterId) {
          hasPrefetched.current = true;
          prefetchChapter(nextChapterId);
          logger.info('Prefetching next chapter', {
            currentChapterId: chapterId,
            nextChapterId,
            scrollPercentage: clampedPct
          });
        }
      }

      // Debounced sync (5 seconds)
      syncProgress(materialId, chapterIndex, clampedPct / 100, Math.floor(scrollPosition));
    },
    [materialId, chapterIndex, syncProgress, material, totalChapters, chapterId, queryClient]
  );

  // Fade-in animation when chapter loads
  useEffect(() => {
    if (chapterData) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [chapterData, fadeAnim]);

  // Reset prefetch flag and scroll to top when chapter changes
  useEffect(() => {
    hasPrefetched.current = false;
    hasShownModal.current = false;

    // Reset fade animation for new chapter
    fadeAnim.setValue(0);

    // Auto-scroll to top when new chapter loads
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
      setScrollPercentage(0);
      logger.info('Auto-scrolled to top of new chapter', { chapterId });
    }
  }, [chapterId, fadeAnim]);

  // Immediate sync on unmount
  useEffect(() => {
    return () => {
      logger.info('Syncing progress on unmount', {
        chapterIndex,
        scrollPercentage,
        lastScrollPosition,
      });
      syncImmediately(materialId, chapterIndex, scrollPercentage / 100, lastScrollPosition);
    };
  }, [materialId, chapterIndex, scrollPercentage, lastScrollPosition, syncImmediately]);

  // Handle font size change
  const handleFontSizeChange = useCallback((size: FontSize) => {
    setFontSize(size);
    logger.info('Font size changed', { size });
  }, []);

  // Handle back press
  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Navigate to previous chapter
  const goToPrevChapter = useCallback(() => {
    if (chapterIndex > 0 && material) {
      const prevChapter = material.chapters[chapterIndex - 1];
      logger.info('Navigating to previous chapter', {
        chapterId: prevChapter.id,
        chapterIndex: chapterIndex - 1,
      });

      navigation.navigate('ChapterReader', {
        materialId,
        chapterId: prevChapter.id,
        chapterIndex: chapterIndex - 1,
        totalChapters,
      });
    }
  }, [chapterIndex, material, materialId, totalChapters, navigation]);

  // Navigate to next chapter
  const goToNextChapter = useCallback(() => {
    if (!material || !material.chapters) {
      logger.warn('Material not ready, cannot navigate to next chapter');
      return;
    }

    if (chapterIndex < totalChapters - 1) {
      const nextChapter = material.chapters[chapterIndex + 1];
      if (!nextChapter) {
        logger.error('Next chapter undefined', { chapterIndex, totalChapters });
        return;
      }

      logger.info('Navigating to next chapter', {
        chapterId: nextChapter.id,
        chapterIndex: chapterIndex + 1,
      });

      // Small delay to prevent WebView teardown conflict & rate-limit spam
      setTimeout(() => {
        navigation.navigate('ChapterReader', {
          materialId,
          chapterId: nextChapter.id,
          chapterIndex: chapterIndex + 1,
          totalChapters,
        });
      }, 200);
    } else {
      logger.info('Already at last chapter');
    }
  }, [chapterIndex, totalChapters, material, materialId, navigation]);

  // Handle next chapter from modal
  const handleNextChapter = useCallback(() => {
    setShowEndModal(false);
    goToNextChapter();
  }, [goToNextChapter]);

  // Handle return to book from modal
  const handleReturnToBook = useCallback(() => {
    setShowEndModal(false);
    navigation.navigate('BookDetail', { materialId });
  }, [materialId, navigation]);

  // Handle artifact generation
  const handleGenerateArtifact = useCallback(
    (artifactType: 'summary' | 'flashcards' | 'quiz') => {
      logger.info('Generating artifact', { chapterId, artifactType });
      generateArtifact.mutate(
        { chapterId, artifactType },
        {
          onSuccess: () => {
            logger.success('Artifact generated', { artifactType });
          },
          onError: (error) => {
            logger.error('Failed to generate artifact', { artifactType, error });
            Alert.alert(
              'Generation Failed',
              `Failed to generate ${artifactType}. Please try again.`,
              [{ text: 'OK' }]
            );
          },
        }
      );
    },
    [chapterId, generateArtifact]
  );

  // Handle retry for errors
  const handleRetryArtifact = useCallback(
    (artifactType: 'summary' | 'flashcards' | 'quiz') => {
      handleGenerateArtifact(artifactType);
    },
    [handleGenerateArtifact]
  );

  // Handle playlist success
  const handlePlaylistSuccess = useCallback(
    (playlistId: string, playlistName: string) => {
      logger.success('Chapter added to playlist', { playlistId, playlistName });
      Alert.alert(
        'Added to Playlist',
        `Chapter added to "${playlistName}" successfully!`,
        [{ text: 'OK' }]
      );
    },
    []
  );

  // Handle tap to toggle UI visibility
  const handleContentTap = useCallback(() => {
    const newShowUI = !showUI;
    setShowUI(newShowUI);

    Animated.timing(uiOpacity, {
      toValue: newShowUI ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    logger.info('UI visibility toggled', { showUI: newShowUI });
  }, [showUI, uiOpacity]);

  // Handle start quiz - Generate directly from chapter content
  const handleStartQuiz = useCallback(async () => {
    logger.info('Starting chapter quiz generation', {
      materialId,
      chapterId,
      chapterIndex,
      chapterTitle: chapterData?.chapter.title,
    });

    // Generate quiz from chapter content using dedicated Book Study API
    const quizData = await generateQuiz(chapterId);

    if (quizData) {
      logger.success('Quiz generated, navigating to QuizScreen', {
        questionCount: quizData.questions.length,
        chapterId,
      });

      // Navigate to QuizScreen with generated quiz
      navigation.navigate('QuizScreen', {
        quiz: quizData.questions,
        source: 'book_study',
        materialId,
        chapterId,
        chapterIndex,
        chapterTitle: chapterData?.chapter.title,
        metadata: quizData.metadata,
      });
    } else {
      logger.error('Quiz generation returned no data');
      // Error is already displayed via quizError state
    }
  }, [materialId, chapterId, chapterIndex, chapterData, generateQuiz, navigation]);

  // Loading state
  if (chapterLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.accent} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
          Loading chapter...
        </Text>
      </View>
    );
  }

  // Error state
  if (chapterError || !chapterData) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <FontAwesome5 name="exclamation-triangle" size={64} color={themeColors.error} />
        <Text style={[styles.errorTitle, { color: themeColors.text }]}>
          Failed to load chapter
        </Text>
        <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>
          {chapterError instanceof Error
            ? chapterError.message
            : 'An unexpected error occurred'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: themeColors.accent }]}
          onPress={handleBackPress}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="arrow-left" size={16} color={Colors.white} style={styles.retryIcon} />
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Reader Header (with fade animation) */}
        <Animated.View style={{ opacity: uiOpacity }}>
          <ReaderHeader
            chapterTitle={chapterData.chapter.title}
            readPercentage={scrollPercentage}
            onBackPress={handleBackPress}
          />
        </Animated.View>

        {/* Scroll Shadow - Top */}
        {scrollPercentage > 5 && (
          <Animated.View
            style={[
              styles.scrollShadowTop,
              { opacity: uiOpacity },
            ]}
          />
        )}

        {/* Chapter Content (with fade-in animation) */}
        <Animated.View style={[styles.contentWrapper, { opacity: fadeAnim }]}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={100}
            showsVerticalScrollIndicator={true}
            contentInsetAdjustmentBehavior="automatic"
          >
            <TouchableOpacity activeOpacity={1} onPress={handleContentTap}>
              <View style={[styles.contentContainer, { backgroundColor: themeColors.surface }]}>
                {(() => {
                  logger.info('🔍 DEBUG: Content rendering decision', {
                    contentType: chapterData.chapter.content_type,
                    hasWrappedHtml: !!wrappedHtmlContent,
                    wrappedHtmlLength: wrappedHtmlContent?.length || 0,
                    willRenderWebView: chapterData.chapter.content_type === 'html',
                  });
                  return null;
                })()}
                {chapterData.chapter.content_type === 'html' ? (
                  <WebView
                    key={`chapter-${chapterId}-${fontSize}-${themeColors.text}-${themeColors.surface}-${preferences.useOriginalStyles}`}
                    source={{ html: wrappedHtmlContent || '' }}
                    style={styles.webView}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    originWhitelist={['*']}
                    scalesPageToFit={false}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    onMessage={() => {}}
                    onLoadStart={() => {
                      logger.info('🔄 WebView loading started', { chapterId });
                    }}
                    onLoadEnd={() => {
                      logger.info('✅ WebView loading completed successfully', { chapterId });
                    }}
                    onError={(syntheticEvent) => {
                      const { nativeEvent } = syntheticEvent;
                      logger.error('❌ WebView error', {
                        error: nativeEvent,
                        chapterId,
                        description: nativeEvent.description || 'Unknown error'
                      });
                    }}
                    onHttpError={(syntheticEvent) => {
                      const { nativeEvent } = syntheticEvent;
                      logger.error('❌ WebView HTTP error', {
                        statusCode: nativeEvent.statusCode,
                        url: nativeEvent.url,
                        chapterId
                      });
                    }}
                    startInLoadingState={true}
                    renderLoading={() => (
                      <View style={styles.webViewLoading}>
                        <ActivityIndicator size="large" color={themeColors.accent} />
                        <Text style={[styles.loadingText, { color: themeColors.textSecondary, marginTop: 12 }]}>
                          Rendering chapter...
                        </Text>
                      </View>
                    )}
                  />
                ) : (
                  <Text
                    style={[
                      styles.chapterText,
                      {
                        fontSize: FONT_SIZE_MAP[fontSize],
                        color: themeColors.text,
                      },
                    ]}
                  >
                    {chapterData.content}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

        {/* EPUB Style Toggle - Show if chapter has EPUB styles */}
        {chapterData?.epub_styles && hasValidEpubCSS(chapterData.epub_styles) && (
          <View style={[styles.styleToggleContainer, { backgroundColor: themeColors.background }]}>
            <View style={styles.styleToggleContent}>
              <View style={styles.styleToggleInfo}>
                <FontAwesome5
                  name="palette"
                  size={18}
                  color={themeColors.accent}
                  style={styles.styleToggleIcon}
                />
                <View style={styles.styleToggleTextContainer}>
                  <Text style={[styles.styleToggleLabel, { color: themeColors.text }]}>
                    Use Book's Original Styling
                  </Text>
                  <Text style={[styles.styleToggleDescription, { color: themeColors.textSecondary }]}>
                    See the publisher's original typography and layout
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.useOriginalStyles}
                onValueChange={(value) => {
                  updatePreference({ useOriginalStyles: value });
                  logger.info('Reading style preference changed', {
                    useOriginalStyles: value,
                    chapterId,
                  });
                }}
                trackColor={{ false: '#767577', true: themeColors.accent }}
                thumbColor={preferences.useOriginalStyles ? '#f4f3f4' : '#f4f3f4'}
                ios_backgroundColor="#767577"
              />
            </View>
          </View>
        )}

        {/* Quiz Button - Show if not last chapter */}
        {!isLastChapter && !hasPassedQuiz && (
          <View style={styles.quizButtonContainer}>
            {isGeneratingQuiz ? (
              <View style={[styles.quizButton, { backgroundColor: themeColors.surface }]}>
                <ActivityIndicator size="small" color={themeColors.accent} />
                <Text style={[styles.quizButtonText, { color: themeColors.text }]}>
                  Generating your quiz from chapter content...
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.quizButton, { backgroundColor: Colors.accent }]}
                onPress={handleStartQuiz}
                activeOpacity={0.8}
                disabled={isGeneratingQuiz}
              >
                <FontAwesome5 name="clipboard-list" size={20} color={Colors.white} />
                <Text style={styles.quizButtonText}>
                  Take Quiz to Unlock Next Chapter
                </Text>
              </TouchableOpacity>
            )}

            {/* Quiz generation error */}
            {quizError && !isGeneratingQuiz && (
              <View style={styles.quizErrorContainer}>
                <Text style={[styles.quizErrorText, { color: themeColors.error }]}>
                  {quizError}
                </Text>
                <TouchableOpacity
                  style={[styles.retryQuizButton, { backgroundColor: themeColors.accent }]}
                  onPress={() => retryQuiz(chapterId)}
                  activeOpacity={0.8}
                >
                  <FontAwesome5 name="redo" size={14} color={Colors.white} />
                  <Text style={styles.retryQuizText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Quiz Completion Badge */}
        {!isLastChapter && hasPassedQuiz && (
          <View style={styles.quizCompletionContainer}>
            <View style={[styles.quizCompletionBadge, { backgroundColor: Colors.success }]}>
              <FontAwesome5 name="check-circle" size={16} color={Colors.white} />
              <Text style={styles.quizCompletionText}>
                Quiz Passed • Next Chapter Unlocked
              </Text>
            </View>
          </View>
        )}

            {/* Bottom padding for ActionBar */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </Animated.View>

        {/* Scroll Shadow - Bottom */}
        {scrollPercentage < 95 && (
          <Animated.View
            style={[
              styles.scrollShadowBottom,
              { opacity: uiOpacity },
            ]}
          />
        )}

        {/* Floating "Aa" Settings Button */}
        <Animated.View style={{ opacity: uiOpacity }}>
          <TouchableOpacity
            style={[styles.floatingButton, { backgroundColor: themeColors.accent }]}
            onPress={() => setShowReadingSettings(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.floatingButtonText}>Aa</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Reading Progress Bar */}
        <Animated.View style={{ opacity: uiOpacity }}>
          <ProgressBar progress={scrollPercentage} showPercentage={true} />
        </Animated.View>

        {/* Action Bar */}
        <Animated.View style={{ opacity: uiOpacity }}>
          <ActionBar
            onPrevChapter={goToPrevChapter}
            onNextChapter={goToNextChapter}
            onFontSizeChange={handleFontSizeChange}
            currentFontSize={fontSize}
            hasPrevChapter={chapterIndex > 0}
            hasNextChapter={chapterIndex < totalChapters - 1}
          />
        </Animated.View>

      {/* Reading Settings Modal */}
      <ReadingSettingsModal
        visible={showReadingSettings}
        onClose={() => setShowReadingSettings(false)}
        currentFontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
        hasEpubStyles={!!chapterData?.epub_styles && hasValidEpubCSS(chapterData.epub_styles)}
        useOriginalStyles={preferences.useOriginalStyles}
        onStylePreferenceChange={(value) => {
          updatePreference({ useOriginalStyles: value });
          logger.info('EPUB style preference changed from modal', { useOriginalStyles: value });
        }}
      />

      {/* End of Chapter Modal */}
      <EndOfChapterModal
        visible={showEndModal}
        chapterTitle={chapterData.chapter.title}
        hasNextChapter={chapterIndex < totalChapters - 1}
        onNextChapter={handleNextChapter}
        onReturnToBook={handleReturnToBook}
        onClose={() => setShowEndModal(false)}
      />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollShadowTop: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    height: 20,
    zIndex: 5,
    backgroundColor: 'rgba(0,0,0,0.08)',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scrollShadowBottom: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    height: 30,
    zIndex: 5,
    backgroundColor: 'rgba(0,0,0,0.08)',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    minHeight: '100%',
  },
  chapterText: {
    lineHeight: 28,
    letterSpacing: 0.3,
    fontWeight: '400',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
    minHeight: 400,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  bottomSpacer: {
    height: 120,
  },
  quizButtonContainer: {
    padding: 20,
    paddingTop: 30,
    backgroundColor: Colors.background,
  },
  quizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quizButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  quizCompletionContainer: {
    padding: 20,
    paddingTop: 20,
    backgroundColor: Colors.background,
  },
  quizCompletionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  quizCompletionText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  quizErrorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.errorBackground || '#FEE',
    borderRadius: 8,
    alignItems: 'center',
  },
  quizErrorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryQuizText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  styleToggleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 8,
  },
  styleToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  styleToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  styleToggleIcon: {
    marginRight: 12,
  },
  styleToggleTextContainer: {
    flex: 1,
  },
  styleToggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  styleToggleDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9,
  },
  floatingButtonText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
});

export default ChapterReaderScreen;
