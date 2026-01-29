import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, StatusBar, ActivityIndicator } from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeStackParamList } from '../types';
import client from '../api/client';
import { useCart } from '../context/CartContext';
import Toast from 'react-native-toast-message';
import ProductGrid from '../components/ProductGrid';
import AnimatedHeader from '../components/AnimatedHeader';

type Props = NativeStackScreenProps<HomeStackParamList, 'StoreDetails'>;

const BANNER_HEIGHT = 260; 
const SHEET_BG_COLOR = '#F9F8F6';

export default function StoreDetailsScreen({ route, navigation }: Props) {
  const { storeId, name } = route.params;
  const insets = useSafeAreaInsets();
  
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  
  // Store name animation - fades out from sheet as we scroll
  const sheetTitleOpacity = scrollY.interpolate({ 
    inputRange: [BANNER_HEIGHT - 140, BANNER_HEIGHT - 100], 
    outputRange: [1, 0], 
    extrapolate: 'clamp' 
  });

  const fetchData = useCallback(async () => {
    try {
      const [storeRes, productsRes] = await Promise.all([
        client.get(`/stores/${storeId}`),
        client.get(`/products/?store_id=${storeId}`)
      ]);
      setStore(storeRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error("Failed to load store", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    fetchData();
  };

  const displayStoreName = store?.name || name; 
  const displayCategory = store?.category || 'Store';

  // Show full-screen loading on initial load
  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-creme items-center justify-center">
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text className="text-gray-500 mt-4 font-serif">Loading store...</Text>
      </View>
    );
  }

  // --- SHEET HEADER ---
  const renderListHeader = (
    <View>
      {/* 1. Transparent Spacer (Reveals Banner) */}
      <View style={{ height: BANNER_HEIGHT, backgroundColor: 'transparent' }} />
      
      {/* 2. Sheet Start (Solid Background) */}
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
            {/* Animated store name that fades out as we scroll */}
            <Animated.View style={{ opacity: sheetTitleOpacity }}>
              <Text className="text-2xl font-serif font-bold text-onyx" numberOfLines={2}>
                {displayStoreName}
              </Text>
            </Animated.View>
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

      {/* Layer 1: Banner (Absolute Top) */}
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

      {/* Layer 2: Reusable Animated Header */}
      <AnimatedHeader
        title={displayStoreName}
        scrollY={scrollY}
        triggerHeight={BANNER_HEIGHT}
        onBackPress={() => navigation.goBack()}
        backgroundColor={SHEET_BG_COLOR}
      />

      {/* Layer 3: Product Grid */}
      <ProductGrid 
        products={products}
        isLoading={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }], 
          { useNativeDriver: true }
        )}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={<View className="h-20" />}
        contentContainerStyle={{ 
          paddingBottom: 0, 
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
            text1: 'Added', 
            text2: `${item.name} added to cart.` 
          });
        }}
      />
    </View>
  );
}