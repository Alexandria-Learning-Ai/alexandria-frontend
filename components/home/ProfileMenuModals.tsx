import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Alert,
  Linking,
  Dimensions,
  ViewStyle,
  TextStyle,
  ListRenderItem,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

const { height: screenHeight } = Dimensions.get('window');

// Type definitions
interface Language {
  code: string;
  label: string;
  flag: string;
}

interface ProfileMenuOption {
  id: string;
  icon?: string;
  label: string;
  type: 'action' | 'submenu' | 'destructive' | 'divider';
}

interface ThemeStyles {
  profileMenuContainer: ViewStyle;
  profileMenuAvatar: ViewStyle;
  profileMenuUserName: TextStyle;
  profileMenuUserEmail: TextStyle;
  profileMenuDivider: ViewStyle;
  profileMenuItem: ViewStyle;
  profileMenuItemIcon: { color: string };
  profileMenuItemText: TextStyle;
  profileMenuLanguageFlag: TextStyle;
  profileMenuChevron: { color: string };
  profileIcon: { color: string };
  languageMenuContainer: ViewStyle;
  languageMenuTitle: TextStyle;
  languageMenuItem: ViewStyle;
  languageLabel: TextStyle;
}

interface ProfileMenuModalsProps {
  profileMenuVisible: boolean;
  languageMenuVisible: boolean;
  setProfileMenuVisible: (visible: boolean) => void;
  setLanguageMenuVisible: (visible: boolean) => void;
  userName: string;
  currentLanguage: Language;
  availableLanguages: Language[];
  themeStyles: ThemeStyles;
  navigation: NavigationProp<any>;
  t: (key: string) => string;
  setLanguage: (language: Language) => Promise<void>;
}

interface Styles {
  modalOverlay: ViewStyle;
  profileMenuContainer: ViewStyle;
  profileMenuHeader: ViewStyle;
  profileMenuUserInfo: ViewStyle;
  profileMenuAvatar: ViewStyle;
  profileMenuUserName: TextStyle;
  profileMenuUserEmail: TextStyle;
  profileMenuClose: ViewStyle;
  profileMenuDivider: ViewStyle;
  profileMenuItem: ViewStyle;
  profileMenuItemDestructive: ViewStyle;
  profileMenuItemContent: ViewStyle;
  profileMenuItemText: TextStyle;
  profileMenuItemTextDestructive: TextStyle;
  profileMenuLanguageIndicator: ViewStyle;
  profileMenuLanguageFlag: TextStyle;
  languageMenuContainer: ViewStyle;
  languageMenuHeader: ViewStyle;
  languageMenuTitle: TextStyle;
  languageMenuClose: ViewStyle;
  languageMenuItem: ViewStyle;
  languageMenuItemSelected: ViewStyle;
  languageFlag: TextStyle;
  languageLabel: TextStyle;
  languageLabelSelected: TextStyle;
}

// Profile menu options generator
const getProfileMenuOptions = (t: (key: string) => string): ProfileMenuOption[] => {
  if (!t || typeof t !== 'function') {
    return [
      { id: 'viewProfile', icon: 'user-circle', label: 'View Profile', type: 'action' },
      { id: 'editProfile', icon: 'edit', label: 'Edit Profile', type: 'action' },
      { id: 'divider1', label: '', type: 'divider' },
      { id: 'language', icon: 'globe', label: 'Language', type: 'submenu' },
      { id: 'settings', icon: 'cog', label: 'Settings', type: 'action' },
      { id: 'help', icon: 'question-circle', label: 'Help & Support', type: 'action' },
      { id: 'privacy', icon: 'shield-alt', label: 'Privacy Policy', type: 'action' },
      { id: 'about', icon: 'info-circle', label: 'About Alexandria', type: 'action' },
      { id: 'divider2', label: '', type: 'divider' },
      { id: 'signout', icon: 'sign-out-alt', label: 'Sign Out', type: 'destructive' },
    ];
  }

  return [
    { id: 'viewProfile', icon: 'user-circle', label: t('menu.viewProfile') || 'View Profile', type: 'action' },
    { id: 'editProfile', icon: 'edit', label: t('menu.editProfile') || 'Edit Profile', type: 'action' },
    { id: 'divider1', label: '', type: 'divider' },
    { id: 'language', icon: 'globe', label: t('menu.language') || 'Language', type: 'submenu' },
    { id: 'settings', icon: 'cog', label: t('menu.settings') || 'Settings', type: 'action' },
    { id: 'help', icon: 'question-circle', label: t('menu.helpSupport') || 'Help & Support', type: 'action' },
    { id: 'privacy', icon: 'shield-alt', label: t('menu.privacyPolicy') || 'Privacy Policy', type: 'action' },
    { id: 'about', icon: 'info-circle', label: t('menu.aboutAlexandria') || 'About Alexandria', type: 'action' },
    { id: 'divider2', label: '', type: 'divider' },
    { id: 'signout', icon: 'sign-out-alt', label: t('menu.signOut') || 'Sign Out', type: 'destructive' },
  ];
};

/**
 * ProfileMenuModals - Profile menu and language selection modals
 *
 * Features:
 * - Profile menu with user info header
 * - Menu actions (view profile, edit, settings, help, etc.)
 * - Language selection submenu
 * - Sign out functionality
 * - Theme-aware styling
 */
const ProfileMenuModals: React.FC<ProfileMenuModalsProps> = ({
  profileMenuVisible,
  languageMenuVisible,
  setProfileMenuVisible,
  setLanguageMenuVisible,
  userName,
  currentLanguage,
  availableLanguages,
  themeStyles,
  navigation,
  t,
  setLanguage,
}) => {
  const handleSignOut = (): void => {
    Alert.alert(t('auth.signOut'), t('messages.signOutConfirm'), [
      { text: t('alerts.cancel'), style: 'cancel' },
      {
        text: t('auth.signOut'),
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
          } catch (error) {
            Alert.alert(t('alerts.error'), t('messages.failedToSignOut'));
          }
        },
      },
    ]);
  };

  const handleProfileMenuSelect = (option: ProfileMenuOption): void => {
    setProfileMenuVisible(false);

    switch (option.id) {
      case 'viewProfile':
        navigation.navigate('ProfileView');
        break;
      case 'editProfile':
        navigation.navigate('ProfileEditSelection');
        break;
      case 'language':
        setLanguageMenuVisible(true);
        break;
      case 'settings':
        Alert.alert(t('menu.settings'), t('alerts.comingSoon'));
        break;
      case 'help':
        Alert.alert(t('menu.helpSupport'), 'Need help? Contact our support team.', [
          { text: 'Email Support', onPress: () => Linking.openURL('mailto:support@alexandria.app') },
          { text: t('alerts.cancel'), style: 'cancel' },
        ]);
        break;
      case 'privacy':
        Alert.alert(
          'Privacy Policy',
          'Your privacy is important to us. We collect minimal data necessary for app functionality.',
          [
            { text: 'View Full Policy', onPress: () => Linking.openURL('https://alexandria.app/privacy') },
            { text: 'OK', style: 'default' },
          ]
        );
        break;
      case 'about':
        Alert.alert(
          'About Alexandria',
          'Alexandria Quiz App v1.0\n\nYour AI-powered learning companion.\n\nBuilt with ❤️ for students everywhere.',
          [{ text: 'OK', style: 'default' }]
        );
        break;
      case 'signout':
        handleSignOut();
        break;
    }
  };

  const handleLanguageSelect = async (language: Language): Promise<void> => {
    try {
      await setLanguage(language);
      setLanguageMenuVisible(false);
      setProfileMenuVisible(false);

      Alert.alert(
        t('messages.languageUpdated'),
        t('messages.languageUpdatedDesc'),
        [{ text: t('common.ok'), style: 'default' }]
      );
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to update language preference');
    }
  };

  const renderProfileMenuItem: ListRenderItem<ProfileMenuOption> = ({ item }) => {
    if (item.type === 'divider') {
      return <View style={[styles.profileMenuDivider, themeStyles.profileMenuDivider]} />;
    }

    return (
      <TouchableOpacity
        style={[
          styles.profileMenuItem,
          themeStyles.profileMenuItem,
          item.type === 'destructive' && styles.profileMenuItemDestructive,
        ]}
        onPress={() => handleProfileMenuSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.profileMenuItemContent}>
          <FontAwesome5
            name={item.icon || 'circle'}
            size={16}
            color={
              item.type === 'destructive' ? '#ff6b7a' : themeStyles.profileMenuItemIcon.color
            }
          />
          <Text
            style={[
              styles.profileMenuItemText,
              item.type === 'destructive'
                ? styles.profileMenuItemTextDestructive
                : themeStyles.profileMenuItemText,
            ]}
          >
            {item.label}
          </Text>
        </View>
        {item.type === 'submenu' && (
          <View style={styles.profileMenuLanguageIndicator}>
            <Text style={[styles.profileMenuLanguageFlag, themeStyles.profileMenuLanguageFlag]}>
              {currentLanguage.flag}
            </Text>
            <FontAwesome5
              name="chevron-right"
              size={12}
              color={themeStyles.profileMenuChevron.color}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderLanguageMenuItem: ListRenderItem<Language> = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.languageMenuItem,
        themeStyles.languageMenuItem,
        currentLanguage.code === item.code && styles.languageMenuItemSelected,
      ]}
      onPress={() => handleLanguageSelect(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.languageFlag}>{item.flag}</Text>
      <Text
        style={[
          styles.languageLabel,
          themeStyles.languageLabel,
          currentLanguage.code === item.code && styles.languageLabelSelected,
        ]}
      >
        {item.label}
      </Text>
      {currentLanguage.code === item.code && (
        <FontAwesome5 name="check" size={16} color="#28a745" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      {/* Profile Menu Modal */}
      <Modal
        visible={profileMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProfileMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProfileMenuVisible(false)}
        >
          <View style={[styles.profileMenuContainer, themeStyles.profileMenuContainer]}>
            <View style={styles.profileMenuHeader}>
              <View style={styles.profileMenuUserInfo}>
                <View style={[styles.profileMenuAvatar, themeStyles.profileMenuAvatar]}>
                  <FontAwesome5 name="user" size={20} color={themeStyles.profileIcon.color} />
                </View>
                <View>
                  <Text style={[styles.profileMenuUserName, themeStyles.profileMenuUserName]}>
                    {userName || 'Student'}
                  </Text>
                  <Text style={[styles.profileMenuUserEmail, themeStyles.profileMenuUserEmail]}>
                    {auth.currentUser?.email || 'guest@alexandria.app'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.profileMenuClose}
                onPress={() => setProfileMenuVisible(false)}
              >
                <FontAwesome5 name="times" size={16} color={themeStyles.profileIcon.color} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={getProfileMenuOptions(t)}
              keyExtractor={(item) => item.id}
              renderItem={renderProfileMenuItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={languageMenuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLanguageMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageMenuVisible(false)}
        >
          <View style={[styles.languageMenuContainer, themeStyles.languageMenuContainer]}>
            <View style={styles.languageMenuHeader}>
              <Text style={[styles.languageMenuTitle, themeStyles.languageMenuTitle]}>
                Select Language
              </Text>
              <TouchableOpacity
                style={styles.languageMenuClose}
                onPress={() => setLanguageMenuVisible(false)}
              >
                <FontAwesome5 name="times" size={18} color={themeStyles.profileIcon.color} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableLanguages}
              keyExtractor={(item) => item.code}
              renderItem={renderLanguageMenuItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create<Styles>({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  profileMenuContainer: {
    borderRadius: 16,
    margin: 20,
    marginTop: 100,
    minWidth: 280,
    maxWidth: 320,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  profileMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
  },
  profileMenuUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileMenuAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileMenuUserName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  profileMenuUserEmail: {
    fontSize: 12,
    opacity: 0.8,
  },
  profileMenuClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileMenuDivider: {
    height: 1,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  profileMenuItemDestructive: {
    backgroundColor: 'rgba(255, 107, 122, 0.1)',
  },
  profileMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileMenuItemText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
  profileMenuItemTextDestructive: {
    color: '#ff6b7a',
    fontWeight: '600',
  },
  profileMenuLanguageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileMenuLanguageFlag: {
    fontSize: 16,
  },
  languageMenuContainer: {
    borderRadius: 16,
    margin: 20,
    marginTop: 120,
    maxHeight: screenHeight * 0.7,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  languageMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
  },
  languageMenuTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  languageMenuClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  languageMenuItemSelected: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
  },
  languageFlag: {
    fontSize: 20,
    marginRight: 16,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  languageLabelSelected: {
    fontWeight: '700',
    color: '#28a745',
  },
});

export default ProfileMenuModals;