import React, { useCallback } from 'react';
import {
  View, Text, FlatList, RefreshControl,
  ActivityIndicator, StyleProp, ViewStyle
} from 'react-native';
import StoreCard from './StoreCard';
import FadeInWrapper from './FadeInWrapper';
import { useLanguage } from '../context/LanguageContext';
import { Store } from '../types';

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

  contentContainerStyle?: StyleProp<ViewStyle>;
}

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

  const renderItem = useCallback(({ item, index }: { item: Store; index: number }) => (
    <View style={{ width: '49%', marginBottom: 8 }}>
      <FadeInWrapper index={index}>
        <StoreCard
          id={item.id}
          name={item.name}
          category={item.category || "Luxury"}
          image_url={item.banner_url || item.image_url}
          rating={item.rating}
          onPress={() => onStorePress(item)}
        />
      </FadeInWrapper>
    </View>
  ), [onStorePress]);

  if (isLoading && !refreshing && stores.length === 0) {
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
      columnWrapperStyle={{ justifyContent: 'space-between', gap: 8 }}

      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}

      ListHeaderComponent={ListHeaderComponent}

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

      renderItem={renderItem}

      removeClippedSubviews={true}
      maxToRenderPerBatch={6}
      windowSize={5}
      initialNumToRender={6}

      ListEmptyComponent={
        <View className="items-center justify-center pt-20">
           <Text className="text-gray-400 font-serif">{t('no_stores')}</Text>
        </View>
      }
    />
  );
}