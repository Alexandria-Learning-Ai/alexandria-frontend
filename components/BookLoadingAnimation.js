import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { Colors, AnimationColors } from '../constants/Colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const BookLoadingAnimation = ({ 
  size = 200, 
  speed = 1,
  loop = true,
  autoPlay = true,
  style,
  onAnimationFinish,
  colorOverride
}) => {
  const animationRef = useRef(null);

  useEffect(() => {
    if (autoPlay && animationRef.current) {
      animationRef.current.play();
    }
  }, [autoPlay]);

  const handleAnimationFinish = () => {
    onAnimationFinish?.();
  };

  return (
    <View style={[styles.container, style]}>
      <LottieView
        ref={animationRef}
        source={require('../assets/bookloadinganime.json')}
        style={[
          styles.animation,
          {
            width: size,
            height: size,
          }
        ]}
        autoPlay={autoPlay}
        loop={loop}
        speed={speed}
        onAnimationFinish={handleAnimationFinish}
        colorFilters={colorOverride ? [
          {
            keypath: "**",
            color: colorOverride
          }
        ] : undefined}
      />
    </View>
  );
};

const BookLoadingScreen = ({ 
  message = "Loading...", 
  showMessage = true,
  backgroundColor = Colors.primary,
  textColor = Colors.secondary,
  animationSize = 250,
  theme = 'bookLoading'
}) => {
  const themeColors = AnimationColors[theme] || AnimationColors.bookLoading;
  
  return (
    <View style={[styles.fullScreen, { backgroundColor: backgroundColor || themeColors.background }]}>
      <BookLoadingAnimation 
        size={animationSize}
        speed={1.2}
        colorOverride={textColor || themeColors.secondary}
      />
      {showMessage && (
        <Text style={[styles.loadingText, { color: textColor || themeColors.secondary }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    // Size will be overridden by props
  },
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth,
    height: screenHeight,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  }
});

export { BookLoadingAnimation, BookLoadingScreen };
export default BookLoadingAnimation;