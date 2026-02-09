import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet
} from 'react-native';
import { addressesApi } from '../api/addresses';
import { ordersApi } from '../api/orders';
import { storesApi } from '../api/stores';
import DashboardHeader from '../components/DashboardHeader';
import StoreGrid from '../components/StoreGrid';
import PromoCarousel from '../components/PromoCarousel';
import ActiveOrderWidget from '../components/ActiveOrderWidget';
import { useLanguage } from '../context/LanguageContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList, Store, ActiveOrder } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import PaginationBadge from '../components/PaginationBadge';
import FilterModal from '../components/FilterModal';
import { useAbortController } from '../hooks/useAbortController';
import { handleApiError } from '../utils/handleApiError';

const PAGE_SIZE = 4; // Keeping your testing size

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;
interface Props { navigation: HomeScreenNavigationProp; }


export default function HomeScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { getSignal } = useAbortController();
  
  // --- STATE ---
  const [stores, setStores] = useState<Store[]>([]);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  
  // 👇 Refs for Robust Fetching (Prevents Race Conditions)
  const storesLengthRef = useRef(0);
  const activeCategoryRef = useRef('All');
  const activeSortRef = useRef('newest');

  // Pagination & Filter State
  const [totalCount, setTotalCount] = useState(0); // 👈 Track Total
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI State
  const [addressLabel, setAddressLabel] = useState<string>(t('deliver_to'));
  const [addressLine, setAddressLine] = useState<string>(t('select_location'));
  const [activeCategory, setActiveCategory] = useState('All');
  const [isGuest, setIsGuest] = useState(true);

  // Filter Modal State
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [activeSort, setActiveSort] = useState('newest');

  const CATEGORIES = [
    { id: 'All', label: t('category_all') },
    { id: 'Clothing', label: t('category_fashion') },
    { id: 'Food', label: t('category_dining') },
    { id: 'Electronics', label: t('category_tech') },
    { id: 'Jewelry', label: t('category_jewelry') },
    { id: 'Home', label: t('category_home') },
  ];

  // --- 1. FETCH USER DATA ---
  const fetchUserData = async (signal?: AbortSignal) => {
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
        const addrData = await addressesApi.getDefault(signal);
        if (addrData) {
          setAddressLabel(addrData.label || t('deliver_to'));
          const fullAddress = addrData.address_line;
          setAddressLine(fullAddress.length > 25 ? fullAddress.substring(0, 25) + '...' : fullAddress);
        }
      } catch (e) { /* Ignore - address is non-critical */ }

      try {
        const orders = await ordersApi.getMyOrders(signal);
        const activeList = orders.filter((o: ActiveOrder) =>
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
      } catch (e) { /* Ignore - orders widget is non-critical */ }

    } catch (error: unknown) {
      handleApiError(error, { fallbackTitle: 'User data error', showToast: false });
    }
  };

  // --- 2. FETCH STORES (Updated Logic) ---
  const fetchStores = async (isReset: boolean = false) => {
    const currentOffset = isReset ? 0 : storesLengthRef.current;
    const signal = getSignal();

    // Capture state at start of request
    const targetCategory = activeCategoryRef.current;
    const targetSort = activeSortRef.current;

    if (!isReset && (!hasMore || fetchingMore)) return;

    if (isReset) setLoading(true);
    else setFetchingMore(true);

    try {
      const params: Record<string, string | number> = {
        limit: PAGE_SIZE,
        offset: currentOffset,
        sort_by: targetSort
      };

      if (targetCategory !== 'All') params.category = targetCategory;

      const res = await storesApi.getAll(params, signal);

      // RACE CONDITION GUARD
      if (activeCategoryRef.current !== targetCategory || activeSortRef.current !== targetSort) {
        return;
      }

      // Handle New Response Structure
      const newItems = res.data || res || [];
      const total = res.total || 0;

      if (isReset) {
        setStores(newItems);
        storesLengthRef.current = newItems.length;
      } else {
        setStores(prev => {
          const updated = [...prev, ...newItems];
          storesLengthRef.current = updated.length;
          return updated;
        });
      }

      setTotalCount(total);

      // Robust Stopping Logic
      if (newItems.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

    } catch (error: unknown) {
      handleApiError(error, { fallbackTitle: 'Store fetch error', showToast: false });
    } finally {
      if (activeCategoryRef.current === targetCategory) {
        setLoading(false);
        setFetchingMore(false);
        setRefreshing(false);
      }
    }
  };

  // --- 3. INITIAL LOAD ---
  useEffect(() => {
    fetchUserData();
    fetchStores(true);
  }, []);

  // --- 4. HANDLERS ---
  
  // Category Change
  const handleCategoryPress = (categoryId: string) => {
    if (categoryId === activeCategory) return;

    setActiveCategory(categoryId);
    activeCategoryRef.current = categoryId;

    // Reset Data
    setStores([]);
    storesLengthRef.current = 0;
    setTotalCount(0);
    setHasMore(true);
    setLoading(true);

    fetchStores(true);
  };

  // Filter Apply
  const handleFilterApply = (_min: number | undefined, _max: number | undefined, sort: string) => {
    setActiveSort(sort);
    activeSortRef.current = sort;

    // Reset Data
    setStores([]);
    storesLengthRef.current = 0;
    setTotalCount(0);
    setHasMore(true);
    setLoading(true);

    fetchStores(true);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    fetchUserData();
    fetchStores(true); 
  }, []);

  const handleLoadMore = () => {
    if (!loading && !fetchingMore && hasMore) fetchStores(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      
      {/* 1. HEADER */}
      <View className="px-6" style={styles.headerWrapper}>
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
          
          // 👇 Use robust handler + new Filter trigger
          onCategoryPress={handleCategoryPress}
          onFilterPress={() => setFilterVisible(true)}
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
             <PromoCarousel /> 
             
             <View className="flex-row justify-between items-center mb-3">
               <Text className="text-base font-serif text-onyx font-bold">
                 {activeCategory === 'All' ? t('all_shops') : `${activeCategory}`}
               </Text>
               <Text className="text-xs text-gray-400">
                   {/* Shows '20+ Stores' if exact count isn't loaded, or total if we have it */}
                   {stores.length > 0 ? (totalCount > 0 ? totalCount : `${stores.length}+`) : 0} {t('stores')}
               </Text>
             </View>
          </View>
        }
        
        contentContainerStyle={styles.storeGridContainer}
      />

      {/* 3. ACTIVE ORDER WIDGET */}
      {activeOrder && (
        <ActiveOrderWidget
          activeOrder={activeOrder}
          onViewDetails={() => navigation.navigate('OrderDetails', { orderId: activeOrder.id })}
        />
      )}

      {/* 4. 👇 PAGINATION BADGE
      <PaginationBadge 
        currentCount={stores.length} 
        totalCount={totalCount} 
        visible={!loading && stores.length > 0} 
      /> */}

      {/* 4. 👇 FILTER MODAL (Configured for Stores) */}
      <FilterModal 
        visible={isFilterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleFilterApply}
        currentSort={activeSort}
        type="store" // Shows 'Rating' & 'A-Z' instead of Price
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    paddingHorizontal: 12,
  },
  storeGridContainer: {
    paddingHorizontal: 12,
    paddingBottom: 60,
    paddingTop: 10,
  },
});