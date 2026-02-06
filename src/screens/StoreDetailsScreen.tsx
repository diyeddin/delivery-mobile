import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, Image, Animated, StatusBar, ActivityIndicator 
} from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeStackParamList } from '../types';
import client from '../api/client';
import { useCart } from '../context/CartContext';
import Toast from 'react-native-toast-message';
import ProductGrid from '../components/ProductGrid';
import AnimatedHeader from '../components/AnimatedHeader';
import PaginationBadge from '../components/PaginationBadge'; 
import { useLanguage } from '../context/LanguageContext';

type Props = NativeStackScreenProps<HomeStackParamList, 'StoreDetails'>;

const BANNER_HEIGHT = 280;
const SHEET_BG_COLOR = '#F5F5F0';
const PAGE_SIZE = 4;

export default function StoreDetailsScreen({ route, navigation }: Props) {
  const { storeId, name } = route.params;
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  
  // --- STATE ---
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0); 
  
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
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

  // --- DATA FETCHING ---
  const fetchInitialData = async () => {
    try {
      const productsRes = await client.get(`/products/`, { 
        params: { store_id: storeId, limit: PAGE_SIZE, offset: 0 } 
      });

      const incomingData = productsRes.data.data || productsRes.data || [];
      const total = productsRes.data.total || 0;

      setProducts(incomingData);
      setTotalCount(total);
      
      // Robust Logic
      setHasMore(incomingData.length >= PAGE_SIZE);

      try {
        const storeRes = await client.get(`/stores/${storeId}`);
        setStore(storeRes.data);
      } catch (err) { /* Ignore */ }

    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: t('error') });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchInitialData(); }, [storeId]);

  const fetchMoreProducts = async () => {
    if (fetchingMore || !hasMore || loading) return;
    setFetchingMore(true);
    try {
      const res = await client.get(`/products/`, {
        params: { store_id: storeId, limit: PAGE_SIZE, offset: products.length }
      });

      const incomingData = res.data.data || res.data || [];
      const total = res.data.total || 0;

      if (incomingData.length === 0) {
        setHasMore(false);
      } else {
        setProducts(prev => [...prev, ...incomingData]);
        setTotalCount(total);
        // Robust Logic
        setHasMore(incomingData.length >= PAGE_SIZE);
      }

    } catch (error) { 
      console.error(error); 
    } finally { 
      setFetchingMore(false); 
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    fetchInitialData();
  };

  const displayStoreName = store?.name || name; 
  const displayCategory = store?.category || t('uncategorized');
  const displayImage = store?.image_url; 
  const displayBanner = store?.banner_url;

  // --- HEADER ---
  const renderListHeader = (
    <View>
      <View style={{ height: BANNER_HEIGHT, backgroundColor: 'transparent' }} />
      
      <View 
        className="-mt-6 rounded-t-3xl pt-2 pb-0 px-6 shadow-sm"
        style={{ backgroundColor: SHEET_BG_COLOR }}
      >
        <View className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 opacity-40" />
        
        <View className="flex-row gap-4">
          <View className="-mt-14 w-24 h-24 rounded-2xl border-4 border-[#F5F5F0] bg-white items-center justify-center overflow-hidden shadow-sm">
            {displayImage ? (
              <Image source={{ uri: displayImage }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Text className="text-4xl font-serif text-onyx font-bold opacity-20">{displayStoreName.charAt(0)}</Text>
            )}
          </View>
          
          <View className="flex-1 pt-1">
            <Text className="text-2xl font-serif font-bold text-onyx" numberOfLines={2}>
              {displayStoreName}
            </Text>
            <View className="flex-row items-center gap-2 mt-2">
              <View className="bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{displayCategory}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Star size={12} color="#D4AF37" fill="#D4AF37" />
                <Text className="text-xs text-green-700 font-bold">4.9</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-5 bg-white p-3 rounded-xl border border-gray-100/50 shadow-sm">
             <Text className="text-gray-500 text-xs leading-relaxed" numberOfLines={3}>
                {store?.description || t('default_store_description')}
             </Text>
             {store?.address && (
                <View className="mt-3 pt-3 border-t border-gray-50 flex-row items-center gap-2">
                    <MapPin size={12} color="#9CA3AF" />
                    <Text className="text-gray-400 text-[10px] font-bold">{store.address}</Text>
                </View>
             )}
        </View>

        <View className="mt-8 mb-4">
            <Text className="text-lg font-serif font-bold text-onyx">{t('products')}</Text>
        </View>

        <View style={{ height: 2, marginBottom: -1, backgroundColor: SHEET_BG_COLOR }} />
      </View>
    </View>
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
      />

      {/* Product Grid */}
      <ProductGrid 
        products={products}
        isLoading={false}
        ListHeaderComponent={renderListHeader}
        useSolidRowLayout={true} 
        itemContainerStyle={{ backgroundColor: SHEET_BG_COLOR}} 
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
            ) : <View style={{ height: 20, backgroundColor: SHEET_BG_COLOR }} />
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
      />

      <PaginationBadge 
        currentCount={products.length} 
        totalCount={totalCount} 
        visible={!loading && products.length > 0} 
      />
    </View>
  );
}