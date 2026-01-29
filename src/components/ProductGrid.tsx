import React from 'react';
import { View, Text, Animated, RefreshControl, ActivityIndicator } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import ProductCard from './ProductCard';

// This must match the background color of your "Sheet" header in StoreDetailsScreen
const SHEET_BG_COLOR = '#F9F8F6'; 

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
  contentContainerStyle
}: ProductGridProps) {
  if (isLoading && !refreshing) {
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
      
      // Pass styling from parent (usually transparent to let banner show at top)
      contentContainerStyle={contentContainerStyle}
      
      // CRITICAL: This gives the grid rows a solid background. 
      // Without this, you see the banner image through the gaps as you scroll up.
      columnWrapperStyle={{ backgroundColor: SHEET_BG_COLOR }}
      
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
      
      renderItem={({ item }) => (
        // Ensure the item container is also solid to prevent banner bleed-through
        <View style={{ width: '50%', padding: 8, backgroundColor: SHEET_BG_COLOR }}>
          <ProductCard 
            name={item.name}
            price={item.price}
            image_url={item.image_url}
            category={item.category ?? ''}
            onPress={() => onProductPress(item)}
            onAddToCart={() => onAddToCart(item)}
          />
        </View>
      )}
      
      ListEmptyComponent={
        // Empty state needs a solid background too
        <View 
          className="items-center justify-center pt-20 h-96" 
          style={{ backgroundColor: SHEET_BG_COLOR }}
        >
          <ShoppingBag size={48} color="#E5E7EB" />
          <Text className="text-gray-400 mt-4 font-serif">No products found.</Text>
        </View>
      }
    />
  );
}