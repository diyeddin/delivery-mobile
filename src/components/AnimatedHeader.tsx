import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';

interface AnimatedHeaderProps {
  /** Title to display in the header */
  title: string;
  
  /** Animated value for scroll position */
  scrollY: Animated.Value;
  
  /** Height at which header becomes fully visible */
  triggerHeight?: number;
  
  /** Callback when back button is pressed */
  onBackPress: () => void;
  
  /** Background color of the header (default: '#F9F8F6') */
  backgroundColor?: string;
  
  /** Optional right side action button */
  rightAction?: React.ReactNode;
  
  /** Custom header height (default: 50) */
  headerHeight?: number;
}

export default function AnimatedHeader({
  title,
  scrollY,
  triggerHeight = 260,
  onBackPress,
  backgroundColor = '#F9F8F6',
  rightAction,
  headerHeight = 50,
}: AnimatedHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isRTL } = useLanguage();

  // Animation interpolations
  const headerOpacity = scrollY.interpolate({
    inputRange: [triggerHeight - 120, triggerHeight - 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [triggerHeight - 100, triggerHeight - 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [triggerHeight - 100, triggerHeight - 60],
    outputRange: [10, 0],
    extrapolate: 'clamp',
  });

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { height: insets.top + headerHeight, paddingTop: insets.top }]}
    >
      {/* Header background that fades in */}
      <Animated.View
        style={[styles.backgroundBase, { opacity: headerOpacity, backgroundColor }]}
      />

      {/* Header content */}
      <View
        style={styles.contentRow}
      >
        {/* Back button - Always visible */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            onPress={onBackPress}
            style={styles.backButtonTouchable}
            activeOpacity={0.7}
          >
            {/* White back button with background (visible when header is transparent) */}
            <Animated.View
              style={[styles.backButtonOverlay, {
                opacity: headerOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
              }]}
            >
              <View style={styles.darkCircle}>
                <ArrowLeft color="#FFFFFF" size={20} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
              </View>
            </Animated.View>

            {/* Dark back button (visible when header is solid) */}
            <Animated.View
              style={[styles.backButtonOverlay, { opacity: headerOpacity }]}
            >
              <ArrowLeft color="#0F0F0F" size={24} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Title in header - slides up and fades in */}
        <Animated.View
          style={[styles.titleContainer, {
            right: rightAction ? 60 : 60,
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          }]}
        >
          <Text
            style={styles.titleText}
            numberOfLines={1}
          >
            {title}
          </Text>
        </Animated.View>

        {/* Optional right action */}
        {rightAction && (
          <View style={styles.rightAction}>
            {rightAction}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  backgroundBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 15, 15, 0.05)',
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  backButtonTouchable: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonOverlay: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkCircle: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    position: 'absolute',
    left: 60,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F0F0F',
    fontFamily: 'System',
  },
  rightAction: {
    width: 40,
    height: 40,
  },
});