import React from 'react';
import { View, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import CustomDropdown from '../shared/CustomDropdown';

interface DifficultyOption {
  label: string;
  value: string;
  icon: string;
}

interface DifficultySelectorProps {
  value: string;
  onSelect: (value: string) => void;
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  styles: any;
  t: (key: string, options?: any) => string;
}

/**
 * DifficultySelector - Difficulty level dropdown selector
 *
 * Features:
 * - Dropdown with difficulty level options
 * - Icon and emoji labels
 * - Modal state management
 * - Predefined difficulty options (Easy to Expert)
 */
const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  value,
  onSelect,
  modalVisible,
  setModalVisible,
  styles,
  t
}) => {
  const difficultyOptions: DifficultyOption[] = [
    { label: '🟢 Easy - Basic concepts', value: 'easy', icon: 'seedling' },
    { label: '🟡 Medium - Standard level', value: 'medium', icon: 'balance-scale' },
    { label: '🔴 Hard - Advanced concepts', value: 'hard', icon: 'fire' },
    { label: '🟣 Expert - Professional level', value: 'expert', icon: 'crown' },
  ];

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        <FontAwesome5 name="signal" size={14} color="#D4AF37" /> {t('askAlexandria.difficultyLevel')}
      </Text>
      <CustomDropdown
        value={value}
        onSelect={onSelect}
        options={difficultyOptions}
        placeholder="Select difficulty level"
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        icon="signal"
        styles={styles}
      />
    </View>
  );
};

export default DifficultySelector;
