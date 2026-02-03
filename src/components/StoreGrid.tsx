import React from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import StoreCard from './StoreCard';
import { useLanguage } from '../context/LanguageContext';

interface Store {
  id: number;
  name: string;
  description: string;
  category: string;
  image_url?: string;
}

interface StoreGridProps {
  stores: Store[];
  isLoading: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onStorePress: (store: Store) => void;
  ListHeaderComponent?: React.ReactElement | null;
  /** Padding for the bottom of the list (e.g. to avoid bottom tabs or widgets) */
  contentPaddingBottom?: number;
}

export default function StoreGrid({
  stores,
  isLoading,
  refreshing = false,
  onRefresh,
  onStorePress,
  ListHeaderComponent,
  contentPaddingBottom = 100
}: StoreGridProps) {
  const { t } = useLanguage();

  if (isLoading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center mt-20">
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <FlatList
      data={stores}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      
      // Spacing between columns
      columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
      
      // Container spacing
      contentContainerStyle={{ 
        paddingHorizontal: 16, 
        paddingBottom: contentPaddingBottom,
        paddingTop: 0 
      }}
      
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor="#D4AF37" 
        />
      }

      ListHeaderComponent={ListHeaderComponent}

      renderItem={({ item }) => (
        <View style={{ width: '48%' }}> 
          <StoreCard 
            id={item.id}
            name={item.name}
            category={item.category || "Luxury"} 
            image_url={item.image_url}
            onPress={() => onStorePress(item)}
          />
        </View>
      )}
      
      ListEmptyComponent={
        <View className="items-center justify-center mt-10">
           <Text className="text-gray-500 font-serif">{t('no_stores')}</Text>
        </View>
      }
    />
  );
}