/**
 * BookHeader - Displays book cover and metadata (final TypeScript-safe version)
 * - Properly renders HTML description
 * - Auto-refreshes image when URL changes
 * - Type-safe fixes for LinearGradient + RenderHTML
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  ColorValue,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import MetadataRow from './MetadataRow';
import ExpandableText from './ExpandableText';

interface BookHeaderProps {
  title: string;
  author?: string;
  publisher?: string;
  published_date?: string;
  description?: string;
  category?: string;
  thumbnailColor: string;
  wordCount: number;
  chapterCount: number;
  cover_image_url?: string;
}

const BookHeader: React.FC<BookHeaderProps> = ({
  title,
  author,
  publisher,
  published_date,
  description,
  category,
  thumbnailColor,
  wordCount,
  chapterCount,
  cover_image_url,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const imageFadeAnim = useRef(new Animated.Value(0)).current;

  const themeColors = useMemo(
    () => ({
      background: Colors.surface,
      text: Colors.text,
      textSecondary: Colors.textSecondary,
      textMuted: Colors.textMuted,
      accent: Colors.accent,
      border: Colors.border,
    }),
    []
  );

  // Fade-in animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // CRITICAL FIX: Reset image state when URL changes (allows retry after failed load)
  useEffect(() => {
    if (cover_image_url) {
      setImageError(false);
      setImageLoaded(false);
    }
  }, [cover_image_url]);

  // Gradient colors (typed safely)
  const gradientColors = useMemo<readonly [ColorValue, ColorValue, ColorValue]>(() => {
    const baseColor = thumbnailColor || Colors.primary;
    return [baseColor, `${baseColor}CC`, `${baseColor}99`];
  }, [thumbnailColor]);

  // Ensure cover_image_url is a full HTTPS URL (backend should send presigned URL)
  const validCoverUrl = useMemo(() => {
    if (!cover_image_url) return undefined;

    // If already a valid presigned URL, use it as-is
    if (cover_image_url.startsWith('https://')) {
      return cover_image_url;
    }

    // Otherwise, construct a proper full S3 URL from key (fallback for legacy behavior)
    return `https://alxndribucket.s3.us-east-2.amazonaws.com/${cover_image_url}`;
  }, [cover_image_url]);

  const handleImageLoad = () => {
    console.log('🖼️ BookHeader: Image loaded successfully:', validCoverUrl);
    setImageLoaded(true);
    Animated.timing(imageFadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleImageError = () => {
    console.log('🖼️ BookHeader: Image load failed:', validCoverUrl);
    setImageError(true);
  };

  const shouldShowImage = !!validCoverUrl && !imageError;

  // Debug logging
  useEffect(() => {
    console.log('🖼️ BookHeader state:', {
      cover_image_url,
      validCoverUrl,
      imageLoaded,
      imageError,
      shouldShowImage,
    });
  }, [cover_image_url, validCoverUrl, imageLoaded, imageError, shouldShowImage]);

  return (
    <View style={styles.container}>
      {/* COVER IMAGE */}
      <View style={styles.coverContainer}>
        {shouldShowImage ? (
          <>
            <Animated.View style={{ opacity: imageFadeAnim }}>
              <Image
                source={{ uri: validCoverUrl }}
                style={styles.coverImage}
                onLoad={handleImageLoad}
                onError={handleImageError}
                resizeMode="cover"
              />
            </Animated.View>

            {!imageLoaded && (
              <Animated.View style={{ opacity: fadeAnim, position: 'absolute' }}>
                <LinearGradient
                  colors={gradientColors}
                  style={styles.coverGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <FontAwesome5 name="book" size={48} color={Colors.white} />
                </LinearGradient>
              </Animated.View>
            )}

            {/* DEBUG: Show error indicator (remove after QA) */}
            {imageError && (
              <View style={styles.errorIndicator}>
                <Text style={styles.errorText}>⚠️ Cover failed to load</Text>
              </View>
            )}
          </>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            <LinearGradient
              colors={[...gradientColors]}
              style={styles.coverGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <FontAwesome5 name="book" size={48} color={Colors.white} />
            </LinearGradient>
          </Animated.View>
        )}
      </View>

      {/* BOOK INFO */}
      <View style={styles.infoContainer}>
        <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={3}>
          {title}
        </Text>

        {author && (
          <Text style={[styles.author, { color: themeColors.textMuted }]} numberOfLines={2}>
            {author}
          </Text>
        )}

        {(publisher || published_date) && (
          <View style={styles.publisherRow}>
            {publisher && (
              <Text style={[styles.publisherText, { color: themeColors.textSecondary }]}>
                {publisher}
              </Text>
            )}
            {publisher && published_date && (
              <Text style={[styles.publisherText, { color: themeColors.textSecondary }]}> • </Text>
            )}
            {published_date && (
              <Text style={[styles.publisherText, { color: themeColors.textSecondary }]}>
                {published_date}
              </Text>
            )}
          </View>
        )}

        {/* DESCRIPTION - Expandable with "See More" toggle */}
        {description && (
          <View style={styles.descriptionContainer}>
            <ExpandableText
              text={description}
              numberOfLines={3}
              renderAsHtml={true}
              textStyle={{
                fontSize: 14,
                lineHeight: 21,
                color: themeColors.textSecondary,
              }}
              linkStyle={{
                color: themeColors.accent,
              }}
            />
          </View>
        )}

        {/* METADATA ROW */}
        <MetadataRow category={category} wordCount={wordCount} chapterCount={chapterCount} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  coverContainer: {
    marginRight: 16,
  },
  coverGradient: {
    width: 100,
    height: 140,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  coverImage: {
    width: 100,
    height: 140,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  infoContainer: { flex: 1 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 32,
  },
  author: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 8,
    lineHeight: 24,
  },
  publisherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  publisherText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  descriptionContainer: { marginBottom: 12 },
  errorIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    borderRadius: 4,
    padding: 4,
  },
  errorText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default BookHeader;
