/**
 * AcademicDropdown Component
 * A simple dropdown selector for academic details (Year/Level, Season, Year)
 *
 * Features:
 * - Modal-based selection
 * - Alexandria theme styling
 * - Gold accent for selected state
 * - Matches Degree/Program field styling
 * - Accessible and mobile-friendly
 * - No icons required (simpler than CustomDropdown)
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export interface AcademicDropdownOption {
  id: string;
  label: string;
}

interface AcademicDropdownProps {
  value: string;
  onSelect: (value: string) => void;
  options: AcademicDropdownOption[];
  placeholder: string;
  label: string;
}

/**
 * AcademicDropdown - Dropdown selector for academic details
 *
 * @param value - Currently selected value (option.id)
 * @param onSelect - Callback when option is selected
 * @param options - Array of dropdown options
 * @param placeholder - Placeholder text when no selection
 * @param label - Label displayed above dropdown
 */
const AcademicDropdown: React.FC<AcademicDropdownProps> = ({
  value,
  onSelect,
  options,
  placeholder,
  label,
}) => {
  const [modalVisible, setModalVisible] = React.useState(false);
  const selectedOption = options.find(option => option.id === value);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dropdownText,
          !selectedOption && styles.placeholderText
        ]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <FontAwesome5 name="chevron-down" size={14} color="#D4AF37" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <FontAwesome5 name="times" size={20} color="#F8F4E3" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    value === item.id && styles.selectedOption
                  ]}
                  onPress={() => {
                    onSelect(item.id);
                    setModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionText,
                    value === item.id && styles.selectedOptionText
                  ]}>
                    {item.label}
                  </Text>
                  {value === item.id && (
                    <FontAwesome5 name="check" size={16} color="#D4AF37" />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8F4E3',
    marginBottom: 12,
  },
  dropdownButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  dropdownText: {
    color: '#F8F4E3',
    fontSize: 16,
    flex: 1,
  },
  placeholderText: {
    color: '#CBD5E0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A2C5B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8F4E3',
  },
  modalCloseButton: {
    padding: 8,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    minHeight: 56,
  },
  selectedOption: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
  },
  optionText: {
    fontSize: 16,
    color: '#F8F4E3',
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: '600',
    color: '#D4AF37',
  },
});

export default React.memo(AcademicDropdown);
