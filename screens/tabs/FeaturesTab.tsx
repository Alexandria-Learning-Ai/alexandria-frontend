/**
 * FeaturesTab - Features screen with feature cards
 *
 * Contains:
 * - Exam Generator (Phase 1.5)
 * - Audio Playlist
 * - Schedule Exam
 * - Quiz History
 * - Study Materials
 * - Book Study
 * - Progress Tracker
 * - Flashcards
 *
 * Features:
 * - Type-safe props
 * - Alexandria theme styling
 * - 2-column grid layout with carved dual-line dividers
 * - Trigger-based shimmer animation on screen focus (1.5s)
 * - Multi-layer shadow depth effects
 * - Smooth 60fps animations
 * - Responsive design
 */

import React, { useRef, useEffect, useMemo, useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	Animated,
	Dimensions,
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useIsFocused } from "@react-navigation/native";
import * as Animatable from "react-native-animatable";
import { FontAwesome5 } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import logger from "../../utils/logger";
import PremiumFeatureCard from "../../components/shared/PremiumFeatureCard";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

interface FeaturesTabProps {
	navigation: any;
	user: any;
	subscription: any;
}

interface FeatureCard {
	id: string;
	title: string;
	subtitle: string;
	icon: string;
	color: string;
	route: string;
	delay: number;
}
// Theme colors - matches HomeTab and FeaturesTab exactly
const themeColors = {
	background: "#1A2C5B",
	backgroundSecondary: "#2C467D",
	text: "#F8F4E3",
	textSecondary: "#CBD5E0",
	alexandriaGold: "#D4AF37",
	alexandriaBronze: "#B8941F",
	success: "#28a745",
	error: "#dc3545",
	warning: "#FFD700",
	dividerShadow: "rgba(0, 0, 0, 0.3)",
	dividerHighlight: "rgba(212, 175, 55, 0.15)",
};

const FeaturesTab: React.FC<FeaturesTabProps> = ({ navigation, user, subscription }) => {
	const { t } = useTranslation();
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const isFocused = useIsFocused();
	const [shimmerTrigger, setShimmerTrigger] = useState(0);

	const features: FeatureCard[] = [
		{
			id: "exam-generator",
			title: "Exam Generator",
			subtitle: "AI-powered exam creation",
			icon: "file-alt",
			color: "#E74C3C",
			route: "ExamGenerator",
			delay: 200,
		},
		{
			id: "audio",
			title: "Audio Playlists",
			subtitle: "Manage audio playlists",
			icon: "headphones",
			color: "#D4AF37",
			route: "AudioPlaylists",
			delay: 250,
		},
		{
			id: "schedule",
			title: "Schedule Exam",
			subtitle: "Set exam reminders",
			icon: "calendar-plus",
			color: "#28a745",
			route: "ScheduleExamScreen",
			delay: 300,
		},
		{
			id: "history",
			title: "Quiz History",
			subtitle: "Review past quizzes",
			icon: "history",
			color: "#1A2C5B",
			route: "QuizHistory",
			delay: 400,
		},
		{
			id: "materials",
			title: "Study Materials",
			subtitle: "Browse extracted content",
			icon: "book-open",
			color: "#6F4E37",
			route: "StudyMaterials",
			delay: 500,
		},
		{
			id: "bookstudy",
			title: "Book Study",
			subtitle: "Read and study materials",
			icon: "book-reader",
			color: "#8B4513",
			route: "MaterialLibrary",
			delay: 600,
		},
		{
			id: "progress",
			title: "Progress Tracker",
			subtitle: "View detailed analytics",
			icon: "chart-line",
			color: "#3498DB",
			route: "ProgressTracker",
			delay: 700,
		},
		{
			id: "flashcards",
			title: "Flashcards",
			subtitle: "Study with flashcards",
			icon: "layer-group",
			color: "#9B59B6",
			route: "FlashcardDashboardScreen",
			delay: 800,
		},
	];

	useEffect(() => {
		Animated.timing(fadeAnim, {
			toValue: 1,
			duration: 800,
			useNativeDriver: true,
		}).start();
	}, []);

	// Trigger shimmer animation when screen gains focus
	useEffect(() => {
		if (isFocused) {
			logger.info("FeaturesTab focused - triggering shimmer animation");
			setShimmerTrigger((prev) => prev + 1);
		}
	}, [isFocused]);

	const handleFeaturePress = (route: string) => {
		logger.info(`Navigating to feature: ${route}`);
		navigation.navigate(route);
	};

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
			<ExpoStatusBar style="light" />

			<Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
				<ScrollView
					contentContainerStyle={styles.scrollContainer}
					showsVerticalScrollIndicator={false}
					stickyHeaderIndices={[0]}
				>
					{/* Header */}
					<Animatable.View
						animation="fadeInDown"
						delay={100}
						style={styles.headerContainer}
					>
						<Text style={[styles.headerTitle, { color: themeColors.text }]}>Features</Text>
						<Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
							Access all Alexandria features
						</Text>
					</Animatable.View>

					{/* Feature Cards Grid with Carved Dividers */}
					<View style={styles.featuresGrid}>
						{features.map((feature) => (
							<View
								key={feature.id}
								style={styles.cardCell}
							>
								{/* Carved dual-line border effect */}
								<View
									style={[
										styles.cardBorder,
										{
											borderTopColor: themeColors.dividerShadow,
											borderLeftColor: themeColors.dividerShadow,
											borderBottomColor: themeColors.dividerHighlight,
											borderRightColor: themeColors.dividerHighlight,
										},
									]}
								>
									<PremiumFeatureCard
										id={feature.id}
										title={feature.title}
										subtitle={feature.subtitle}
										icon={feature.icon}
										color={feature.color}
										onPress={() => handleFeaturePress(feature.route)}
										delay={feature.delay}
										triggerShimmer={shimmerTrigger}
									/>
								</View>
							</View>
						))}
					</View>

					{/* Spacer for bottom tab bar */}
					<View style={{ height: 40 }} />
				</ScrollView>
			</Animated.View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContainer: {
		paddingHorizontal: 20,
		paddingBottom: 40,
	},
	headerContainer: {
    backgroundColor: themeColors.background,
		marginBottom: 32,
	},
	headerTitle: {
		fontSize: 32,
		fontWeight: "800",
		letterSpacing: -0.5,
		marginBottom: 8,
	},
	headerSubtitle: {
		fontSize: 16,
		opacity: 0.8,
    marginBottom: 8,
	},
	featuresGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 16, // 16px spacing between cells
		justifyContent: "space-between",
	},
	cardCell: {
		width: (screenWidth - 56) / 2, // 2 columns with spacing (20px padding + 16px gap)
		height: 177, // Fixed height: 153px card + 24px padding (12px top + 12px bottom)
		marginBottom: 0, // Using gap instead
	},
	cardBorder: {
		flex: 1, // Fill the cell height
		borderWidth: 1,
		borderRadius: 19, // Slightly larger than card radius (17px + 2px)
		padding: 12, // 12px padding inside cell
		// Carved/embossed effect with dual-line borders
		// Shadow on top/left, highlight on bottom/right
		borderTopWidth: 1,
		borderLeftWidth: 1,
		borderBottomWidth: 1,
		borderRightWidth: 1,
		backgroundColor: "transparent",
	},
});

export default FeaturesTab;
