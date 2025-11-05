/**
 * ExpandableText - Collapsible text component with "See More" toggle
 *
 * Features:
 * - Shows only first N lines by default
 * - Expands to show full text on tap
 * - "See More" / "See Less" toggle button
 * - Supports HTML rendering for rich text descriptions
 * - Matches Alexandria theme colors (gold accent, textSecondary)
 * - Clean, minimal design like Apple Books/Kindle
 *
 * Usage:
 *   <ExpandableText
 *     text="<p>Long description...</p>"
 *     numberOfLines={3}
 *     renderAsHtml={true}
 *   />
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutChangeEvent,
  useWindowDimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import RenderHTML from 'react-native-render-html';
import { Colors } from '../../constants/Colors';

interface ExpandableTextProps {
  text: string;
  numberOfLines?: number; // Number of lines to show when collapsed (default: 3)
  renderAsHtml?: boolean; // Whether to render as HTML (default: false)
  textStyle?: any; // Custom text style
  linkStyle?: any; // Custom "See More" link style
}

const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  numberOfLines = 3,
  renderAsHtml = false,
  textStyle,
  linkStyle,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowToggle, setShouldShowToggle] = useState(false);
  const [fullTextHeight, setFullTextHeight] = useState(0);
  const [collapsedTextHeight, setCollapsedTextHeight] = useState(0);
  const { width } = useWindowDimensions();

  // Measure full text height to determine if toggle is needed
  const handleFullTextLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setFullTextHeight(height);
  }, []);

  // Measure collapsed text height
  const handleCollapsedTextLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setCollapsedTextHeight(height);
  }, []);

  // Determine if we need to show the toggle button
  React.useEffect(() => {
    if (fullTextHeight > 0 && collapsedTextHeight > 0) {
      // Show toggle if full text is taller than collapsed text (with 5px tolerance)
      setShouldShowToggle(fullTextHeight > collapsedTextHeight + 5);
    }
  }, [fullTextHeight, collapsedTextHeight]);

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  // HTML rendering mode
  if (renderAsHtml) {
    return (
      <View>
        {/* Measure full HTML (hidden) */}
        <View style={styles.measureText} onLayout={handleFullTextLayout}>
          <RenderHTML
            contentWidth={width - 40}
            source={{ html: text }}
            baseStyle={{ ...styles.text, ...textStyle }}
            tagsStyles={{
              b: { fontWeight: '700' },
              i: { fontStyle: 'italic' },
              p: { marginBottom: 4 },
            }}
          />
        </View>

        {/* Measure collapsed HTML (hidden) */}
        <View style={styles.measureText} onLayout={handleCollapsedTextLayout}>
          <RenderHTML
            contentWidth={width - 40}
            source={{ html: text }}
            baseStyle={{ ...styles.text, ...textStyle }}
            tagsStyles={{
              b: { fontWeight: '700' },
              i: { fontStyle: 'italic' },
              p: { marginBottom: 4 },
            }}
          />
        </View>

        {/* Actual displayed HTML */}
        <View
          style={
            !isExpanded && collapsedTextHeight > 0
              ? { maxHeight: collapsedTextHeight, overflow: 'hidden' }
              : undefined
          }
        >
          <RenderHTML
            contentWidth={width - 40}
            source={{ html: text }}
            baseStyle={{ ...styles.text, ...textStyle }}
            tagsStyles={{
              b: { fontWeight: '700' },
              i: { fontStyle: 'italic' },
              p: { marginBottom: 4 },
            }}
          />
        </View>

        {/* See More / See Less toggle */}
        {shouldShowToggle && (
          <TouchableOpacity
            onPress={toggleExpansion}
            style={styles.toggleButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.toggleText, linkStyle]}>
              {isExpanded ? 'See Less' : 'See More'}
            </Text>
            <FontAwesome5
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={linkStyle?.color || Colors.accent}
              style={styles.toggleIcon}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Plain text rendering mode
  return (
    <View>
      {/* Measure full text (hidden) */}
      <Text
        style={[styles.measureText, textStyle]}
        onLayout={handleFullTextLayout}
        numberOfLines={undefined}
      >
        {text}
      </Text>

      {/* Measure collapsed text (hidden) */}
      <Text
        style={[styles.measureText, textStyle]}
        onLayout={handleCollapsedTextLayout}
        numberOfLines={numberOfLines}
      >
        {text}
      </Text>

      {/* Actual displayed text */}
      <Text
        style={[styles.text, textStyle]}
        numberOfLines={isExpanded ? undefined : numberOfLines}
      >
        {text}
      </Text>

      {/* See More / See Less toggle */}
      {shouldShowToggle && (
        <TouchableOpacity
          onPress={toggleExpansion}
          style={styles.toggleButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.toggleText, linkStyle]}>
            {isExpanded ? 'See Less' : 'See More'}
          </Text>
          <FontAwesome5
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={linkStyle?.color || Colors.accent}
            style={styles.toggleIcon}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  measureText: {
    position: 'absolute',
    opacity: 0,
    zIndex: -1,
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
    marginRight: 6,
  },
  toggleIcon: {
    marginTop: 1,
  },
});

export default ExpandableText;
