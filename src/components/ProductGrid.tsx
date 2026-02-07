// src/components/ProductGrid.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, RefreshControl, ActivityIndicator, Platform, ViewStyle } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import ProductCard from './ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { Product } from '../types';

const CREME_COLOR = '#F5F5F0'; 

const FadeInWrapper = ({ children, index }: { children: React.ReactNode, index: number }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = (index % 10) * 50; 
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay, useNativeDriver: true })
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
};

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  onScroll?: any;
  ListHeaderComponent?: React.ReactElement | null;
  ListFooterComponent?: React.ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  onProductPress: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  refreshOffset?: number;
  contentContainerStyle?: any;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  
  // 👇 NEW: Advanced Props for Parallax/Sheet Layouts
  columnWrapperStyle?: ViewStyle;
  itemContainerStyle?: ViewStyle;
  /** If true, uses padding inside the item for spacing instead of margin. 
   * This is required for solid background sheets to prevent "black lines" */
  useSolidRowLayout?: boolean; 
  /** Passes raw props to the internal FlatList */
  flatListProps?: any;
}

export default function ProductGrid({
  products,
  isLoading,
  onScroll,
  ListHeaderComponent,
  ListFooterComponent,
  refreshing = false,
  onRefresh,
  onProductPress,
  onAddToCart,
  refreshOffset = 0,
  contentContainerStyle,
  onEndReached,
  onEndReachedThreshold = 0.5,
  
  // Default Styles
  columnWrapperStyle,
  itemContainerStyle,
  useSolidRowLayout = false,
  flatListProps,
}: ProductGridProps) {
  const { t } = useLanguage();
  
  if (isLoading && !refreshing && products.length === 0) {
    return (
      <View className="flex-1 items-center justify-center mt-40">
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  // 1. Determine Spacing Logic
  // If "Solid Row", we remove the row margin and handle it via padding inside the item
  const finalColumnWrapperStyle = [
    { 
      justifyContent: 'space-between', 
      marginBottom: useSolidRowLayout ? 0 : 8, // No margin if solid layout
      gap: useSolidRowLayout ? 0 : 8   // We handle spacing manually in solid layout
    },
    columnWrapperStyle
  ];

  const defaultContentContainerStyle = {
    paddingHorizontal: 24,
    paddingBottom: 50,
  };

  return (
    <Animated.FlatList
      data={products}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}

      contentContainerStyle={[defaultContentContainerStyle, contentContainerStyle]}
      columnWrapperStyle={finalColumnWrapperStyle}
      
      onScroll={onScroll}
      scrollEventThrottle={16}
      
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor="#D4AF37"
          progressViewOffset={refreshOffset} 
        />
      }
      
      renderItem={({ item, index }) => (
        <View 
          style={[
            { width: '49%' }, // Standard width
            useSolidRowLayout && { paddingBottom: 8 }, // Padding creates the "gap"
            itemContainerStyle // Background color passed here
          ]}
        >
          <FadeInWrapper index={index}>
            <ProductCard 
              name={item.name}
              price={item.price}
              image_url={item.image_url}
              category={item.category ?? ''}
              onPress={() => onProductPress(item)}
              onAddToCart={() => onAddToCart(item)}
            />
          </FadeInWrapper>
        </View>
      )}
      
      ListEmptyComponent={
        <View 
          className="items-center justify-center pt-20 h-96" 
          style={{ backgroundColor: 'transparent' }} // Let parent decide bg
        >
          <ShoppingBag size={48} color="#E5E7EB" />
          <Text className="text-gray-400 mt-4 font-serif">{t('no_products')}</Text>
        </View>
      }
      
      {...flatListProps}
    />
  );
}