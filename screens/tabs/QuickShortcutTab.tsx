/**
 * QuickShortcutTab - Customizable shortcut tab
 *
 * Allows users to set a shortcut to their most-used feature
 *
 * Features:
 * - Type-safe props
 * - Alexandria theme styling
 * - Persistent shortcut preference
 * - Easy customization interface
 * - Smooth animations
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../firebaseConfig';
import logger from '../../utils/logger';

const { width: screenWidth } = Dimensions.get('window');

interface QuickShortcutTabProps {
  navigation: any;
  user: any;
  subscription: any;
}

interface ShortcutOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
}

const QuickShortcutTab: React.FC<QuickShortcutTabProps> = ({ navigation, user, subscription }) => {
  const [selectedShortcut, setSelectedShortcut] = useState<string>('upload');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [shortcutLoaded, setShortcutLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();
  const hasNavigated = useRef(false);

  // Theme colors
  const themeColors = useMemo(
    () => ({
      background: '#1A2C5B',
      backgroundSecondary: '#2C467D',
      text: '#F8F4E3',
      textSecondary: '#CBD5E0',
      alexandriaGold: '#D4AF37',
      alexandriaBronze: '#B8941F',
    }),
    []
  );

  const shortcutOptions: ShortcutOption[] = [
    {
      id: 'upload',
      title: 'Create Quiz',
      description: 'Upload and create new quizzes',
      icon: 'plus-circle',
      color: '#D4AF37',
      route: 'Upload',
    },
    {
      id: 'askalexandria',
      title: 'Ask Alexandria',
      description: 'AI-powered quiz generation',
      icon: 'comments',
      color: '#3498DB',
      route: 'AskAlexandria',
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      description: 'Study with flashcards',
      icon: 'layer-group',
      color: '#9B59B6',
      route: 'FlashcardDashboardScreen',
    },
    {
      id: 'history',
      title: 'Quiz History',
      description: 'Review past quizzes',
      icon: 'history',
      color: '#1A2C5B',
      route: 'QuizHistory',
    },
    {
      id: 'progress',
      title: 'Progress Tracker',
      description: 'View detailed analytics',
      icon: 'chart-line',
      color: '#28a745',
      route: 'ProgressTracker',
    },
    {
      id: 'materials',
      title: 'Study Materials',
      description: 'Browse extracted content',
      icon: 'book-open',
      color: '#6F4E37',
      route: 'StudyMaterials',
    },
    {
      id: 'audio',
      title: 'Audio Playlists',
      description: 'Manage audio playlists',
      icon: 'headphones',
      color: '#D4AF37',
      route: 'AudioPlaylists',
    },
    {
      id: 'bookstudy',
      title: 'Book Study',
      description: 'Read and study materials',
      icon: 'book-reader',
      color: '#8B4513',
      route: 'MaterialLibrary',
    },
  ];

  useEffect(() => {
    loadShortcutPreference();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadShortcutPreference = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const saved = await AsyncStorage.getItem(`quickShortcut_${currentUser.uid}`);
        if (saved) {
          setSelectedShortcut(saved);
        }
      }
      setShortcutLoaded(true);
    } catch (error) {
      logger.error('Error loading shortcut preference:', error);
      setShortcutLoaded(true);
    }
  };

  const saveShortcutPreference = async (shortcutId: string) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await AsyncStorage.setItem(`quickShortcut_${currentUser.uid}`, shortcutId);
        setSelectedShortcut(shortcutId);
        setIsCustomizing(false);
        Alert.alert('Success', 'Quick shortcut updated successfully!');
        logger.info(`Quick shortcut updated to: ${shortcutId}`);
      }
    } catch (error) {
      logger.error('Error saving shortcut preference:', error);
      Alert.alert('Error', 'Failed to save shortcut preference');
    }
  };

  // Auto-navigate to selected shortcut when tab is focused
  useEffect(() => {
    if (isFocused && shortcutLoaded && !isCustomizing) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        if (!hasNavigated.current) {
          const currentShortcut = shortcutOptions.find((opt) => opt.id === selectedShortcut) || shortcutOptions[0];
          logger.info(`Auto-navigating to shortcut: ${currentShortcut.route}`);
          navigation.navigate(currentShortcut.route);
          hasNavigated.current = true;
        }
      }, 100);

      return () => clearTimeout(timer);
    }

    // Reset navigation flag when tab loses focus
    if (!isFocused) {
      hasNavigated.current = false;
    }
  }, [isFocused, shortcutLoaded, isCustomizing, selectedShortcut]);

  const currentShortcut = shortcutOptions.find((opt) => opt.id === selectedShortcut) || shortcutOptions[0];

  const handleShortcutPress = () => {
    logger.info(`Quick shortcut activated: ${currentShortcut.route}`);
    navigation.navigate(currentShortcut.route);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ExpoStatusBar style="light" />

      {/* Floating Customize Button - Only visible when customizing or briefly on focus */}
      {!isCustomizing && isFocused && (
        <Animatable.View
          animation="fadeIn"
          duration={300}
          style={styles.floatingCustomizeButton}
        >
          <TouchableOpacity
            style={[styles.floatingButton, { backgroundColor: themeColors.alexandriaGold }]}
            onPress={() => setIsCustomizing(true)}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="cog" size={24} color={themeColors.background} />
          </TouchableOpacity>
        </Animatable.View>
      )}

      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header - Only show when customizing */}
          {isCustomizing && (
            <Animatable.View animation="fadeInDown" delay={100} style={styles.headerContainer}>
              <Text style={[styles.headerTitle, { color: themeColors.text }]}>Quick Shortcut</Text>
              <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
                Choose your favorite feature
              </Text>
            </Animatable.View>
          )}

          {isCustomizing && (
            <>
              {/* Shortcut Selection Grid */}
              <Animatable.View animation="fadeIn" duration={300} style={styles.optionsGrid}>
                {shortcutOptions.map((option, index) => (
                  <Animatable.View
                    key={option.id}
                    animation="fadeInUp"
                    delay={index * 50}
                    style={styles.optionCardWrapper}
                  >
                    <TouchableOpacity
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: themeColors.backgroundSecondary,
                          borderColor: selectedShortcut === option.id ? themeColors.alexandriaGold : 'transparent',
                          borderWidth: selectedShortcut === option.id ? 3 : 0,
                        },
                      ]}
                      onPress={() => saveShortcutPreference(option.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                        <FontAwesome5 name={option.icon} size={24} color="#FFFFFF" />
                      </View>
                      <Text style={[styles.optionTitle, { color: themeColors.text }]}>
                        {option.title}
                      </Text>
                      <Text style={[styles.optionDescription, { color: themeColors.textSecondary }]}>
                        {option.description}
                      </Text>
                      {selectedShortcut === option.id && (
                        <View style={styles.selectedBadge}>
                          <FontAwesome5 name="check-circle" size={20} color={themeColors.alexandriaGold} />
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animatable.View>
                ))}
              </Animatable.View>

              {/* Cancel Button */}
              <Animatable.View animation="fadeInUp" delay={400} style={styles.cancelContainer}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: themeColors.backgroundSecondary }]}
                  onPress={() => setIsCustomizing(false)}
                  activeOpacity={0.8}
                >
                  <FontAwesome5 name="times" size={16} color={themeColors.text} />
                  <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </Animatable.View>
            </>
          )}

          {/* Spacer for bottom tab bar */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingCustomizeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1000,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  currentShortcutContainer: {
    marginBottom: 24,
  },
  currentShortcutGradient: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  currentShortcutContent: {
    padding: 40,
    alignItems: 'center',
  },
  largeIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  currentShortcutTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  currentShortcutDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  tapHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tapHint: {
    fontSize: 14,
    fontWeight: '600',
  },
  customizeContainer: {
    marginBottom: 24,
  },
  customizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    borderWidth: 2,
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  customizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  optionCardWrapper: {
    width: (screenWidth - 56) / 2,
  },
  optionCard: {
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 14,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  cancelContainer: {
    marginTop: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default QuickShortcutTab;
