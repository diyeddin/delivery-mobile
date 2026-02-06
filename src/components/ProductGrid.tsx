import React, { useEffect, useRef } from 'react'; // <--- Import useEffect, useRef
import { View, Text, Animated, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import ProductCard from './ProductCard';
import { useLanguage } from '../context/LanguageContext';

const CREME_COLOR = '#F5F5F0'; 

// 👇 1. CREATE THIS ANIMATION COMPONENT
const FadeInWrapper = ({ children, index }: { children: React.ReactNode, index: number }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current; // Slide up slightly

  useEffect(() => {
    // Stagger the animation slightly based on index to create a "waterfall" effect
    // modulo 10 keeps the delay short even for items deep in the list
    const delay = (index % 10) * 50; 

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}
      renderToHardwareTextureAndroid={true} 
      needsOffscreenAlphaCompositing={Platform.OS === 'android'}
      >
      {children}
    </Animated.View>
  );
};

// ... Interfaces remain the same ...
interface Product {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  description?: string;
}

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
  onEndReachedThreshold = 0.5
}: ProductGridProps) {
  const { t } = useLanguage();
  
  if (isLoading && !refreshing && products.length === 0) {
    return (
      <View className="flex-1 items-center justify-center mt-40">
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <Animated.FlatList
      data={products}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}

      contentContainerStyle={contentContainerStyle}
      columnWrapperStyle={{ backgroundColor: CREME_COLOR }}
      
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
      
      renderItem={({ item, index }) => ( // <--- Grab index
        <View style={{ width: '50%', padding: 8, backgroundColor: CREME_COLOR }}>
          {/* 👇 2. WRAP CARD IN ANIMATION */}
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
          style={{ backgroundColor: CREME_COLOR }}
        >
          <ShoppingBag size={48} color="#E5E7EB" />
          <Text className="text-gray-400 mt-4 font-serif">{t('no_products')}</Text>
        </View>
      }
    />
  );
}