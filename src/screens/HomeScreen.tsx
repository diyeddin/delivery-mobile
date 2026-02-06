import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, LayoutAnimation, ActivityIndicator 
} from 'react-native';
import client from '../api/client';
import DashboardHeader from '../components/DashboardHeader';
import StoreGrid from '../components/StoreGrid';
import PromoCarousel from '../components/PromoCarousel'; // 👈 Import the new component
import { useLanguage } from '../context/LanguageContext';
import { ShoppingBag, Truck, ChevronDown, MapPin, User } from 'lucide-react-native'; 
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

const PAGE_SIZE = 4;

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

  // ❌ Removed Carousel State (activeSlide, carouselRef) - Handled in Component now

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

  // --- 2. FETCH STORES ---
  const fetchStores = async (isReset: boolean = false) => {
    const currentOffset = isReset ? 0 : stores.length;
    if (!isReset && (!hasMore || fetchingMore)) return;

    if (isReset) setLoading(true);
    else setFetchingMore(true);

    try {
      const params: any = { limit: PAGE_SIZE, offset: currentOffset };
      if (activeCategory !== 'All') params.category = activeCategory;
      
      const res = await client.get('/stores/', { params });
      const newItems = res.data;

      if (isReset) setStores(newItems);
      else setStores(prev => [...prev, ...newItems]);

      setHasMore(newItems.length >= PAGE_SIZE);
    } catch (error) {
      console.error("Store fetch error:", error);
    } finally {
      setLoading(false);
      setFetchingMore(false);
      setRefreshing(false);
    }
  };

  // --- 3. EFFECTS ---
  useEffect(() => { fetchUserData(); }, []);

  useEffect(() => { fetchStores(true); }, [activeCategory]);

  // --- HANDLERS ---
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    fetchUserData();
    fetchStores(true); 
  }, [activeCategory]);

  const handleLoadMore = () => {
    if (!loading && !fetchingMore && hasMore) fetchStores(false);
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
             {/* 👇 NEW CAROUSEL COMPONENT */}
             <PromoCarousel /> 
             
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
             {/* Widget Content (Kept exactly as it was) */}
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