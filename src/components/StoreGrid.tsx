import React, { useEffect, useRef } from 'react';
import { 
  View, Text, FlatList, Animated, RefreshControl, 
  ActivityIndicator, Platform 
} from 'react-native';
import StoreCard from './StoreCard'; // 👈 Imported your component
import { useLanguage } from '../context/LanguageContext';

// --- INTERFACES ---
interface Store {
  id: number;
  name: string;
  category: string;
  image_url: string;
  // We keep these optional in case your API returns them
  banner_url: string; 
  rating: number;     
}

interface StoreGridProps {
  stores: Store[];
  isLoading: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onStorePress: (store: Store) => void;
  ListHeaderComponent?: React.ReactElement | null;
  
  // Pagination Props
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  ListFooterComponent?: React.ReactElement | null;
  
  contentContainerStyle?: any; 
}

// --- ANIMATION WRAPPER ---
const FadeInWrapper = ({ children, index }: { children: React.ReactNode, index: number }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = (index % 10) * 50; 
    Animated.parallel([
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: 500, 
        delay, 
        useNativeDriver: true 
      }),
      Animated.timing(translateY, { 
        toValue: 0, 
        duration: 500, 
        delay, 
        useNativeDriver: true 
      })
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

// --- MAIN COMPONENT ---
export default function StoreGrid({
  stores,
  isLoading,
  refreshing = false,
  onRefresh,
  onStorePress,
  ListHeaderComponent,
  onEndReached,
  onEndReachedThreshold = 0.5,
  ListFooterComponent,
  contentContainerStyle
}: StoreGridProps) {
  const { t } = useLanguage();

  if (isLoading && !refreshing && stores.length === 0) {
    return (
      <View className="flex-1 items-center justify-center mt-20">
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <FlatList // Using standard FlatList since items are animated individually
      data={stores}
      keyExtractor={(item) => item.id.toString()}
      
      // 2-Column Grid
      numColumns={2} 
      columnWrapperStyle={{ justifyContent: 'space-between', gap: 8 }}
      
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      
      ListHeaderComponent={ListHeaderComponent}
      
      // Pagination Wiring
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListFooterComponent={ListFooterComponent}

      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor="#D4AF37" 
        />
      }
      
      renderItem={({ item, index }) => (
        // Wrapper for 2-column layout width
        <View style={{ width: '49%', marginBottom: 8 }}>
          <FadeInWrapper index={index}>
            <StoreCard 
              id={item.id}
              name={item.name}
              category={item.category || "Luxury"} 
              // Prioritize banner for the card image if available, else logo
              image_url={item.banner_url || item.image_url}
              rating={item.rating}
              onPress={() => onStorePress(item)}
            />
          </FadeInWrapper>
        </View>
      )}
      
      ListEmptyComponent={
        <View className="items-center justify-center pt-20">
           <Text className="text-gray-400 font-serif">{t('no_stores')}</Text>
        </View>
      }
    />
  );
}