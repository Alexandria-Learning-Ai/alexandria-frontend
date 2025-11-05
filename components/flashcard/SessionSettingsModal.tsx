import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface SessionStats {
  correct: number;
  studied: number;
}

interface ThemeColors {
  text: string;
  accent: string;
  cardBackground: string;
}

interface SessionSettingsModalProps {
  visible: boolean;
  isDarkMode: boolean;
  sessionStats: SessionStats;
  themeColors: ThemeColors;
  onClose: () => void;
  onToggleDarkMode: () => void;
  onViewAnalytics: () => void;
  onShareProgress: () => void;
}

const SessionSettingsModal: React.FC<SessionSettingsModalProps> = ({
  visible,
  isDarkMode,
  sessionStats,
  themeColors,
  onClose,
  onToggleDarkMode,
  onViewAnalytics,
  onShareProgress,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.cardBackground }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Session Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome5 name="times" size={20} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.settingsOptions}>
            <TouchableOpacity
              style={styles.settingOption}
              onPress={onToggleDarkMode}
            >
              <FontAwesome5 name={isDarkMode ? 'sun' : 'moon'} size={20} color={themeColors.accent} />
              <Text style={[styles.settingText, { color: themeColors.text }]}>
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingOption}
              onPress={onViewAnalytics}
            >
              <FontAwesome5 name="chart-line" size={20} color={themeColors.accent} />
              <Text style={[styles.settingText, { color: themeColors.text }]}>View Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingOption}
              onPress={onShareProgress}
            >
              <FontAwesome5 name="share" size={20} color={themeColors.accent} />
              <Text style={[styles.settingText, { color: themeColors.text }]}>Share Progress</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  settingsOptions: {
    gap: 12,
  },
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

// Memoized export - only re-renders when visibility changes
export default React.memo(SessionSettingsModal);
