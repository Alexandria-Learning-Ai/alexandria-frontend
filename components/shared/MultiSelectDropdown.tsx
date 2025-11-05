/**
 * MultiSelectDropdown Component
 * A reusable multi-select dropdown with modal
 *
 * Features:
 * - Multiple selection support
 * - "All Types" special option that deselects others
 * - Icon support for options
 * - Checkmarks for selected items
 * - Shows count of selected items
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

export interface MultiSelectOption {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}

interface MultiSelectDropdownProps {
  values: (string | number)[]; // Array of selected values
  onSelect: (values: (string | number)[]) => void;
  options: MultiSelectOption[];
  placeholder: string;
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  icon: string;
  styles?: any;
  allTypesValue?: string | number; // Special value for "All Types"
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  values,
  onSelect,
  options,
  placeholder,
  modalVisible,
  setModalVisible,
  icon,
  styles = {},
  allTypesValue = 'all',
}) => {
  const selectedOptions = options.filter(option => values.includes(option.value));
  const hasAllTypes = values.includes(allTypesValue);

  const handleSelect = (value: string | number) => {
    let newValues: (string | number)[];

    // If selecting "All Types", clear other selections
    if (value === allTypesValue) {
      newValues = [allTypesValue];
    } else {
      // If "All Types" is currently selected, replace it with the new selection
      if (hasAllTypes) {
        newValues = [value];
      } else {
        // Toggle selection
        if (values.includes(value)) {
          newValues = values.filter(v => v !== value);
        } else {
          newValues = [...values, value];
        }
      }
    }

    // Ensure at least one type is selected
    if (newValues.length === 0) {
      newValues = [allTypesValue];
    }

    onSelect(newValues);
  };

  const getDisplayText = () => {
    if (hasAllTypes) {
      return options.find(opt => opt.value === allTypesValue)?.label || 'All Types';
    }

    if (selectedOptions.length === 0) {
      return placeholder;
    }

    if (selectedOptions.length === 1) {
      return selectedOptions[0].label;
    }

    return `${selectedOptions.length} types selected`;
  };

  // Default styles
  const defaultStyles = {
    dropdownButton: styles.dropdownButton || {},
    dropdownContent: styles.dropdownContent || {},
    dropdownIcon: styles.dropdownIcon || {},
    dropdownText: styles.dropdownText || {},
    dropdownPlaceholder: styles.dropdownPlaceholder || {},
    modalOverlay: styles.modalOverlay || {},
    modalContent: styles.modalContent || {},
    modalHeader: styles.modalHeader || {},
    modalTitle: styles.modalTitle || {},
    modalCloseButton: styles.modalCloseButton || {},
    optionItem: styles.optionItem || {},
    selectedOption: styles.selectedOption || {},
    optionText: styles.optionText || {},
  };

  return (
    <>
      <TouchableOpacity
        style={defaultStyles.dropdownButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={defaultStyles.dropdownContent}>
          <FontAwesome5 name={icon} size={16} color="#D4AF37" style={defaultStyles.dropdownIcon} />
          <Text style={[
            defaultStyles.dropdownText,
            selectedOptions.length === 0 && defaultStyles.dropdownPlaceholder
          ]}>
            {getDisplayText()}
          </Text>
          <FontAwesome5 name="chevron-down" size={14} color="#CBD5E0" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={defaultStyles.modalOverlay}>
          <View style={defaultStyles.modalContent}>
            <View style={defaultStyles.modalHeader}>
              <Text style={defaultStyles.modalTitle}>
                Select Question Types
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={defaultStyles.modalCloseButton}
              >
                <FontAwesome5 name="times" size={20} color="#F8F4E3" />
              </TouchableOpacity>
            </View>

            <Text style={localStyles.helpText}>
              {hasAllTypes
                ? "All question types will be included"
                : "Select multiple types or choose 'All Types'"}
            </Text>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => {
                const isSelected = values.includes(item.value);
                const isAllTypes = item.value === allTypesValue;

                return (
                  <TouchableOpacity
                    style={[
                      defaultStyles.optionItem,
                      isSelected && defaultStyles.selectedOption
                    ]}
                    onPress={() => handleSelect(item.value)}
                    activeOpacity={0.7}
                  >
                    <FontAwesome5
                      name={item.icon}
                      size={16}
                      color={item.color || "#D4AF37"}
                    />
                    <Text style={[
                      defaultStyles.optionText,
                      isAllTypes && localStyles.allTypesText
                    ]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <FontAwesome5 name="check-circle" size={16} color="#28a745" />
                    )}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity
              style={localStyles.doneButton}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={localStyles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const localStyles = StyleSheet.create({
  helpText: {
    fontSize: 13,
    color: '#CBD5E0',
    paddingHorizontal: 16,
    paddingBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  allTypesText: {
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#D4AF37',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#1A2C5B',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default MultiSelectDropdown;
