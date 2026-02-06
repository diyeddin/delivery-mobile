import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, Text, FlatList, Image, TouchableOpacity, LayoutAnimation, Dimensions, ActivityIndicator 
} from 'react-native';
import client from '../api/client';
import DashboardHeader from '../components/DashboardHeader';
import StoreGrid from '../components/StoreGrid';
import { useLanguage } from '../context/LanguageContext';
import { ShoppingBag, Truck, ChevronDown, MapPin, User } from 'lucide-react-native'; 
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');
const GAP = 12; 
const CARD_WIDTH = width - 32; 
const SNAP_INTERVAL = CARD_WIDTH + GAP; 
const PAGE_SIZE = 20;

const PROMOS = [
  { id: 1, title: 'Summer Collection', subtitle: 'New Arrivals', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop' },
  { id: 2, title: 'Tech Week', subtitle: 'Up to 30% Off', image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=800&auto=format&fit=crop' },
  { id: 3, title: 'Food Court', subtitle: 'Free Delivery', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop' },
];

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;
interface Props { navigation: HomeScreenNavigationProp; }

interface Store {
  id: number;
  name: string;
  description: string;
  category: string;
  image_url?: string;
  banner_url?: string;
}

interface ActiveOrder {
  id: number;
  status: string;
  total_price: number;
  store?: { name: string };
  items: any[];
}

export default function HomeScreen({ navigation }: Props) {
  const { t } = useLanguage();
  
  // --- STATE ---
  const [stores, setStores] = useState<Store[]>([]);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  
  // Pagination State
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI State
  const [addressLabel, setAddressLabel] = useState<string>(t('deliver_to'));
  const [addressLine, setAddressLine] = useState<string>(t('select_location'));
  const [isWidgetExpanded, setIsWidgetExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isGuest, setIsGuest] = useState(true);
  
  // Carousel State
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<FlatList>(null);

  const CATEGORIES = [
    { id: 'All', label: t('category_all') },
    { id: 'Clothing', label: t('category_fashion') },
    { id: 'Food', label: t('category_dining') },
    { id: 'Electronics', label: t('category_tech') },
    { id: 'Jewelry', label: t('category_jewelry') },
    { id: 'Home', label: t('category_home') },
  ];

  const TIMELINE_STEPS = [
    { label: t('status_confirmed'), icon: ShoppingBag },
    { label: t('status_driver'), icon: User },
    { label: t('status_on_way'), icon: Truck },
    { label: t('status_arriving'), icon: MapPin },
  ];

  // --- 1. FETCH USER DATA ---
  const fetchUserData = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        setActiveOrder(null);
        setAddressLabel(t('welcome'));
        setAddressLine(t('please_login'));
        setIsGuest(true);
        return;
      }

      setIsGuest(false);
      
      try {
        const addrRes = await client.get('/addresses/default');
        if (addrRes.data) {
          setAddressLabel(addrRes.data.label || t('deliver_to'));
          const fullAddress = addrRes.data.address_line;
          setAddressLine(fullAddress.length > 25 ? fullAddress.substring(0, 25) + '...' : fullAddress);
        }
      } catch (e) { /* Ignore */ }

      try {
        const orderRes = await client.get('/orders/me'); 
        const activeList = orderRes.data.filter((o: ActiveOrder) => 
          ['pending', 'confirmed', 'assigned', 'in_transit', 'picked_up'].includes(o.status)
        );
        const getStatusScore = (status: string) => {
            if (status === 'in_transit') return 5;
            if (status === 'picked_up') return 4;
            if (status === 'assigned') return 3;
            if (status === 'confirmed') return 2;
            return 1;
        };
        if (activeList.length > 0) {
            activeList.sort((a: ActiveOrder, b: ActiveOrder) => getStatusScore(b.status) - getStatusScore(a.status));
            setActiveOrder(activeList[0]);
        } else {
            setActiveOrder(null);
        }
      } catch (e) { /* Ignore */ }

    } catch (error) {
      console.error("User data error:", error);
    }
  };

  // --- 2. FETCH STORES (Paginated & Categorized) ---
  const fetchStores = async (isReset: boolean = false) => {
    const currentOffset = isReset ? 0 : stores.length;
    
    if (!isReset && (!hasMore || fetchingMore)) return;

    if (isReset) setLoading(true);
    else setFetchingMore(true);

    try {
      const params: any = {
        limit: PAGE_SIZE,
        offset: currentOffset,
      };

      // Only Category Logic remains (Search Logic Removed)
      if (activeCategory !== 'All') {
        params.category = activeCategory;
      }
      
      const res = await client.get('/stores/', { params });
      const newItems = res.data;

      if (isReset) {
        setStores(newItems);
      } else {
        setStores(prev => [...prev, ...newItems]);
      }

      if (newItems.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

    } catch (error) {
      console.error("Store fetch error:", error);
    } finally {
      setLoading(false);
      setFetchingMore(false);
      setRefreshing(false);
    }
  };

  // --- 3. EFFECTS ---
  
  // Initial Load
  useEffect(() => {
    fetchUserData();
    // fetchStores(true) is called by category effect
  }, []);

  // Category Effect (Instant)
  useEffect(() => {
    fetchStores(true);
  }, [activeCategory]);


  // Carousel Auto-scroll
  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current && PROMOS.length > 0) {
        let nextIndex = activeSlide + 1;
        if (nextIndex >= PROMOS.length) nextIndex = 0;
        carouselRef.current.scrollToIndex({ index: nextIndex, animated: true });
        setActiveSlide(nextIndex);
      }
    }, 4000); 
    return () => clearInterval(interval);
  }, [activeSlide]);


  // --- HANDLERS ---
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    fetchUserData();
    fetchStores(true); 
  }, [activeCategory]);

  const handleLoadMore = () => {
    if (!loading && !fetchingMore && hasMore) {
      fetchStores(false);
    }
  };

  const toggleWidget = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsWidgetExpanded(!isWidgetExpanded);
  };

  // Helpers
  const getStatusText = (status: string) => {
      switch(status) {
        case 'confirmed': return t('status_preparing');
        case 'assigned': return t('status_driver_assigned');
        case 'picked_up': return t('status_heading_to_you');
        case 'in_transit': return t('status_arriving_soon');
        case 'pending': return t('status_waiting_for_store');
        default: return t('active_order');
      }
  };
  
  const getCurrentStepIndex = (status: string) => {
      if (status === 'delivered') return 3;
      if (['picked_up', 'in_transit'].includes(status)) return 2;
      if (['assigned'].includes(status)) return 1;
      return 0; 
  };


  // --- RENDER ---
  const renderCarousel = () => (
      <View className="mb-6">
        <FlatList
          ref={carouselRef}
          data={PROMOS}
          horizontal
          pagingEnabled={false} 
          snapToInterval={SNAP_INTERVAL} 
          snapToAlignment="start"
          decelerationRate="fast" 
          disableIntervalMomentum={true}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 0 }}
          onScroll={(event) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / SNAP_INTERVAL);
            if (index !== activeSlide) setActiveSlide(index);
          }}
          scrollEventThrottle={16} 
          renderItem={({ item, index }) => (
            <View 
              style={{ width: CARD_WIDTH, marginRight: index === PROMOS.length - 1 ? 0 : GAP }} 
              className="h-40 rounded-2xl overflow-hidden relative"
            >
              <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
              <View className="absolute inset-0 bg-black/30 justify-center px-6">
                <Text className="text-gold-400 font-bold uppercase tracking-widest text-xs mb-1">{item.subtitle}</Text>
                <Text className="text-white font-serif text-3xl">{item.title}</Text>
              </View>
            </View>
          )}
        />
        <View className="flex-row justify-center mt-3 space-x-2">
          {PROMOS.map((_, index) => (
            <View key={index} className={`h-1.5 rounded-full transition-all mx-0.5 ${index === activeSlide ? 'w-6 bg-gold-500' : 'w-1.5 bg-gray-600'}`} />
          ))}
        </View>
      </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      
      {/* 1. HEADER */}
      <View className="px-6" style={{ paddingHorizontal: 12 }}>
        <DashboardHeader 
          subtitle="Golden Rose"
          title="Mall Delivery"
          addressLabel={addressLabel}
          addressLine={addressLine}
          isGuest={isGuest}
          onAddressPress={() => navigation.navigate('Addresses')}
          
          // 👇 Simplified Search Prop
          searchPlaceholder={t('search_stores')}
          onSearchPress={() => navigation.navigate('Search', { type: 'store' })}
          
          categories={CATEGORIES}
          activeCategory={activeCategory}
          onCategoryPress={setActiveCategory}
        />
      </View>

      {/* 2. PAGINATED STORE GRID */}
      <StoreGrid 
        stores={stores}
        isLoading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onStorePress={(store) => navigation.navigate('StoreDetails', { storeId: store.id, name: store.name })}
        
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
            fetchingMore ? (
              <View className="py-6 items-center">
                <ActivityIndicator color="#D4AF37" />
              </View>
            ) : <View className="h-10" />
        }

        ListHeaderComponent={
          <View>
             {renderCarousel()}
             <View className="flex-row justify-between items-center mb-3">
               <Text className="text-base font-serif text-onyx font-bold">
                 {activeCategory === 'All' ? t('all_shops') : `${activeCategory}`}
               </Text>
               <Text className="text-xs text-gray-400">
                   {stores.length}+ {t('stores')}
               </Text>
             </View>
          </View>
        }
        
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingBottom: activeOrder ? 180 : 80,
          paddingTop: 10
        }}
      />

      {/* 3. ACTIVE ORDER WIDGET */}
      {activeOrder && (
        <View className="absolute bottom-6 left-4 right-4 z-50">
          <TouchableOpacity 
            activeOpacity={0.95}
            onPress={toggleWidget}
            className={`bg-onyx rounded-2xl border border-white/10 shadow-2xl overflow-hidden shadow-black/50 ${isWidgetExpanded ? 'pb-5' : 'p-0'}`}
          >
            <View className="flex-row items-center justify-between p-4 bg-onyx z-20">
              <View className="flex-row items-center flex-1">
                <View className="relative me-4">
                  <View className="w-10 h-10 bg-gold-500/20 rounded-full items-center justify-center animate-pulse">
                      <View className="w-6 h-6 bg-gold-500 rounded-full items-center justify-center shadow-lg">
                          {['in_transit', 'picked_up'].includes(activeOrder.status) ? (
                              <Truck size={12} color="#1A1A1A" fill="#1A1A1A" />
                          ) : (
                              <ShoppingBag size={12} color="#1A1A1A" fill="#1A1A1A" />
                          )}
                      </View>
                  </View>
                </View>

                <View>
                  <Text className="text-gold-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                    {activeOrder.store?.name || t('active_order')}
                  </Text>
                  <Text className="text-white font-bold text-sm">
                    {getStatusText(activeOrder.status)}
                  </Text>
                </View>
              </View>

              <View className="bg-white/10 p-2 rounded-full ms-4">
                <ChevronDown size={16} color="#D4AF37" style={{ transform: [{ rotate: isWidgetExpanded ? '0deg' : '180deg' }]}} />
              </View>
            </View>

            {isWidgetExpanded && (
              <View className="px-5 pt-2">
                <View className="flex-row items-center justify-between mt-2 mb-6 relative">
                  <View className="absolute top-[14px] left-4 right-4 h-[2px] bg-white/10 z-0" />
                  <View 
                      className="absolute top-[14px] left-4 h-[2px] bg-gold-500 z-0" 
                      style={{ 
                          width: `${(getCurrentStepIndex(activeOrder.status) / (TIMELINE_STEPS.length - 1)) * 90}%` 
                      }} 
                  />
                  {TIMELINE_STEPS.map((step, index) => {
                      const currentIndex = getCurrentStepIndex(activeOrder.status);
                      const isActive = index <= currentIndex;
                      return (
                          <View key={index} className="items-center z-10" style={{ width: 60 }}>
                              <View className={`w-8 h-8 rounded-full items-center justify-center border-2 mb-2 ${
                                  isActive ? 'bg-onyx border-gold-500' : 'bg-onyx border-gray-600'
                              }`}>
                                  {isActive ? <step.icon size={12} color="#D4AF37" /> : <View className="w-2 h-2 rounded-full bg-gray-600" />}
                              </View>
                              <Text className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-gray-600'}`}>
                                  {step.label}
                              </Text>
                          </View>
                      );
                  })}
                </View>

                <TouchableOpacity 
                  onPress={() => navigation.navigate('OrderDetails', { orderId: activeOrder.id })} 
                  className="w-full bg-gold-500 py-3 rounded-xl items-center shadow-lg shadow-gold-500/20 active:opacity-90"
                >
                  <Text className="text-onyx font-bold uppercase tracking-wider text-xs">{t('view_order_details')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}