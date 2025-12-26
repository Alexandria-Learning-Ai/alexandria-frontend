import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as Animatable from "react-native-animatable";
import QuizLoadingScreen from "../components/QuizLoadingScreen";
import {
	View,
	Text,
	Alert,
	FlatList,
	TouchableOpacity,
	Animated,
	Dimensions,
	Modal,
	TextInput,
	ScrollView,
	Platform,
	Vibration,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Slider from "@react-native-community/slider";
import { auth } from "../firebaseConfig";
import { API_BASE_URL } from "../config/api";
import SubjectSelector from "../components/SubjectSelector";
import HierarchicalSubjectService from "../services/HierarchicalSubjectService";
import { useTranslation } from "react-i18next";
import logger from "../utils/logger";
import { styles } from "../styles/UploadScreenStyles";
import QuizConfigModal from "@/components/upload/QuizConfigModal";
import CustomDropdown from "../components/shared/CustomDropdown";
import { predefinedSubjects, quizTypeOptions, difficultyOptions } from "../constants/uploadOptions";
import UploadHeader from "../components/upload/UploadHeader";
import FileUploadButton from "../components/upload/FileUploadButton";
import DragDropZone from "../components/upload/DragDropZone";
import UploadPurposeToggle from "../components/upload/UploadPurposeToggle";
import QuizConfiguration from "../components/upload/QuizConfiguration";
import StudyModeToggle from "../components/upload/StudyModeToggle";
import GenerateButton from "../components/upload/GenerateButton";
import UploadProgressBar from "../components/upload/UploadProgressBar";
import AsyncQuizProgress from "../components/upload/AsyncQuizProgress";
import ResponseMessage from "../components/upload/ResponseMessage";
import FileListItem from "../components/upload/FileListItem";
import EmptyFilesList from "../components/upload/EmptyFilesList";
import FreshnessIndicator from "../components/upload/FreshnessIndicator";
import SubjectSelectorSection from "../components/upload/SubjectSelectorSection";
import CourseSelectionToggle from "../components/ask-alexandria/CourseSelectionToggle";
import ProfileCourseSelector from "../components/ask-alexandria/ProfileCourseSelector";
import HierarchicalCourseSelector from "../components/ask-alexandria/HierarchicalCourseSelector";
import QuickQuizButton from "../components/upload/QuickQuizButton";
import UploadConfigurationForm from "../components/upload/UploadConfigurationForm";
import UploadProgressSection from "../components/upload/UploadProgressSection";
import { useFileUpload } from "../hooks/useFileUpload";
import { useUploadHandler } from "../hooks/useUploadHandler";
import { useQuizGeneration } from "../hooks/useQuizGeneration";
import { useAsyncQuizGeneration } from "../hooks/useAsyncQuizGeneration";
import { useSubjectValidation } from "../hooks/useSubjectValidation";
import { useHierarchicalCourses } from "../hooks/useHierarchicalCourses";
import { useFileAnalysis } from "../hooks/useFileAnalysis";
import { useOnboarding } from "../contexts/OnboardingContext";
import OnboardingTooltip from "../components/onboarding/OnboardingTooltip";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { StudentProfileService } from "@/services/StudentProfileService";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/index';
import type {
	UploadPurpose,
	VisualEnhancement,
	DifficultyLevel,
	QuizType,
	SelectedSubject,
	SelectedCourse,
	UIState,
	ThemeColors,
} from '../types/upload.types';

// Type definitions for UploadScreen
type UploadScreenProps = NativeStackScreenProps<RootStackParamList, 'Upload'>;

interface UploadScreenComponentProps {
	navigation: UploadScreenProps['navigation'];
	route?: UploadScreenProps['route'];
}

// File with path interface for drag & drop
interface FileWithPath extends File {
	path?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// ✅ REMOVED: CustomDropdown component moved to components/upload/CustomDropdown.tsx

// ✅ REMOVED: predefinedSubjects moved to constants/uploadOptions.ts

export default function UploadScreen({ navigation, route }: UploadScreenComponentProps) {
	const { t, i18n } = useTranslation();
	const [configModalVisible, setConfigModalVisible] = useState<boolean>(false);

	// Safety wrapper for translations to prevent undefined rendering
	const safeT = (key: string, options?: Record<string, any>): string => {
		const translation = t(key, options);
		return (typeof translation === 'string' ? translation : key) || key;
	};

	// ✅ Custom Hooks
	const {
		files,
		setFiles,
		pickFromGallery,
		pickDocument,
		handleSelectFiles,
		removeFile: removeFileOriginal,
		getFileIcon,
	} = useFileUpload(t, async (newFiles) => {
		// Analyze files after mobile selection
		if (uploadPurpose === "quiz" && newFiles.length > 0) {
			const currentUserId = auth.currentUser?.uid;
			if (!currentUserId) {
				safeAlert("Sign In Required", "Please sign in to generate personalized quizzes");
				return;
			}
			logger.info("🔍 Analyzing file for Smart Defaults (mobile)...");
			try {
				await analyzeFile(newFiles[0], currentUserId);
				setShowQuickQuiz(true);
			} catch (error) {
				logger.error("❌ Analysis failed:", error);
			}
		}
	});

	const {
		isUploading: uploadingFromHook,
		responseText: responseTextFromHook,
		setResponseText: setResponseTextFromHook,
		showFreshnessIndicator: showFreshnessFromHook,
		uploadFile,
		resetUploadState,
	} = useUploadHandler();

	const { responseText, setResponseText, handleQuizGeneration } = useQuizGeneration();

	// ✅ NEW: Async quiz generation hook
	const {
		isGenerating: isAsyncGenerating,
		progress: asyncProgress,
		stage: asyncStage,
		message: asyncMessage,
		quizId: asyncQuizId,
		error: asyncError,
		generateQuizAsync,
		cancelGeneration,
	} = useAsyncQuizGeneration();

	const {
		selectedSubject,
		setSelectedSubject,
		subjectValidation,
		validatingSubject,
		handleSubjectSelect,
		clearSelectedSubject,
	} = useSubjectValidation();

	const {
		userCourses,
		hasProfileCourses,
		selectedCourse,
		setSelectedCourse,
		courseSelectionMode,
		setCourseSelectionMode,
		availableSubjects,
		selectedHierarchicalSubject,
		setSelectedHierarchicalSubject,
		availableCourses,
		selectedHierarchicalCourse,
		setSelectedHierarchicalCourse,
		handleHierarchicalSubjectSelect,
		handleHierarchicalCourseSelect,
	} = useHierarchicalCourses();

	// ✅ NEW: Smart Defaults / Quick Quiz hook
	const {
		defaults: smartDefaults,
		loading: analyzingFile,
		error: analysisError,
		analyzeFile,
		resetAnalysis,
		hasHighConfidence,
	} = useFileAnalysis();

	// ✅ NEW: Onboarding hook
	const { isFirstTime, markAsComplete } = useOnboarding();

	// Consolidated state to prevent flashing
	const [uiState, setUiState] = useState<UIState>({
		uploading: false,
		isDarkMode: false,
		showFreshnessIndicator: false,
		isTransitioning: false,
	});

	// ✅ NEW: Subject selector states
	const [subjectSelectorVisible, setSubjectSelectorVisible] = useState<boolean>(false);

	// ✅ NEW: Ask Alexandria state variables
	const [topic, setTopic] = useState<string>("");
	const [subject, setSubject] = useState<string>("");
	const [quizTypes, setQuizTypes] = useState<QuizType[]>(["all"]);
	const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
	const [numQuestions, setNumQuestions] = useState<number>(10);
	const [details, setDetails] = useState<string>("");

	// Modal states - simplified
	const [courseModalVisible, setCourseModalVisible] = useState<boolean>(false);
	const [quizTypeModalVisible, setQuizTypeModalVisible] = useState<boolean>(false);
	const [difficultyModalVisible, setDifficultyModalVisible] = useState<boolean>(false);
	const [hierarchicalCourseModalVisible, setHierarchicalCourseModalVisible] = useState<boolean>(false);

	// ✅ REMOVED: quizTypeOptions and difficultyOptions moved to constants/uploadOptions.ts

	// ✅ REMOVED: The inline options arrays - now imported from constants

	logger.info("🔧 Direct config check - API_BASE_URL:", API_BASE_URL);

	// ✅ NEW: Visual enhancement preference
	const [visualEnhancement, setVisualEnhancement] = useState<VisualEnhancement>("auto");

	// ✅ NEW: Text extraction states for Study Reformatter + Reader foundation
	const [extractedText, setExtractedText] = useState<string>("");
	const [textExtractionProgress, setTextExtractionProgress] = useState<number>(0);
	const [extractionQuality, setExtractionQuality] = useState<number | null>(null);
	const [showTextPreview, setShowTextPreview] = useState<boolean>(false);
	const [enableStudyMode, setEnableStudyMode] = useState<boolean>(true);

	// ✅ NEW: Upload purpose selection - Study vs Quiz
	const [uploadPurpose, setUploadPurpose] = useState<UploadPurpose>("study");

	// ✅ NEW: Async mode toggle (default to async for better UX)
	const [useAsyncMode, setUseAsyncMode] = useState<boolean>(true);

	// ✅ NEW: Quick Quiz flow state
	const [showQuickQuiz, setShowQuickQuiz] = useState<boolean>(false);

	// Smooth animation refs
	const uploadProgress = useRef(new Animated.Value(0)).current;
	const containerAnim = useRef(new Animated.Value(1)).current;
	const slideAnim = useRef(new Animated.Value(0)).current;

	// ✅ NEW: Track component mount state to prevent navigation race conditions
	const isMountedRef = useRef<boolean>(true);

	useEffect(() => {
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// ✅ NEW: Safe navigation wrapper
	const safeNavigate = useCallback(<RouteName extends keyof RootStackParamList>(
		routeName: RouteName,
		params?: RootStackParamList[RouteName]
	): boolean => {
		if (!isMountedRef.current) {
			logger.debug(`Navigation cancelled - component unmounted: ${String(routeName)}`);
			return false;
		}

		try {
			navigation.navigate(routeName as any, params as any);
			return true;
		} catch (error) {
			logger.error('Navigation failed:', error);
			return false;
		}
	}, [navigation]);

	// ✅ NEW: Safe alert wrapper
	const safeAlert = useCallback((
		title: string,
		message: string,
		buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>
	): void => {
		if (!isMountedRef.current) {
			logger.debug(`Alert cancelled - component unmounted: ${title}`);
			return;
		}
		Alert.alert(title, message, buttons);
	}, []);

	// Memoized theme colors
	const themeColors = useMemo<ThemeColors>(() => {
		// ✅ Updated to match AskAlexandriaScreen theme
		return {
			background: "#1A2C5B",
			backgroundSecondary: "#2C467D",
			surface: "#2C467D",
			surfaceSecondary: "#34495E",
			glass: "rgba(44, 70, 125, 0.8)",
			text: "#F8F4E3",
			textSecondary: "#CBD5E0",
			textTertiary: "#9CA3AF",
			alexandriaGold: "#D4AF37",
			alexandriaBronze: "#B8941F",
			alexandriaNavy: "#1A2C5B",
			border: "rgba(212, 175, 55, 0.3)",
			borderSecondary: "rgba(248, 244, 227, 0.2)",
			success: "#28a745",
			error: "#dc3545",
			warning: "#FFD700",
			shadow: "#D4AF37",
		};
	}, []);

	// Smooth container animation on mount and load user courses
	useEffect(() => {
		Animated.spring(containerAnim, {
			toValue: 1,
			tension: 80,
			friction: 10,
			useNativeDriver: true,
		}).start();
	}, []);

	// ✅ NEW: Handle quiz navigation when async generation completes
	useEffect(() => {
		if (asyncQuizId) {
			logger.info("✅ Async quiz complete! Navigating to QuizScreen with ID:", asyncQuizId);

			// Animate out
			Animated.timing(containerAnim, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}).start(({ finished }) => {
				if (finished && isMountedRef.current) {
					try {
						// Clean up files and subject
						files.forEach(cleanupBlobUrl);
						setFiles([]);
						clearSelectedSubject();

						// Navigate to QuizScreen with quiz ID
						const navigated = safeNavigate("QuizScreen", {
							quizId: asyncQuizId,
							source: "Upload",
							metadata: {
								title: "Alexandria Trial of Wisdom",
								category: selectedCourse?.name || selectedSubject?.name || "Document Study",
								course: selectedCourse?.name,
								subject:
									selectedHierarchicalSubject || selectedCourse?.subject || selectedSubject?.name,
								topic: selectedHierarchicalCourse || selectedCourse?.name,
								manualSubject: selectedSubject,
								subjectKey: selectedSubject?.key,
								subjectType: selectedSubject?.type,
								subjectValidation: subjectValidation,
								hierarchical: {
									enabled: courseSelectionMode === "hierarchical",
									subject: selectedHierarchicalSubject,
									course: selectedHierarchicalCourse,
									source: selectedCourse?.source || "profile",
								},
							},
						});

						// Show success message after navigation
						if (navigated) {
							setTimeout(() => {
								safeAlert(
									"Your Quiz is Ready!",
									"Your personalized quiz is ready. Ready to test your knowledge?"
								);
							}, 300);
						} else {
							logger.warn('Failed to navigate to QuizScreen after animation');
						}
					} catch (navError) {
						logger.error("❌ Navigation error:", navError);
					}
				}
			});
		}
	}, [asyncQuizId]);

	// ✅ NEW: Handle async generation errors
	useEffect(() => {
		if (asyncError) {
			safeAlert("Quiz Generation Failed", asyncError, [
				{
					text: "Try Again",
					onPress: () => {
						// User can try again
					},
				},
				{
					text: "Got It",
					style: "cancel",
				},
			]);
		}
	}, [asyncError]);

	// Smooth upload progress animation
	useEffect(() => {
		if (uiState.uploading) {
			const progressAnimation = Animated.loop(
				Animated.timing(uploadProgress, {
					toValue: 1,
					duration: 3000,
					useNativeDriver: false,
				})
			);
			progressAnimation.start();
			return () => progressAnimation.stop();
		} else {
			uploadProgress.setValue(0);
		}
	}, [uiState.uploading]);

	// ✅ NEW: Get smart description for visual enhancement
	const getVisualEnhancementDescription = useCallback(
		(mode: VisualEnhancement): string => {
			if (!selectedSubject) {
				return "Automatically adds visual elements based on subject and content";
			}

			const visualSubjects = [
				"Database Science",
				"Mathematics",
				"Statistics",
				"Physics",
				"Calculus",
			];
			const isVisualSubject = visualSubjects.some((subject) =>
				selectedSubject.name?.toLowerCase().includes(subject.toLowerCase())
			);

			if (isVisualSubject) {
				return `Great for ${selectedSubject.name} - adds visual elements to ~60% of relevant questions`;
			} else {
				return "Adds visual elements when helpful for understanding concepts (~15% of questions)";
			}
		},
		[selectedSubject]
	);

	// ✅ REMOVED: File picker functions moved to useFileUpload hook

	// ✅ NEW: Handle file dropped from DragDropZone for when I make website for Tee (web only)
	const handleFileDropped = useCallback(
		async (file: FileWithPath): Promise<void> => {
			logger.info("File dropped via drag & drop:", {
				name: file.name,
				size: file.size,
				type: file.type,
			});

			// Convert File object to our internal file format
			const fileObject = {
				uri: URL.createObjectURL(file),
				name: file.name,
				mimeType: file.type,
				size: file.size,
				// Store the actual File object for upload
				webFile: file,
			};

			// Add to files array
			setFiles([fileObject]);
			Vibration.vibrate(50);

			logger.info("File added successfully via drag & drop");

			// ✅ NEW: Analyze file for Smart Defaults (only for quiz purpose)
			if (uploadPurpose === "quiz") {
				// ✅ FIX: Check authentication before analyzing file
				const currentUserId = auth.currentUser?.uid;
				if (!currentUserId) {
					safeAlert(
						"Sign In Required",
						"Please sign in to generate personalized quizzes and track your progress",
						[
							{ text: "Not Now", style: "cancel" },
							{ text: "Sign In", onPress: () => safeNavigate("Login") },
						]
					);
					return;
				}

				logger.info("🔍 Analyzing file for Smart Defaults...");
				await analyzeFile(file, currentUserId);
				setShowQuickQuiz(true);
			}
		},
		[setFiles, uploadPurpose, analyzeFile]
	);

	// ✅ FIX: Cleanup blob URLs to prevent memory leaks
	useEffect(() => {
		// Cleanup function to revoke object URLs when files change or component unmounts
		return () => {
			files.forEach((file) => {
				if (file.uri && file.uri.startsWith("blob:")) {
					URL.revokeObjectURL(file.uri);
					logger.debug("Revoked blob URL:", file.uri);
				}
			});
		};
	}, [files]);

	// ✅ NEW: Helper function to cleanup blob URLs
	const cleanupBlobUrl = useCallback((file: { uri?: string; name?: string }) => {
		if (Platform.OS === 'web' && file.uri?.startsWith("blob:")) {
			try {
				URL.revokeObjectURL(file.uri);
				logger.debug(`🧹 Cleaned up blob URL for: ${file.name}`);
			} catch (error) {
				logger.error('Failed to revoke blob URL:', error);
			}
		}
	}, []);

	// ✅ NEW: Wrapped removeFile function with blob URL cleanup
	const removeFile = useCallback((fileName: string) => {
		// Find the file before removing to cleanup its blob URL
		const fileToRemove = files.find((file) => file.name === fileName);
		if (fileToRemove) {
			cleanupBlobUrl(fileToRemove);
		}
		// Call original remove function
		removeFileOriginal(fileName);
	}, [files, cleanupBlobUrl, removeFileOriginal]);

	// ✅ REMOVED: No longer needed - backend /study/extract-text endpoint now handles both extraction AND storage

	// ✅ NEW: Handle Quick Quiz generation (one-tap with smart defaults)
	const handleQuickQuiz = useCallback(async () => {
		if (!smartDefaults || !files.length) {
			logger.warn("Quick Quiz attempted without smart defaults or files");
			return;
		}

		logger.info("🚀 Quick Quiz: Generating with smart defaults", {
			subject: smartDefaults.subject.name,
			difficulty: smartDefaults.difficulty,
			numQuestions: smartDefaults.num_questions,
		});

		// Hide Quick Quiz button
		setShowQuickQuiz(false);

		// Apply smart defaults to form
		setQuizTypes(smartDefaults.question_types);
		setDifficulty(smartDefaults.difficulty);
		setNumQuestions(smartDefaults.num_questions);

		// Set subject if high confidence
		if (hasHighConfidence()) {
			setSelectedSubject({
				key: smartDefaults.subject.value,
				name: smartDefaults.subject.name,
				type: "smart_default",
				confidence: smartDefaults.subject.confidence,
			});
		}

		// Generate quiz using async mode
		// ✅ FIX: Check authentication before generating quiz
		const currentUserId = auth.currentUser?.uid;
		if (!currentUserId) {
			safeAlert("Authentication Required", "Please sign in to generate quizzes");
			return;
		}

		try {
			await generateQuizAsync(
				files[0],
				{
					quizTypes: smartDefaults.question_types,
					numQuestions: smartDefaults.num_questions,
					difficulty: smartDefaults.difficulty,
					language: i18n.language,
					visualEnhancement,
					subjectContext: hasHighConfidence()
						? {
								manual_subject: smartDefaults.subject.name,
								subject_key: smartDefaults.subject.value,
								subject_type: "smart_default",
							}
						: null,
				},
				currentUserId
			);
		} catch (error) {
			logger.error("❌ Quick Quiz generation failed:", error);
			// Error already handled by the hook
		}
	}, [
		smartDefaults,
		files,
		hasHighConfidence,
		generateQuizAsync,
		i18n.language,
		visualEnhancement,
	]);

	// ✅ NEW: Handle Customize action (show full configuration)
	const handleCustomize = useCallback(() => {
		logger.info("📝 User chose to customize quiz settings");

		// Hide Quick Quiz button
		setShowQuickQuiz(false);

		// Pre-fill form with smart defaults (if available)
		if (smartDefaults) {
			setQuizTypes(smartDefaults.question_types);
			setDifficulty(smartDefaults.difficulty);
			setNumQuestions(smartDefaults.num_questions);

			// Only set subject if high confidence
			if (hasHighConfidence()) {
				setSelectedSubject({
					key: smartDefaults.subject.value,
					name: smartDefaults.subject.name,
					type: "smart_default",
					confidence: smartDefaults.subject.confidence,
				});
			}
		}

		// User will now manually review and modify settings
		logger.info("Quiz configuration pre-filled with smart defaults, user can now customize");
	}, [smartDefaults, hasHighConfidence]);

	// ✅ ENHANCED: Upload with dual purpose (Study or Quiz) - supports both sync and async modes
	const handleUploadAndGenerateQuiz = async () => {
		// For study uploads, always use sync mode (no async backend yet)
		if (uploadPurpose === "study") {
			setUiState((prev) => ({ ...prev, uploading: true, isTransitioning: true }));

			const result = await handleQuizGeneration({
				files,
				uploadPurpose,
				quizTypes,
				numQuestions,
				difficulty,
				language: i18n.language,
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
				onFilesCleared: () => {
					files.forEach(cleanupBlobUrl);
					setFiles([]);
				},
				onSubjectCleared: clearSelectedSubject,
			});

			// Handle freshness indicator
			if (result.showFreshnessIndicator) {
				setUiState((prev) => ({ ...prev, showFreshnessIndicator: true }));
				setTimeout(() => {
					setUiState((prev) => ({ ...prev, showFreshnessIndicator: false }));
				}, 3000);
			}

			// Update extracted text state if available
			if (result.data?.extracted_text) {
				setExtractedText(result.data.extracted_text);
				setExtractionQuality(result.data.extraction_quality || 85);
				setTextExtractionProgress(100);
				setShowTextPreview(true);
			}

			setUiState((prev) => ({ ...prev, uploading: false, isTransitioning: false }));
			return;
		}

		// For quiz uploads, use async or sync mode based on toggle
		if (useAsyncMode) {
			// ✅ Use async mode with SSE
			logger.info("🚀 Using ASYNC quiz generation mode");

			// ✅ FIX: Check authentication before generating quiz
			const currentUserId = auth.currentUser?.uid;
			if (!currentUserId) {
				safeAlert(
					"Sign In Required",
					"Please sign in to generate personalized quizzes and track your progress"
				);
				return;
			}

			try {
				await generateQuizAsync(
					files[0],
					{
						quizTypes,
						numQuestions,
						difficulty,
						language: i18n.language,
						visualEnhancement,
						subjectContext: selectedSubject
							? {
									manual_subject: selectedSubject.name,
									subject_key: selectedSubject.key,
									subject_type: selectedSubject.type,
								}
							: null,
					},
					currentUserId
				);
			} catch (error) {
				logger.error("❌ Async quiz generation failed:", error);
				// Error already handled by the hook
			}
		} else {
			// Use legacy sync mode
			logger.info("🐢 Using SYNC quiz generation mode");
			setUiState((prev) => ({ ...prev, uploading: true, isTransitioning: true }));

			const result = await handleQuizGeneration({
				files,
				uploadPurpose,
				quizTypes,
				numQuestions,
				difficulty,
				language: i18n.language,
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
				onFilesCleared: () => {
					files.forEach(cleanupBlobUrl);
					setFiles([]);
				},
				onSubjectCleared: clearSelectedSubject,
			});

			// Handle freshness indicator
			if (result.showFreshnessIndicator) {
				setUiState((prev) => ({ ...prev, showFreshnessIndicator: true }));
				setTimeout(() => {
					setUiState((prev) => ({ ...prev, showFreshnessIndicator: false }));
				}, 3000);
			}

			setUiState((prev) => ({ ...prev, uploading: false, isTransitioning: false }));
		}
	};

	// ✅ REMOVED: removeFile and getFileIcon moved to useFileUpload hook

	// Memoized progress width for performance
	const progressWidth = useMemo(() => {
		return uploadProgress.interpolate({
			inputRange: [0, 1],
			outputRange: ["0%", "100%"],
		});
	}, [uploadProgress]);

	// Enhanced header component matching AskAlexandria design
// --- Enhanced header section ---
  const ListHeader = () => (
    <View>
      <UploadHeader
        navigation={navigation}
        containerAnim={containerAnim}
        themeColors={themeColors}
        styles={styles}
        t={safeT}
        onClear={() => {
          files.forEach(cleanupBlobUrl);
          setFiles([]);
          resetAnalysis();
          setShowQuickQuiz(false);
          clearSelectedSubject();
        }}
      />

      <UploadConfigurationForm
        // File state
        files={files}
        onFileSelected={handleFileDropped}
        onSelectFiles={handleSelectFiles}

        // Purpose state
        uploadPurpose={uploadPurpose}
        onPurposeChange={async (purpose) => {
          setUploadPurpose(purpose);
          if (purpose === "quiz" && files.length > 0) {
            const currentUserId = auth.currentUser?.uid;
            if (!currentUserId) {
              Alert.alert("Sign In Required", "Please sign in to generate personalized quizzes");
              return;
            }
            try {
              await analyzeFile(files[0], currentUserId);
              setShowQuickQuiz(true);
            } catch (error) {
              logger.error("❌ Re-analysis failed:", error);
            }
          } else {
            setShowQuickQuiz(false);
            resetAnalysis();
          }
        }}
        showQuickQuiz={showQuickQuiz}
        smartDefaults={smartDefaults}
        analyzingFile={analyzingFile}
        onQuickQuiz={handleQuickQuiz}
        onCustomize={handleCustomize}

        // Course selection
        courseSelectionMode={courseSelectionMode}
        setCourseSelectionMode={setCourseSelectionMode}
        userCourses={userCourses}
        hasProfileCourses={hasProfileCourses}

        // Profile course
        selectedSubject={selectedSubject}
        setSelectedSubject={setSelectedSubject}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
        courseModalVisible={courseModalVisible}
        setCourseModalVisible={setCourseModalVisible}

        // Hierarchical
        availableSubjects={availableSubjects}
        availableCourses={availableCourses}
        selectedHierarchicalSubject={selectedHierarchicalSubject}
        selectedHierarchicalCourse={selectedHierarchicalCourse}
        handleHierarchicalSubjectSelect={handleHierarchicalSubjectSelect}
        handleHierarchicalCourseSelect={handleHierarchicalCourseSelect}
        hierarchicalCourseModalVisible={hierarchicalCourseModalVisible}
        setHierarchicalCourseModalVisible={setHierarchicalCourseModalVisible}

        // Subject selector
        predefinedSubjects={predefinedSubjects}
        subjectSelectorVisible={subjectSelectorVisible}
        setSubjectSelectorVisible={setSubjectSelectorVisible}

        // Quiz/Study config
        quizTypes={quizTypes}
        setQuizTypes={setQuizTypes}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        numQuestions={numQuestions}
        setNumQuestions={setNumQuestions}
        quizTypeModalVisible={quizTypeModalVisible}
        setQuizTypeModalVisible={setQuizTypeModalVisible}
        difficultyModalVisible={difficultyModalVisible}
        setDifficultyModalVisible={setDifficultyModalVisible}
        enableStudyMode={enableStudyMode}
        setEnableStudyMode={setEnableStudyMode}

        // Modal control
        onOpenConfigModal={() => setConfigModalVisible(true)}

        HierarchicalSubjectService={HierarchicalSubjectService}
        isDisabled={uiState.isTransitioning}
        isAsyncGenerating={isAsyncGenerating}
        themeColors={themeColors}
        styles={styles}
        t={safeT}
      />
    </View>
  );

	// Enhanced footer with progress indicators only
  const ListFooter = () => (
    <UploadProgressSection
      // Async progress
      isAsyncGenerating={isAsyncGenerating}
      asyncProgress={asyncProgress}
      asyncStage={asyncStage}
      asyncMessage={asyncMessage}
      onCancelAsync={cancelGeneration}

      // Sync progress
      isUploading={uiState.uploading}
      progressWidth={progressWidth}

      // Mode
      uploadPurpose={uploadPurpose}
      useAsyncMode={useAsyncMode}

      // Message
      responseText={responseText}

      containerAnim={containerAnim}
      themeColors={themeColors}
      styles={styles}
    />
  );
	const insets = useSafeAreaInsets();
	return (
		<View style={[styles.container, { paddingBlockStart: insets.top }]}>
			<StatusBar style="auto" />

			{/* Freshness Indicator */}
			<FreshnessIndicator
				isVisible={uiState.showFreshnessIndicator}
				t={t}
			/>

			<LinearGradient
				colors={["#1A2C5B", "#2C467D"]}
				style={styles.innerContainer}
			>
				<FlatList
					data={files}
					keyExtractor={(item) => item.uri}
					renderItem={({ item, index }) => (
						<FileListItem
							item={item}
							index={index}
							onRemove={removeFile}
							getFileIcon={getFileIcon}
							themeColors={themeColors}
							styles={styles}
						/>
					)}
					ListHeaderComponent={ListHeader}
					ListFooterComponent={ListFooter}
					contentContainerStyle={styles.flatListContentContainer}
					showsVerticalScrollIndicator={false}
					ListEmptyComponent={
						files.length === 0 ? (
							<EmptyFilesList
								themeColors={themeColors}
								styles={styles}
								t={t}
							/>
						) : null
					}
					// Performance optimizations
					removeClippedSubviews={true}
					maxToRenderPerBatch={10}
					updateCellsBatchingPeriod={50}
					initialNumToRender={10}
					windowSize={10}
					getItemLayout={(data, index) => ({
						length: 88, // Approximate height of FileListItem (56px icon + 32px margin/padding)
						offset: 88 * index,
						index,
					})}
				/>

				{/* ✅ Sticky Generate Button at bottom (Study mode only) */}
				{uploadPurpose === 'study' && (
					<View style={styles.stickyFooter}>
						<GenerateButton
							uploadPurpose={uploadPurpose}
							isUploading={uiState.uploading}
							isDisabled={uiState.isTransitioning}
							filesCount={files.length}
							onPress={handleUploadAndGenerateQuiz}
							themeColors={themeColors}
							styles={styles}
							t={safeT}
						/>
					</View>
				)}
			</LinearGradient>

			{/* ✅ NEW: Subject Selector Modal */}
			<SubjectSelector
				visible={subjectSelectorVisible}
				onClose={() => setSubjectSelectorVisible(false)}
				onSubjectSelect={handleSubjectSelect}
				userId={auth.currentUser?.uid}
				theme={uiState.isDarkMode ? "dark" : "light"}
				currentSubject={selectedSubject}
				userCourses={userCourses}
				prioritizeUserCourses={true}
				onValidationRequest={async (subjectName) => {
					// Pass validation request to our validation function
					try {
						const validation = await StudentProfileService.validateCourse(subjectName.trim());
						return validation;
					} catch (error) {
						logger.error("❌ Error validating subject in SubjectSelector:", error);
						return {
							valid: false,
							message: "Unable to validate subject. Please try again.",
							suggestions: [],
						};
					}
				}}
			/>

			{/* ✅ Quiz Configuration Bottom Sheet Modal */}
			<QuizConfigModal
				visible={configModalVisible}
				onClose={() => setConfigModalVisible(false)}
				onGenerate={async () => {
					setConfigModalVisible(false);
					await handleUploadAndGenerateQuiz();
				}}
				quizTypes={quizTypes}
				setQuizTypes={setQuizTypes}
				difficulty={difficulty}
				setDifficulty={setDifficulty}
				numQuestions={numQuestions}
				setNumQuestions={setNumQuestions}
				quizTypeModalVisible={quizTypeModalVisible}
				setQuizTypeModalVisible={setQuizTypeModalVisible}
				difficultyModalVisible={difficultyModalVisible}
				setDifficultyModalVisible={setDifficultyModalVisible}
				styles={styles}
				themeColors={themeColors}
			/>

			{/* ✅ NEW: Text Extraction Preview Modal - Foundation for Study Reformatter */}
			<Modal
				visible={showTextPreview}
				transparent={true}
				animationType="slide"
				onRequestClose={() => setShowTextPreview(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.textPreviewModal}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>📖 Text Extracted Successfully</Text>
							<TouchableOpacity
								onPress={() => setShowTextPreview(false)}
								style={styles.modalCloseButton}
							>
								<FontAwesome5
									name="times"
									size={20}
									color="#F8F4E3"
								/>
							</TouchableOpacity>
						</View>

						<View style={styles.extractionStats}>
							<View style={styles.statItem}>
								<FontAwesome5
									name="file-alt"
									size={16}
									color="#D4AF37"
								/>
								<Text style={styles.statText}>{extractedText.length} characters extracted</Text>
							</View>
							<View style={styles.statItem}>
								<FontAwesome5
									name="chart-line"
									size={16}
									color="#28a745"
								/>
								<Text style={styles.statText}>Quality: {extractionQuality}%</Text>
							</View>
						</View>

						<Text style={styles.previewLabel}>Text Preview:</Text>
						<ScrollView style={styles.textPreviewContainer}>
							<Text style={styles.extractedTextPreview}>
								{extractedText.substring(0, 500)}
								{extractedText.length > 500 && "..."}
							</Text>
						</ScrollView>

						<View style={styles.previewActions}>
							<TouchableOpacity
								style={styles.previewActionButton}
								onPress={() => setShowTextPreview(false)}
							>
								<Text style={styles.previewActionText}>Continue with Quiz</Text>
							</TouchableOpacity>
						</View>

						<Text style={styles.futureFeatureNote}>
							🚀 Coming Soon: Generate summaries, flashcards, and audio from this text!
						</Text>
					</View>
				</View>
			</Modal>

			{/* ✅ Only show QuizLoadingScreen for sync uploads (not async mode) */}
			<QuizLoadingScreen
				isVisible={uiState.uploading && !isAsyncGenerating}
				message="Alexandria is creating your quiz..."
				subMessage={
					files.some((f) => f.name?.endsWith(".pdf"))
						? "📚 Enhanced PDF Processing: Analyzing text, images, charts, and diagrams..."
						: "Analyzing your content and generating questions"
				}
			/>

			{/* ✅ NEW: First-time user onboarding tooltip */}
			<OnboardingTooltip
				visible={isFirstTime("firstUpload")}
				message="Upload your study materials - PDFs, text files, or images - and I'll create personalized quizzes to help you master the content"
				position="top"
				icon="upload"
				onDismiss={() => markAsComplete("firstUpload")}
			/>
		</View>
	);
}

// ✅ REMOVED: Inline styles moved to styles/UploadScreenStyles.ts (1,117 lines extracted)
