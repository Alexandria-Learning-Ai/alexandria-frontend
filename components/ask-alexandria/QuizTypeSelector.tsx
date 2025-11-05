import React from 'react';
import { View, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import MultiSelectDropdown from '../shared/MultiSelectDropdown';
import { quizTypeOptions } from '../../constants/uploadOptions';

interface QuizTypeSelectorProps {
  values: string[]; // Changed from value to values (array)
  onSelect: (values: string[]) => void; // Changed to accept array
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  styles: any;
  t: (key: string, options?: any) => string;
}

/**
 * QuizTypeSelector - Multi-select quiz type dropdown selector
 *
 * Features:
 * - Multi-select dropdown with quiz type options
 * - "All Types" special option
 * - Icon and label display
 * - Modal state management
 */
const QuizTypeSelector: React.FC<QuizTypeSelectorProps> = ({
  values,
  onSelect,
  modalVisible,
  setModalVisible,
  styles,
  t
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        <FontAwesome5 name="question-circle" size={14} color="#D4AF37" /> {t('askAlexandria.quizType')}
      </Text>
      <MultiSelectDropdown
        values={values}
        onSelect={onSelect}
        options={quizTypeOptions}
        placeholder="Select quiz types"
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        icon="question-circle"
        styles={styles}
        allTypesValue="all"
      />
    </View>
  );
};

export default QuizTypeSelector;
