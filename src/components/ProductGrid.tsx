// src/components/ProductGrid.tsx
import React, { useCallback } from 'react';
import { View, Text, Animated, RefreshControl, ActivityIndicator, ViewStyle, StyleProp, FlatListProps } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import ProductCard from './ProductCard';
import FadeInWrapper from './FadeInWrapper';
import { useLanguage } from '../context/LanguageContext';
import { Product } from '../types';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  onScroll?: (...args: unknown[]) => void;
  ListHeaderComponent?: React.ReactElement | null;
  ListFooterComponent?: React.ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  onProductPress: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  refreshOffset?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;

  columnWrapperStyle?: ViewStyle;
  itemContainerStyle?: ViewStyle;
  useSolidRowLayout?: boolean;
  flatListProps?: Partial<FlatListProps<Product>>;
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

  // 1. Determine Spacing Logic
  // If "Solid Row", we remove the row margin and handle it via padding inside the item
  const finalColumnWrapperStyle = [
    {
      justifyContent: 'space-between' as const,
      marginBottom: useSolidRowLayout ? 0 : 8,
      gap: useSolidRowLayout ? 0 : 8
    },
    columnWrapperStyle
  ];

  const defaultContentContainerStyle = {
    paddingHorizontal: 24,
    paddingBottom: 50,
  };

  const renderItem = useCallback(({ item, index }: { item: Product; index: number }) => (
    <View
      style={[
        { width: '49%' },
        useSolidRowLayout && { paddingBottom: 8 },
        itemContainerStyle
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
  ), [onProductPress, onAddToCart, useSolidRowLayout, itemContainerStyle]);

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

      renderItem={renderItem}

      removeClippedSubviews={true}
      maxToRenderPerBatch={6}
      windowSize={5}
      initialNumToRender={6}

      ListEmptyComponent={
        <View
          className="items-center justify-center pt-20 h-96"
          style={{ backgroundColor: 'transparent' }}
        >
          <ShoppingBag size={48} color="#E5E7EB" />
          <Text className="text-gray-400 mt-4 font-serif">{t('no_products')}</Text>
        </View>
      }

      {...flatListProps}
    />
  );
}