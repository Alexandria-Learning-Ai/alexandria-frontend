/**
 * SearchBar - Material search input
 *
 * Features:
 * - Search icon
 * - Clear button (when text entered)
 * - Debounced search callback
 * - Alexandria theme styling
 * - Placeholder text
 * - Auto-focus option
 *
 * @param placeholder - Placeholder text
 * @param value - Current search value
 * @param onSearch - Callback when search changes
 * @param onClear - Callback when clear button pressed
 */

import React, { useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onSearch: (text: string) => void;
  onClear?: () => void;
  style?: ViewStyle;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search materials...',
  value,
  onSearch,
  onClear,
  style,
  autoFocus = false,
}) => {
  const themeColors = useMemo(
    () => ({
      background: Colors.gray100,
      text: Colors.text,
      placeholder: Colors.textSecondary,
      icon: Colors.textSecondary,
    }),
    []
  );

  const handleClear = () => {
    onSearch('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }, style]}>
      <FontAwesome5 name="search" size={16} color={themeColors.icon} style={styles.icon} />

      <TextInput
        style={[styles.input, { color: themeColors.text }]}
        placeholder={placeholder}
        placeholderTextColor={themeColors.placeholder}
        value={value}
        onChangeText={onSearch}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton} activeOpacity={0.7}>
          <FontAwesome5 name="times-circle" size={16} color={themeColors.icon} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default SearchBar;
