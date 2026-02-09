import React, { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';

interface FadeInWrapperProps {
  children: React.ReactNode;
  index: number;
}

export default function FadeInWrapper({ children, index }: FadeInWrapperProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = (index % 10) * 50;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY }], flex: 1 }}
      renderToHardwareTextureAndroid={true}
      needsOffscreenAlphaCompositing={Platform.OS === 'android'}
    >
      {children}
    </Animated.View>
  );
}
