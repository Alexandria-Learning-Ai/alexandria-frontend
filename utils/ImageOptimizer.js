/**
 * ImageOptimizer - Image optimization and asset management
 * Provides intelligent image loading, caching, and optimization
 */

import { Image, Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export class ImageOptimizer {
  constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
    this.compressionCache = new Map();
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      compressionSavings: 0,
      loadTimes: []
    };
  }

  /**
   * Get optimized image source based on screen density and size
   */
  getOptimizedSource(source, targetWidth = null, targetHeight = null) {
    if (!source) return null;

    // Handle static require() sources
    if (typeof source === 'number') {
      return source;
    }

    // Handle URI sources
    if (source.uri) {
      return {
        ...source,
        uri: this.optimizeImageUrl(source.uri, targetWidth, targetHeight)
      };
    }

    return source;
  }

  /**
   * Optimize image URL with query parameters for resizing
   */
  optimizeImageUrl(url, targetWidth, targetHeight) {
    if (!url || url.startsWith('file://') || url.startsWith('data:')) {
      return url;
    }

    const pixelRatio = Platform.select({
      ios: 2, // Assume 2x for iOS
      android: 2, // Assume 2x for Android
      default: 1
    });

    // Calculate optimal dimensions
    const optimalWidth = targetWidth ? Math.ceil(targetWidth * pixelRatio) : screenWidth * pixelRatio;
    const optimalHeight = targetHeight ? Math.ceil(targetHeight * pixelRatio) : screenHeight * pixelRatio;

    // Add optimization parameters if the URL supports them
    // This is a generic approach - you'd customize this for your image service
    if (url.includes('cloudinary.com') || url.includes('imgix.com')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}w=${optimalWidth}&h=${optimalHeight}&f=auto&q=auto`;
    }

    return url;
  }

  /**
   * Preload images for better performance
   */
  async preloadImages(sources, priority = 'normal') {
    const preloadPromises = sources.map(source => this.preloadImage(source));
    
    if (priority === 'high') {
      // Load all immediately
      return Promise.all(preloadPromises);
    } else {
      // Load with delay to avoid blocking
      return this.batchPreload(preloadPromises, 3, 100);
    }
  }

  /**
   * Preload a single image
   */
  async preloadImage(source) {
    const optimizedSource = this.getOptimizedSource(source);
    
    if (!optimizedSource || typeof optimizedSource === 'number') {
      return; // Skip static assets
    }

    const uri = optimizedSource.uri || optimizedSource;
    const cacheKey = this.getCacheKey(uri);

    // Check if already cached
    if (this.cache.has(cacheKey)) {
      this.metrics.cacheHits++;
      return this.cache.get(cacheKey);
    }

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    // Start preloading
    const loadPromise = this.performImagePreload(uri, cacheKey);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      this.cache.set(cacheKey, result);
      return result;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Perform the actual image preload
   */
  async performImagePreload(uri, cacheKey) {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    return new Promise((resolve, reject) => {
      Image.prefetch(uri)
        .then(() => {
          const loadTime = Date.now() - startTime;
          this.metrics.loadTimes.push(loadTime);
          
          resolve({
            uri,
            cached: true,
            loadTime,
            timestamp: Date.now()
          });
        })
        .catch(error => {
          logger.warn('Image preload failed:', uri, error);
          reject(error);
        });
    });
  }

  /**
   * Batch preload with controlled concurrency
   */
  async batchPreload(promises, batchSize = 3, delay = 100) {
    const results = [];
    
    for (let i = 0; i < promises.length; i += batchSize) {
      const batch = promises.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(batch);
      
      results.push(...batchResults);
      
      // Add delay between batches
      if (i + batchSize < promises.length && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return results;
  }

  /**
   * Generate cache key for image
   */
  getCacheKey(uri) {
    if (!uri) return 'empty';
    
    // Simple hash function for URI
    let hash = 0;
    for (let i = 0; i < uri.length; i++) {
      const char = uri.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `img_${Math.abs(hash)}`;
  }

  /**
   * Clear image cache
   */
  clearCache() {
    this.cache.clear();
    this.loadingPromises.clear();
    this.compressionCache.clear();
    
    // Clear React Native image cache
    if (Image.clearMemoryCache) {
      Image.clearMemoryCache();
    }
    
    if (Image.clearDiskCache) {
      Image.clearDiskCache();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const totalLoadTime = this.metrics.loadTimes.reduce((sum, time) => sum + time, 0);
    const averageLoadTime = this.metrics.loadTimes.length > 0 
      ? totalLoadTime / this.metrics.loadTimes.length 
      : 0;

    return {
      cacheSize: this.cache.size,
      totalRequests: this.metrics.totalRequests,
      cacheHits: this.metrics.cacheHits,
      hitRate: this.metrics.totalRequests > 0 
        ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100 
        : 0,
      averageLoadTime,
      compressionSavings: this.metrics.compressionSavings
    };
  }

  /**
   * Analyze image assets in the project
   */
  async analyzeAssets() {
    try {
      // Simplified analysis - returns optimization recommendations
      return {
        totalImages: 0,
        totalSize: '0MB',
        largeImages: [],
        recommendations: [
          'Convert PNG images to WebP where supported',
          'Use vector graphics (SVG) for icons and simple graphics',
          'Implement responsive images with multiple sizes',
          'Consider using image CDN for dynamic optimization'
        ],
        breakdown: {
          icons: { count: 0, size: '0KB' },
          backgrounds: { count: 0, size: '0KB' },
          illustrations: { count: 0, size: '0KB' },
          photos: { count: 0, size: '0KB' }
        }
      };
    } catch (error) {
      logger.warn('Failed to analyze assets:', error);
      return { error: 'Failed to analyze assets' };
    }
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations() {
    const stats = this.getCacheStats();
    const recommendations = [];

    if (stats.hitRate < 50) {
      recommendations.push({
        type: 'caching',
        priority: 'high',
        message: 'Low cache hit rate detected. Consider preloading critical images.',
        action: 'Implement strategic image preloading'
      });
    }

    if (stats.averageLoadTime > 1000) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'Slow image load times detected.',
        action: 'Optimize image sizes and implement progressive loading'
      });
    }

    if (stats.cacheSize > 100) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        message: 'Large image cache detected.',
        action: 'Implement cache size limits and automatic cleanup'
      });
    }

    return recommendations;
  }
}

/**
 * Optimized Image component with built-in optimization
 */
export const OptimizedImage = ({
  source,
  style,
  targetWidth,
  targetHeight,
  placeholder = null,
  onLoad = null,
  onError = null,
  preload = false,
  progressive = true,
  ...props
}) => {
  const optimizer = React.useRef(new ImageOptimizer()).current;
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [loadTime, setLoadTime] = React.useState(0);

  const optimizedSource = React.useMemo(() => {
    return optimizer.getOptimizedSource(source, targetWidth, targetHeight);
  }, [source, targetWidth, targetHeight]);

  React.useEffect(() => {
    if (preload && optimizedSource) {
      optimizer.preloadImage(optimizedSource);
    }
  }, [optimizedSource, preload]);

  const handleLoad = (event) => {
    setLoading(false);
    setLoadTime(Date.now() - startTime);
    
    if (onLoad) {
      onLoad(event);
    }
  };

  const handleError = (event) => {
    setLoading(false);
    setError(true);
    
    if (onError) {
      onError(event);
    }
  };

  const startTime = React.useRef(Date.now()).current;

  if (error && placeholder) {
    return placeholder;
  }

  return (
    <Image
      source={optimizedSource}
      style={style}
      onLoad={handleLoad}
      onError={handleError}
      progressiveRenderingEnabled={progressive}
      {...props}
    />
  );
};

/**
 * Progressive Image Loader with blur-to-sharp transition
 */
export const ProgressiveImage = ({
  source,
  lowQualitySource,
  style,
  blurRadius = 10,
  transition = true,
  ...props
}) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [lowQualityLoaded, setLowQualityLoaded] = React.useState(false);

  return (
    <View style={style}>
      {/* Low quality image */}
      {lowQualitySource && (
        <Image
          source={lowQualitySource}
          style={[StyleSheet.absoluteFillObject, { blurRadius: imageLoaded ? 0 : blurRadius }]}
          onLoad={() => setLowQualityLoaded(true)}
          {...props}
        />
      )}
      
      {/* High quality image */}
      <Image
        source={source}
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: imageLoaded ? 1 : 0,
          }
        ]}
        onLoad={() => setImageLoaded(true)}
        {...props}
      />
    </View>
  );
};

/**
 * Smart Image Grid with lazy loading and optimization
 */
export const SmartImageGrid = ({
  images,
  numColumns = 2,
  imageStyle = {},
  containerStyle = {},
  onImagePress = null,
  lazyLoad = true,
  preloadCount = 6
}) => {
  const optimizer = React.useRef(new ImageOptimizer()).current;
  const [visibleImages, setVisibleImages] = React.useState(
    lazyLoad ? images.slice(0, preloadCount) : images
  );

  const imageWidth = (screenWidth - 60 - (10 * (numColumns - 1))) / numColumns;

  React.useEffect(() => {
    if (lazyLoad && images.length > preloadCount) {
      // Gradually load more images
      const timer = setTimeout(() => {
        setVisibleImages(images.slice(0, preloadCount + 4));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [images, preloadCount, lazyLoad]);

  React.useEffect(() => {
    // Preload visible images
    if (visibleImages.length > 0) {
      optimizer.preloadImages(visibleImages.map(img => img.source), 'high');
    }
  }, [visibleImages]);

  const renderImage = (item, index) => (
    <TouchableOpacity
      key={index}
      style={[styles.gridItem, { width: imageWidth }, imageStyle]}
      onPress={() => onImagePress && onImagePress(item, index)}
    >
      <OptimizedImage
        source={item.source}
        style={styles.gridImage}
        targetWidth={imageWidth}
        targetHeight={imageWidth}
        preload={index < preloadCount}
      />
      {item.title && (
        <Text style={styles.imageTitle} numberOfLines={1}>
          {item.title}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.gridContainer, containerStyle]}>
      <FlatList
        data={visibleImages}
        renderItem={({ item, index }) => renderImage(item, index)}
        numColumns={numColumns}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        initialNumToRender={preloadCount}
        maxToRenderPerBatch={4}
        windowSize={10}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: imageWidth + 20,
          offset: (imageWidth + 20) * Math.floor(index / numColumns),
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flex: 1,
    padding: 20,
  },
  gridItem: {
    marginBottom: 10,
    marginHorizontal: 5,
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  imageTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  separator: {
    height: 10,
  },
});

// Create singleton instance
const imageOptimizer = new ImageOptimizer();

export { imageOptimizer };
export default ImageOptimizer;