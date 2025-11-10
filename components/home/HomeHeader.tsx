import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from "react-native";
import * as Animatable from "react-native-animatable";
import { FontAwesome5 } from "@expo/vector-icons";
import { UserService } from "../../utils/UserService";

// Type definitions
interface RecentStats {
	totalQuizzes: number;
	averageScore: number;
	currentStreak: number;
}

interface ThemeStyles {
	greeting: TextStyle;
	userName: TextStyle;
	profileButton: ViewStyle;
	profileIcon: { color: string };
	quickStats: ViewStyle;
	statNumber: TextStyle;
	statLabel: TextStyle;
}

type HomeHeaderProps = {
	userName: string;
	profileCompletion: number;
	recentStats: RecentStats;
	themeStyles: ThemeStyles;
	t: (key: string) => string;
	onProfilePress: () => void;
};

interface Styles {
	headerContainer: ViewStyle;
	headerTop: ViewStyle;
	greeting: TextStyle;
	userName: TextStyle;
	profileCompletionContainer: ViewStyle;
	profileCompletionBar: ViewStyle;
	profileCompletionFill: ViewStyle;
	profileCompletionText: TextStyle;
	profileButton: ViewStyle;
	quickStats: ViewStyle;
	statItem: ViewStyle;
	statNumber: TextStyle;
	statLabel: TextStyle;
	statDivider: ViewStyle;
}

// Fallback UserService functions
const UserServiceFallback = {
	getGreeting: (t: (key: string) => string) => {
		const hour = new Date().getHours();
		if (hour < 12) return t ? t("home.greeting.morning") : "Good morning";
		if (hour < 17) return t ? t("home.greeting.afternoon") : "Good afternoon";
		return t ? t("home.greeting.evening") : "Good evening";
	},
};

/**
 * HomeHeader - Header section with greeting, profile completion, and quick stats
 *
 * Features:
 * - Time-based greeting (Good morning/afternoon/evening)
 * - User name display with wave emoji
 * - Profile completion progress bar (when < 100%)
 * - Profile button with menu trigger
 * - Quick stats (Total Quizzes, Average Score, Streak)
 * - Staggered animations for visual appeal
 */
const HomeHeader = ({
	userName,
	profileCompletion,
	recentStats,
	themeStyles,
	t,
	onProfilePress,
}: HomeHeaderProps) => {
	return (
		<Animatable.View
			animation="fadeInDown"
			delay={200}
			style={styles.headerContainer}
		>
			<View style={styles.headerTop}>
				<View>
					<Text style={[styles.greeting, themeStyles.greeting]}>
						{UserService?.getGreeting?.() || UserServiceFallback.getGreeting(t)},
					</Text>
					<Text style={[styles.userName, themeStyles.userName]}>{userName || "Student"}! 👋</Text>
					{profileCompletion > 0 && profileCompletion < 100 && (
						<View style={styles.profileCompletionContainer}>
							<View style={styles.profileCompletionBar}>
								<View style={[styles.profileCompletionFill, { width: `${profileCompletion}%` }]} />
							</View>
							<Text style={styles.profileCompletionText}>
								{t("profile.profileCompletion")} {profileCompletion}% {t("profile.complete")}
							</Text>
						</View>
					)}
				</View>

				<TouchableOpacity
					style={[styles.profileButton, themeStyles.profileButton]}
					onPress={onProfilePress}
				>
					<FontAwesome5
						name="user"
						size={20}
						color={themeStyles.profileIcon.color}
					/>
				</TouchableOpacity>
			</View>

			{/* Stats moved to main HomeTab with carved border */}
		</Animatable.View>
	);
};

const styles = StyleSheet.create<Styles>({
	headerContainer: {
		marginBottom: 10,
		backgroundColor: "#1a2c5bff",
	},
	headerTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 24,
	},
	greeting: {
		fontSize: 16,
		opacity: 0.8,
		marginBottom: 4,
	},
	userName: {
		fontSize: 28,
		fontWeight: "800",
		letterSpacing: -0.5,
	},
	profileCompletionContainer: {
		marginTop: 8,
		gap: 4,
	},
	profileCompletionBar: {
		height: 4,
		backgroundColor: "rgba(248, 244, 227, 0.2)",
		borderRadius: 2,
		overflow: "hidden",
	},
	profileCompletionFill: {
		height: "100%",
		backgroundColor: "#D4AF37",
		borderRadius: 2,
	},
	profileCompletionText: {
		fontSize: 12,
		color: "rgba(248, 244, 227, 0.8)",
		fontWeight: "500",
	},
	profileButton: {
		width: 50,
		height: 50,
		borderRadius: 25,
		justifyContent: "center",
		alignItems: "center",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	quickStats: {
		flexDirection: "row",
		padding: 20,
		borderRadius: 16,
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 6,
	},
	statItem: {
		flex: 1,
		alignItems: "center",
		gap: 4,
	},
	statNumber: {
		fontSize: 20,
		fontWeight: "700",
		marginTop: 4,
	},
	statLabel: {
		fontSize: 12,
		opacity: 0.7,
	},
	statDivider: {
		width: 1,
		height: 40,
		backgroundColor: "rgba(0,0,0,0.1)",
		marginHorizontal: 16,
	},
});

export default HomeHeader;
