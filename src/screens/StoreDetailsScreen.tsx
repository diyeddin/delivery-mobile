import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Image, Animated, StatusBar, ActivityIndicator } from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeStackParamList } from '../types';
import client from '../api/client';
import { useCart } from '../context/CartContext';
import Toast from 'react-native-toast-message';
import ProductGrid from '../components/ProductGrid';
import AnimatedHeader from '../components/AnimatedHeader';
import { useLanguage } from '../context/LanguageContext';

type Props = NativeStackScreenProps<HomeStackParamList, 'StoreDetails'>;

const BANNER_HEIGHT = 260; 
const SHEET_BG_COLOR = '#F5F5F0';
const PAGE_SIZE = 20; // ⚡ Matches backend limit

export default function StoreDetailsScreen({ route, navigation }: Props) {
  const { storeId, name } = route.params;
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  
  // --- STATE ---
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  
  // Loading States
  const [loading, setLoading] = useState(true);           // Full screen load (first time)
  const [refreshing, setRefreshing] = useState(false);    // Pull to refresh
  const [fetchingMore, setFetchingMore] = useState(false);// Bottom spinner
  const [hasMore, setHasMore] = useState(true);           // Are there more products?

  const { addToCart } = useCart();
  const scrollY = useRef(new Animated.Value(0)).current;

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

  // --- 1. INITIAL FETCH (Store + Page 1) ---
  const fetchInitialData = useCallback(async () => {
    try {
      // Fetch Store Info AND First Page of Products in parallel
      const [storeRes, productsRes] = await Promise.all([
        client.get(`/stores/${storeId}`),
        client.get(`/products/`, { 
          params: { store_id: storeId, limit: PAGE_SIZE, offset: 0 } 
        })
      ]);

      setStore(storeRes.data);
      setProducts(productsRes.data);
      
      // Check if we already hit the end
      setHasMore(productsRes.data.length >= PAGE_SIZE);

    } catch (error) {
      console.error("Failed to load store", error);
      Toast.show({ type: 'error', text1: t('error') });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId, t]);

  // --- 2. LOAD MORE (Pagination) ---
  const fetchMoreProducts = async () => {
    if (fetchingMore || !hasMore || loading) return;

    setFetchingMore(true);
    try {
      const currentOffset = products.length;
      const res = await client.get(`/products/`, {
        params: { 
          store_id: storeId, 
          limit: PAGE_SIZE, 
          offset: currentOffset 
        }
      });
      
      const newItems = res.data;
      
      if (newItems.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setProducts(prev => [...prev, ...newItems]);

    } catch (error) {
      console.error("Pagination error:", error);
    } finally {
      setFetchingMore(false);
    }
  };

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  const onRefresh = async () => {
    setRefreshing(true);
    setHasMore(true); // Reset flag
    await fetchInitialData();
  };

  const displayStoreName = store?.name || name; 
  const displayCategory = store?.category || 'Store';

  // Initial Loading View
  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-creme items-center justify-center">
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  // --- RENDER HEADER (Pass to ProductGrid) ---
  const renderListHeader = (
    <View>
      <View style={{ height: BANNER_HEIGHT, backgroundColor: 'transparent' }} />
      <View 
        style={{ 
          position: 'absolute', 
          top: BANNER_HEIGHT, 
          left: 0, 
          right: 0, 
          height: 10000, 
          backgroundColor: SHEET_BG_COLOR,
          zIndex: -1 
        }}
      />
      <View style={{ backgroundColor: SHEET_BG_COLOR }} className="-mt-6 rounded-t-3xl pt-2 pb-6 px-6 shadow-sm border-b border-gray-100">
        <View className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 opacity-40" />
        <View className="flex-row gap-4">
          <View className="-mt-14 w-24 h-24 rounded-full border-4 border-creme bg-white items-center justify-center overflow-hidden shadow-md">
            {store?.image_url ? (
              <Image source={{ uri: `${store.image_url}?t=${storeId}` }} className="w-full h-full" />
            ) : (
              <Text className="text-3xl font-serif text-onyx font-bold">{displayStoreName.charAt(0)}</Text>
            )}
          </View>
          <View className="flex-1 pt-1">
            <Text className="text-2xl font-serif font-bold text-onyx" numberOfLines={2}>
              {displayStoreName}
            </Text>
            <View className="flex-row items-center gap-2 mt-2">
              <View className="bg-onyx/5 px-2 py-0.5 rounded-md">
                <Text className="text-xs font-bold text-onyx uppercase tracking-wider">
                  {displayCategory}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Star size={12} color="#D4AF37" fill="#D4AF37" />
                <Text className="text-xs text-gray-500 font-bold">4.9</Text>
              </View>
            </View>
          </View>
        </View>
        {store?.address && (
          <View className="mt-4 flex-row items-center gap-2">
            <MapPin size={14} color="#6b7280" />
            <Text className="text-gray-500 text-xs">{store.address}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: SHEET_BG_COLOR }}> 
      <StatusBar barStyle="light-content" />

      {/* Layer 1: Parallax Banner */}
      <Animated.View style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        height: BANNER_HEIGHT + 50, 
        backgroundColor: '#0F0F0F', 
        transform: [{ translateY: bannerTranslateY }, { scale: bannerScale }], 
        zIndex: 0 
      }}>
        {store?.banner_url ? (
          <Image 
            source={{ uri: `${store.banner_url}?t=${storeId}` }} 
            className="w-full h-full opacity-90" 
            resizeMode="cover" 
          />
        ) : (
          <View className="w-full h-full bg-onyx opacity-90" />
        )}
        <View className="absolute inset-0 bg-black/30" /> 
      </Animated.View>

      {/* Layer 2: Animated Header (Back Button) */}
      <AnimatedHeader
        title={displayStoreName}
        scrollY={scrollY}
        triggerHeight={BANNER_HEIGHT}
        onBackPress={() => navigation.goBack()}
        backgroundColor={SHEET_BG_COLOR}
      />

      {/* Layer 3: Paginated Product Grid */}
      <ProductGrid 
        products={products}
        isLoading={false}
        
        // 👇 PAGINATION WIRED UP HERE
        onEndReached={fetchMoreProducts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          fetchingMore ? (
            <View className="py-6 bg-[#F5F5F0]">
              <ActivityIndicator color="#D4AF37" />
            </View>
          ) : <View className="h-24 bg-[#F5F5F0]" />
        }

        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }], 
          { useNativeDriver: true }
        )}
        
        ListHeaderComponent={renderListHeader}
        
        contentContainerStyle={{ 
          paddingBottom: 0, 
          marginTop: 0,
          backgroundColor: 'transparent' 
        }}
        
        refreshing={refreshing}
        onRefresh={onRefresh}
        refreshOffset={insets.top + 60}
        
        onProductPress={(item) => navigation.navigate('ProductDetails', {
          productId: item.id, 
          name: item.name, 
          price: item.price, 
          description: item.description ?? '', 
          image_url: item.image_url
        })}
        onAddToCart={(item) => {
          addToCart({ 
            id: item.id, 
            name: item.name, 
            price: item.price, 
            image_url: item.image_url 
          });
          Toast.show({ 
            type: 'success', 
            text1: t('added_to_bag'), 
            text2: item.name 
          });
        }}
      />
    </View>
  );
}