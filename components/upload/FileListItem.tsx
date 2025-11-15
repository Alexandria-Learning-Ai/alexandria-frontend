import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

interface ThemeColors {
  glass: string;
  alexandriaGold: string;
  alexandriaBronze: string;
  text: string;
  textSecondary: string;
  error: string;
  [key: string]: string;
}

interface FileListItemProps {
  item: {
    name: string;
    size?: number;
    uri: string;
  };
  index: number;
  onRemove: (fileName: string) => void;
  getFileIcon: (fileName: string) => string;
  themeColors: ThemeColors;
  styles: any;
}

/**
 * FileListItem - Enhanced file card with beautiful visual hierarchy
 *
 * Features:
 * - Staggered entrance animation based on index
 * - Gradient icon container with enhanced glow
 * - File name truncation with ellipsis
 * - Size badge with proper formatting
 * - Enhanced remove button with scale animation
 * - Glass morphism background with border
 * - Hover/press state animations
 * - Enhanced shadows and depth
 *
 * Accessibility:
 * - accessibilityLabel for file information
 * - accessibilityHint for remove action
 * - accessibilityRole for button identification
 *
 * Performance:
 * - Memoized to prevent unnecessary re-renders (React.memo)
 * - Custom comparison function for optimal rendering
 */
const FileListItem: React.FC<FileListItemProps> = React.memo(({
  item,
  index,
  onRemove,
  getFileIcon,
  themeColors,
  styles
}) => {
  const removeButtonScale = useRef(new Animated.Value(1)).current;

  const handleRemovePressIn = () => {
    Animated.spring(removeButtonScale, {
      toValue: 0.85,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handleRemovePressOut = () => {
    Animated.spring(removeButtonScale, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return 'Size unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeLabel = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toUpperCase();
    return ext || 'FILE';
  };

  return (
    <Animatable.View
      animation="slideInRight"
      delay={index * 80}
      duration={400}
      style={[
        styles.fileItem,
        enhancedStyles.fileItem,
        { backgroundColor: themeColors.glass }
      ]}
    >
      <View style={[styles.fileInfo, enhancedStyles.fileInfo]}>
        {/* Enhanced Icon Container */}
        <View style={enhancedStyles.iconWrapper}>
          <LinearGradient
            colors={[themeColors.alexandriaGold, themeColors.alexandriaBronze]}
            style={[styles.fileIconContainer, enhancedStyles.fileIconContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome5
              name={getFileIcon(item.name)}
              size={22}
              color="#1A2C5B"
            />
          </LinearGradient>
        </View>

        {/* File Details */}
        <View style={[styles.fileDetails, enhancedStyles.fileDetails]}>
          <Text
            style={[styles.fileName, enhancedStyles.fileName, { color: themeColors.text }]}
            numberOfLines={1}
            ellipsizeMode="middle"
            accessibilityLabel={`File name: ${item.name}`}
          >
            {item.name}
          </Text>
          <View style={enhancedStyles.metaContainer}>
            <FontAwesome5 name="database" size={10} color={themeColors.textSecondary} />
            <Text
              style={[styles.fileSize, enhancedStyles.fileSize, { color: themeColors.textSecondary }]}
              accessibilityLabel={`File size: ${formatFileSize(item.size)}`}
            >
              {formatFileSize(item.size)}
            </Text>
          </View>
        </View>
      </View>

      {/* Enhanced Remove Button */}
      <Animated.View style={{ transform: [{ scale: removeButtonScale }] }}>
        <TouchableOpacity
          onPress={() => onRemove(item.name)}
          onPressIn={handleRemovePressIn}
          onPressOut={handleRemovePressOut}
          style={[
            styles.removeButton,
            enhancedStyles.removeButton,
            { backgroundColor: themeColors.error + '20' }
          ]}
          activeOpacity={0.9}
          accessibilityLabel={`Remove ${item.name}`}
          accessibilityRole="button"
          accessibilityHint="Removes this file from the upload list"
        >
          <FontAwesome5 name="times" size={16} color={themeColors.error} />
        </TouchableOpacity>
      </Animated.View>
    </Animatable.View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo optimization
  // Only re-render if item data or index changes
  return (
    prevProps.item.uri === nextProps.item.uri &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.size === nextProps.item.size &&
    prevProps.index === nextProps.index
    // Note: We intentionally don't compare functions (onRemove, getFileIcon) or objects (themeColors, styles)
    // as they should be stable references from the parent component
  );
});

// Display name for debugging
FileListItem.displayName = 'FileListItem';

const enhancedStyles = StyleSheet.create({
  fileItem: {
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 8,
  },
  fileInfo: {
    flex: 1,
  },
  iconWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  fileIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  fileTypeBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1A2C5B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  fileTypeBadgeText: {
    color: '#D4AF37',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  fileDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileSize: {
    fontSize: 12,
    marginLeft: 4,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(220, 53, 69, 0.3)',
  },
});

export default FileListItem;
