import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface UploadPurposeToggleProps {
	uploadPurpose: "study" | "quiz";
	setUploadPurpose: (purpose: "study" | "quiz") => void;
	styles: any;
}

/**
 * UploadPurposeToggle - Enhanced toggle with smooth animations
 *
 * Features:
 * - Sliding indicator animation between modes
 * - Scale animation on press
 * - Gradient background for active state
 * - Icon bounce animation on selection
 * - Enhanced visual distinction between modes
 * - Smooth transition animations
 * - Helper text fade transition
 *
 * Accessibility:
 * - accessibilityLabel for each option
 * - accessibilityRole for toggle identification
 * - accessibilityState for current selection
 * - Clear visual and textual feedback
 */
const UploadPurposeToggle: React.FC<UploadPurposeToggleProps> = ({
	uploadPurpose,
	setUploadPurpose,
	styles,
}) => {
	const slideAnim = useRef(new Animated.Value(uploadPurpose === "study" ? 0 : 1)).current;
	const studyScale = useRef(new Animated.Value(1)).current;
	const quizScale = useRef(new Animated.Value(1)).current;
	const studyIconBounce = useRef(new Animated.Value(1)).current;
	const quizIconBounce = useRef(new Animated.Value(1)).current;
	const helperFade = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		Animated.spring(slideAnim, {
			toValue: uploadPurpose === "study" ? 0 : 1,
			tension: 80,
			friction: 10,
			useNativeDriver: true,
		}).start();

		// Bounce animation for the selected icon
		const selectedBounce = uploadPurpose === "study" ? studyIconBounce : quizIconBounce;
		Animated.sequence([
			Animated.spring(selectedBounce, {
				toValue: 1.2,
				tension: 200,
				friction: 3,
				useNativeDriver: true,
			}),
			Animated.spring(selectedBounce, {
				toValue: 1,
				tension: 100,
				friction: 5,
				useNativeDriver: true,
			}),
		]).start();

		// Fade helper text on change
		Animated.sequence([
			Animated.timing(helperFade, {
				toValue: 0.5,
				duration: 150,
				useNativeDriver: true,
			}),
			Animated.timing(helperFade, {
				toValue: 1,
				duration: 150,
				useNativeDriver: true,
			}),
		]).start();
	}, [uploadPurpose]);

	const handleStudyPress = () => {
		Animated.sequence([
			Animated.timing(studyScale, {
				toValue: 0.95,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(studyScale, {
				toValue: 1,
				duration: 100,
				useNativeDriver: true,
			}),
		]).start();
		setUploadPurpose("study");
	};

	const handleQuizPress = () => {
		Animated.sequence([
			Animated.timing(quizScale, {
				toValue: 0.95,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(quizScale, {
				toValue: 1,
				duration: 100,
				useNativeDriver: true,
			}),
		]).start();
		setUploadPurpose("quiz");
	};

	const slideTranslateX = slideAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 170], // Adjust based on button width
	});

	return (
		<View style={styles.inputContainer}>
			{/* Enhanced Label */}
			<Text style={styles.label}>
				<FontAwesome5
					name="bullseye"
					size={16}
					color="#D4AF37"
				/>{" "}
				Upload Purpose
			</Text>

			{/* Enhanced Toggle Container */}
			<View style={[styles.purposerSelectorContainer]}>
				{/* Study Button */}
				<TouchableOpacity
					style={[
						styles.purposeSelector,
						uploadPurpose === "study" && styles.activePurposeSelector,
					]}
					onPress={handleStudyPress}
					activeOpacity={0.9}
					accessibilityLabel="Study Material mode"
					accessibilityRole="button"
					accessibilityState={{ selected: uploadPurpose === "study" }}
					accessibilityHint="Upload files to your study library"
				>
					<Text
						style={
							uploadPurpose === "study" ? styles.activePurposeSelector : styles.purposeSelectorText
						}
					>
						<FontAwesome5
							name="book-reader"
							size={18}
						/>{" "}
						Study
					</Text>
				</TouchableOpacity>

				{/* Quiz Button */}
				<TouchableOpacity
					style={[styles.purposeSelector, uploadPurpose === "quiz" && styles.activePurposeSelector]}
					onPress={handleQuizPress}
					activeOpacity={0.9}
					accessibilityLabel="Quiz Generation mode"
					accessibilityRole="button"
					accessibilityState={{ selected: uploadPurpose === "quiz" }}
					accessibilityHint="Generate practice questions from files"
				>
					<Text
						style={
							uploadPurpose === "quiz" ? styles.activePurposeSelector : styles.purposeSelectorText
						}
					>
						<FontAwesome5
							name="brain"
							size={18}
						/>{" "}
						Quiz
					</Text>
				</TouchableOpacity>
			</View>

			{/* REMOVED: Verbose helper text to reduce information density */}
		</View>
	);
};

const enhancedStyles = StyleSheet.create({
	labelContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	label: {
		marginLeft: 8,
		marginBottom: 0,
	},
	toggleContainer: {
		position: "relative",
		backgroundColor: "rgba(44, 70, 125, 0.3)", // Lighter background
		padding: 10,
		borderRadius: 15,
		flexDirection: "row",
		borderWidth: 1,
		borderColor: "rgba(212, 175, 55, 0.15)", // Subtle border
	},
	slidingIndicator: {
		position: "absolute",
		top: 4,
		left: 4,
		width: "48%",
		height: "87%",
		borderRadius: 12,
		zIndex: 0,
	},
	slidingIndicatorGradient: {
		flex: 1,
		borderRadius: 12,
		// Removed shadow for cleaner look
	},
	toggleButton: {
		zIndex: 1,
		paddingVertical: 14,
		paddingHorizontal: 16,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 12,
	},

	iconWrapper: {
		marginRight: 8,
	},
	toggleText: {
		fontSize: 16,
	},
	helperContainer: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginTop: 10,
		paddingHorizontal: 4,
	},
	uploadHelper: {
		marginLeft: 6,
		marginTop: 0,
		lineHeight: 18,
	},
});

export default UploadPurposeToggle;
