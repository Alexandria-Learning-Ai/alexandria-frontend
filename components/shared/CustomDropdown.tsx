/**
 * CustomDropdown Component
 * A reusable dropdown selector with modal - Shared across multiple screens
 *
 * Features:
 * - Modal-based selection
 * - Icon support for options
 * - Color customization per option
 * - Selected state indication
 * - Customizable styles via props
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export interface DropdownOption {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}

interface CustomDropdownProps {
  value: string | number;
  onSelect: (value: string | number) => void;
  options: DropdownOption[];
  placeholder: string;
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  icon: string;
  styles?: any; // Optional: allow custom styles to be passed
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onSelect,
  options,
  placeholder,
  modalVisible,
  setModalVisible,
  icon,
  styles = {} // Default to empty object if no styles provided
}) => {
  const selectedOption = options.find(option => option.value === value);

  // Default styles that can be overridden
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
            !selectedOption && defaultStyles.dropdownPlaceholder
          ]}>
            {selectedOption ? selectedOption.label : placeholder}
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
              <Text style={defaultStyles.modalTitle}>Select {placeholder}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={defaultStyles.modalCloseButton}
              >
                <FontAwesome5 name="times" size={20} color="#F8F4E3" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    defaultStyles.optionItem,
                    value === item.value && defaultStyles.selectedOption
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    setModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <FontAwesome5
                    name={item.icon}
                    size={16}
                    color={item.color || "#D4AF37"}
                  />
                  <Text style={defaultStyles.optionText}>{item.label}</Text>
                  {value === item.value && (
                    <FontAwesome5 name="check" size={16} color="#28a745" />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

export default CustomDropdown;
