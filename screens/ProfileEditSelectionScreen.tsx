import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  ScrollView,
  ViewStyle,
  TextStyle
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SafeBackButton from '../components/SafeBackButton';
import NavigationHelper from '../utils/NavigationHelper';
import { RootStackParamList } from '../types';

// Type definitions
type ProfileEditSelectionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ProfileEditSelection'
>;

interface ProfileEditSelectionScreenProps {
  navigation: ProfileEditSelectionScreenNavigationProp;
}

interface EditSection {
  id: 'personal' | 'education' | 'program' | 'courses' | 'preferences';
  title: string;
  description: string;
  icon: string;
  step: number;
  color: string;
}

interface Styles {
  container: ViewStyle;
  header: ViewStyle;
  backButton: ViewStyle;
  titleSection: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  contentContainer: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  sectionCard: ViewStyle;
  completeEditCard: ViewStyle;
  completeEditGradient: ViewStyle;
  sectionContent: ViewStyle;
  iconContainer: ViewStyle;
  sectionText: ViewStyle;
  sectionTitle: TextStyle;
  sectionDescription: TextStyle;
  arrowContainer: ViewStyle;
}

/**
 * ProfileEditSelectionScreen - Allows users to select which profile section to edit
 *
 * Features:
 * - Navigation to specific profile edit sections
 * - Animated entrance
 * - Complete profile review option
 * - i18n support ready
 */
const ProfileEditSelectionScreen: React.FC<ProfileEditSelectionScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleBackPress = (): void => {
    NavigationHelper.safeGoBack(navigation, 'ProfileView');
  };

  const editSections: EditSection[] = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Name, contact details, and basic info',
      icon: 'user',
      step: 1,
      color: '#3498DB'
    },
    {
      id: 'education',
      title: 'Education Level',
      description: 'School level and academic year',
      icon: 'graduation-cap',
      step: 2,
      color: '#E74C3C'
    },
    {
      id: 'program',
      title: 'Program & Major',
      description: 'Academic program and current semester',
      icon: 'book',
      step: 3,
      color: '#F39C12'
    },
    {
      id: 'courses',
      title: 'Courses',
      description: 'Current courses and subjects',
      icon: 'chalkboard-teacher',
      step: 4,
      color: '#27AE60'
    },
    {
      id: 'preferences',
      title: 'Learning Preferences',
      description: 'Learning styles and study goals',
      icon: 'brain',
      step: 5,
      color: '#9B59B6'
    }
  ];

  const handleSectionEdit = (section: EditSection): void => {
    navigation.navigate('Profile', {
      editMode: true,
      editSection: section.id,
      targetStep: section.step,
      sectionTitle: section.title
    });
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1A2C5B" />
      <LinearGradient colors={['#1A2C5B', '#2C467D']} style={styles.container}>

        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="arrow-left" size={20} color="#F8F4E3" />
          </TouchableOpacity>

          <View style={styles.titleSection}>
            <FontAwesome5 name="edit" size={32} color="#D4AF37" />
            <Text style={styles.title}>Edit Profile</Text>
            <Text style={styles.subtitle}>Choose which section to update</Text>
          </View>
        </Animated.View>

        {/* Section Selection */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {editSections.map((section, index) => (
              <Animated.View
                key={section.id}
                style={{
                  opacity: fadeAnim,
                  transform: [{
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 50],
                      outputRange: [0, 50 + (index * 10)]
                    })
                  }]
                }}
              >
                <TouchableOpacity
                  style={styles.sectionCard}
                  onPress={() => handleSectionEdit(section)}
                  activeOpacity={0.8}
                >
                  <View style={styles.sectionContent}>
                    <View style={[styles.iconContainer, { backgroundColor: section.color + '20' }]}>
                      <FontAwesome5
                        name={section.icon}
                        size={24}
                        color={section.color}
                      />
                    </View>

                    <View style={styles.sectionText}>
                      <Text style={styles.sectionTitle}>{section.title}</Text>
                      <Text style={styles.sectionDescription}>{section.description}</Text>
                    </View>

                    <View style={styles.arrowContainer}>
                      <FontAwesome5 name="chevron-right" size={16} color="#CBD5E0" />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}

            {/* Complete Profile Edit Option */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 50 + (editSections.length * 10)]
                  })
                }]
              }}
            >
              <TouchableOpacity
                style={[styles.sectionCard, styles.completeEditCard]}
                onPress={() => navigation.navigate('Profile', { editMode: true, editSection: 'all' })}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#D4AF37', '#B8941F']}
                  style={styles.completeEditGradient}
                >
                  <View style={styles.sectionContent}>
                    <View style={styles.iconContainer}>
                      <FontAwesome5 name="clipboard-list" size={24} color="#1A2C5B" />
                    </View>

                    <View style={styles.sectionText}>
                      <Text style={[styles.sectionTitle, { color: '#1A2C5B' }]}>
                        Complete Profile Review
                      </Text>
                      <Text style={[styles.sectionDescription, { color: '#1A2C5B', opacity: 0.8 }]}>
                        Go through all sections step by step
                      </Text>
                    </View>

                    <View style={styles.arrowContainer}>
                      <FontAwesome5 name="chevron-right" size={16} color="#1A2C5B" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 60,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(248, 244, 227, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F8F4E3',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CBD5E0',
    marginTop: 6,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: 'rgba(248, 244, 227, 0.05)',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(248, 244, 227, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  completeEditCard: {
    borderWidth: 0,
    overflow: 'hidden',
  },
  completeEditGradient: {
    borderRadius: 16,
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8F4E3',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#CBD5E0',
    lineHeight: 20,
  },
  arrowContainer: {
    marginLeft: 12,
  },
});

export default ProfileEditSelectionScreen;
