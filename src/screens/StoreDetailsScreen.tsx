import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Image, Animated, StatusBar, ActivityIndicator, TouchableOpacity, Dimensions
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeStackParamList, Store, Product, Review } from '../types';
import { productsApi } from '../api/products';
import { storesApi } from '../api/stores';
import { useCart } from '../context/CartContext';
import Toast from 'react-native-toast-message';
import ProductGrid from '../components/ProductGrid';
import AnimatedHeader from '../components/AnimatedHeader';
import StoreInfoHeader from '../components/StoreInfoHeader';
import ReviewsList from '../components/ReviewsList';
import { useLanguage } from '../context/LanguageContext';
import { useAbortController } from '../hooks/useAbortController';
import { handleApiError } from '../utils/handleApiError';

type Props = NativeStackScreenProps<HomeStackParamList, 'StoreDetails'>;

const BANNER_HEIGHT = 280;
const SHEET_BG_COLOR = '#F5F5F0';
const PAGE_SIZE = 20;

export default function StoreDetailsScreen({ route, navigation }: Props) {
  const { storeId, name } = route.params;
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { getSignal } = useAbortController();
  
  // --- STATE ---
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State for dynamic header fading
  const [contentSize, setContentSize] = useState<{ width: number; height: number } | null>(null);
  const [maxScrollDistance, setMaxScrollDistance] = useState(0);

  const { addToCart } = useCart();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Get viewport height from window dimensions and safe area
  const windowHeight = Dimensions.get('window').height;
  const viewportHeight = windowHeight - insets.top - insets.bottom - BANNER_HEIGHT - 60; // 60 for header and padding

  // --- ANIMATIONS ---
  const bannerScale = scrollY.interpolate({
    inputRange: [-BANNER_HEIGHT, 0],
    outputRange: [2, 1],
    extrapolate: 'clamp'
  });

  const bannerTranslateY = scrollY.interpolate({
    inputRange: [0, BANNER_HEIGHT],
    outputRange: [0, -BANNER_HEIGHT / 2],
    extrapolate: 'clamp'
  });

  // --- HANDLERS ---
  const handleContentSizeChange = (width: number, height: number) => {
    setContentSize({ width, height });
  };

  // --- EFFECTS ---
  // Calculate maxScrollDistance based on content size and viewport height
  useEffect(() => {
    if (contentSize && viewportHeight > 0) {
      const max = Math.max(0, contentSize.height - viewportHeight);
      setMaxScrollDistance(max);
    }
  }, [contentSize, viewportHeight]);

  // --- DATA FETCHING ---
  const fetchInitialData = async () => {
    const signal = getSignal();
    try {
      const productsRes = await productsApi.getAll({ store_id: storeId, limit: PAGE_SIZE, offset: 0 }, signal);

      const incomingData = productsRes.data || productsRes || [];
      const total = productsRes.total || 0;

      setProducts(incomingData);
      setTotalCount(total);
      setHasMore(incomingData.length >= PAGE_SIZE);

      try {
        const storeData = await storesApi.getById(storeId, signal);
        setStore(storeData);
      } catch (err) { /* Ignore - store info is supplementary */ }

    } catch (error: unknown) {
      handleApiError(error, { fallbackTitle: 'Store load error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchReviews = async () => {
    const signal = getSignal();
    try {
      const data = await storesApi.getReviews(storeId, signal);
      setReviews(data);
      setReviewsLoaded(true);
    } catch (error: unknown) {
      handleApiError(error, { fallbackTitle: 'Reviews error', showToast: false });
    }
  };

  useEffect(() => { fetchInitialData(); }, [storeId]);

  useEffect(() => {
    if (activeTab === 'reviews' && !reviewsLoaded) {
      fetchReviews();
    }
  }, [activeTab]);

  const fetchMoreProducts = async () => {
    if (fetchingMore || !hasMore || loading) return;
    setFetchingMore(true);
    const signal = getSignal();
    try {
      const res = await productsApi.getAll({ store_id: storeId, limit: PAGE_SIZE, offset: products.length }, signal);
      const incomingData = res.data || res || [];
      if (incomingData.length === 0) {
        setHasMore(false);
      } else {
        setProducts(prev => [...prev, ...incomingData]);
        setHasMore(incomingData.length >= PAGE_SIZE);
      }
    } catch (error: unknown) {
      handleApiError(error, { fallbackTitle: 'Load more error', showToast: false });
    } finally { setFetchingMore(false); }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    setReviewsLoaded(false); 
    fetchInitialData();
    if (activeTab === 'reviews') fetchReviews();
  };

  const displayStoreName = store?.name || name;
  const displayCategory = store?.category || t('uncategorized');
  const displayImage = store?.image_url;
  const displayBanner = store?.banner_url;

  const renderListHeader = (
    <StoreInfoHeader
      storeName={displayStoreName}
      category={displayCategory}
      imageUrl={displayImage}
      store={store}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      bannerHeight={BANNER_HEIGHT}
      sheetBgColor={SHEET_BG_COLOR}
    />
  );

  if (loading) {
    return (
      <View className="flex-1 bg-creme items-center justify-center">
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* Parallax Banner */}
      <Animated.View style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, 
        height: BANNER_HEIGHT + 50, 
        backgroundColor: '#0F0F0F', 
        transform: [{ translateY: bannerTranslateY }, { scale: bannerScale }], 
        zIndex: 0 
      }}>
        {displayBanner ? (
          <Image source={{ uri: displayBanner }} className="w-full h-full opacity-80" resizeMode="cover" />
        ) : (
          <View className="w-full h-full bg-gray-800" />
        )}
        <View className="absolute inset-0 bg-black/40" /> 
      </Animated.View>

      {/* Sticky Header */}
      <AnimatedHeader
        title={displayStoreName}
        scrollY={scrollY}
        triggerHeight={BANNER_HEIGHT - 60}
        onBackPress={() => navigation.goBack()}
        backgroundColor={SHEET_BG_COLOR}
        maxScrollDistance={maxScrollDistance}
      />

      {/* Content Switcher */}
      {activeTab === 'products' ? (
        <ProductGrid
          products={products}
          isLoading={false}
          ListHeaderComponent={renderListHeader}
          useSolidRowLayout={true}
          itemContainerStyle={{ backgroundColor: SHEET_BG_COLOR }}
          columnWrapperStyle={{ backgroundColor: SHEET_BG_COLOR, paddingHorizontal: 12 }}

          contentContainerStyle={{
              paddingBottom: 0,
              paddingHorizontal: 0,
              backgroundColor: 'transparent'
          }}

          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}

          refreshing={refreshing}
          onRefresh={onRefresh}
          refreshOffset={insets.top + 60}

          onEndReached={fetchMoreProducts}
          onEndReachedThreshold={0.5}

          ListFooterComponent={
              fetchingMore ? (
                 <View className="py-8 items-center" style={{ backgroundColor: SHEET_BG_COLOR }}>
                   <ActivityIndicator color="#D4AF37" />
                 </View>
              ) : <View style={{ height: 250, backgroundColor: SHEET_BG_COLOR }} />
          }

          onProductPress={(item) => navigation.navigate('ProductDetails', {
            productId: item.id,
            name: item.name,
            price: item.price,
            description: item.description ?? '',
            image_url: item.image_url,
            category: item.category
          })}
          onAddToCart={(item) => {
            addToCart({ id: item.id, name: item.name, price: item.price, image_url: item.image_url });
            Toast.show({ type: 'success', text1: t('added_to_bag'), text2: item.name });
          }}

          flatListProps={{
            onContentSizeChange: handleContentSizeChange,
          }}
        />
      ) : (
        // 👇 USING NEW COMPONENT
        <ReviewsList
          reviews={reviews}
          ListHeaderComponent={renderListHeader}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          onContentSizeChange={handleContentSizeChange}
        />
      )}
    </View>
  );
}