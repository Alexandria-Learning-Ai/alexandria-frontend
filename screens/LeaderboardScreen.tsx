/**
 * LeaderboardScreen.tsx
 *
 * Full-screen leaderboard view with subject filter and settings.
 * Uses the Leaderboard component with data from useLeaderboard hook.
 *
 * Features:
 * - Subject filter dropdown
 * - Friends-only toggle
 * - Leaderboard component integration
 * - Pull-to-refresh
 * - Infinite scroll
 * - Settings menu
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { auth } from '../firebaseConfig';
import Leaderboard from '../components/leaderboard/Leaderboard';
import logger from '../utils/logger';

interface LeaderboardScreenProps {
  navigation: any; // React Navigation prop
}

/**
 * Mock theme colors (in production, use useTheme hook)
 */
const themeColors = {
  background: '#1A2C5B',
  backgroundSecondary: '#2C467D',
  alexandriaGold: '#D4AF37',
  alexandriaBronze: '#B8941F',
  alexandriaNavy: '#1A2C5B',
  alexandriaSilver: '#C0C0C0',
  alexandriaCream: '#F8F4E3',
  text: '#F8F4E3',
  textSecondary: '#CBD5E0',
  textTertiary: '#A0AEC0',
  success: '#28a745',
  error: '#dc3545',
  warning: '#FFD700',
  info: '#17a2b8',
  surface: '#2C467D',
  surfaceSecondary: '#3A5A9F',
  border: 'rgba(248, 244, 227, 0.2)',
  borderSecondary: 'rgba(248, 244, 227, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: '#000000',
};

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ navigation }) => {
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>(undefined);
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);

  // Get current user ID from Firebase auth
  const currentUserId = auth.currentUser?.uid;

  /**
   * Toggle friends-only mode
   */
  const toggleFriendsOnly = () => {
    setShowFriendsOnly(!showFriendsOnly);
    logger.info('Friends-only toggled', { enabled: !showFriendsOnly });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={themeColors.background} />

      <LinearGradient
        colors={[themeColors.background, themeColors.backgroundSecondary]}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="arrow-left" size={20} color={themeColors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>
              Leaderboard
            </Text>
          </View>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={toggleFriendsOnly}
            activeOpacity={0.7}
          >
            <FontAwesome5
              name="user-friends"
              size={20}
              color={showFriendsOnly ? themeColors.alexandriaGold : themeColors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Subject Filter (optional, can be expanded) */}
        {selectedSubject && (
          <View style={styles.filterContainer}>
            <View
              style={[
                styles.subjectChip,
                {
                  backgroundColor: themeColors.alexandriaGold + '20',
                  borderColor: themeColors.alexandriaGold,
                },
              ]}
            >
              <Text style={[styles.subjectText, { color: themeColors.alexandriaGold }]}>
                {selectedSubject}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedSubject(undefined)}
                style={styles.clearSubject}
              >
                <FontAwesome5
                  name="times"
                  size={12}
                  color={themeColors.alexandriaGold}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Leaderboard Component */}
        <Leaderboard
          subject={selectedSubject}
          showFriendsOnly={showFriendsOnly}
          currentUserId={currentUserId}
          themeColors={themeColors}
        />
      </LinearGradient>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 + 16 : 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
  },
  clearSubject: {
    padding: 4,
  },
});

export default LeaderboardScreen;
