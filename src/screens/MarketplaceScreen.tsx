import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { productsApi } from '../api/products';
import { addressesApi } from '../api/addresses';
import DashboardHeader from '../components/DashboardHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import ProductGrid from '../components/ProductGrid';
import * as SecureStore from 'expo-secure-store';
import PaginationBadge from '../components/PaginationBadge';
import FilterModal from '../components/FilterModal'; // 👈 Import Filter Modal

interface Product {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  description: string;
}

const PAGE_SIZE = 4; // Testing with 4

export default function MarketplaceScreen({ navigation }: { navigation: any }) {
  const { t } = useLanguage();
  
  // --- STATE ---
  const [products, setProducts] = useState<Product[]>([]);
  
  // --- REFS (For Robust Fetching) ---
  const productsLengthRef = useRef(0); 
  const activeCategoryRef = useRef('All');
  // 👇 New Refs for Filters (prevents stale state in async fetch)
  const activeSortRef = useRef('newest');
  const activeMinPriceRef = useRef<number | undefined>(undefined);
  const activeMaxPriceRef = useRef<number | undefined>(undefined);

  // --- UI STATE ---
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Category UI State
  const [activeCategory, setActiveCategory] = useState('All');
  const [hasMore, setHasMore] = useState(true);

  // Filter UI State
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [activeSort, setActiveSort] = useState('newest');

  // Address & User
  const [addressLabel, setAddressLabel] = useState<string>(t('deliver_to'));
  const [addressLine, setAddressLine] = useState<string>(t('select_location'));
  const [isGuest, setIsGuest] = useState(true);

  const { addToCart } = useCart();

  const CATEGORIES = [
    { id: 'All', label: t('category_all_items') },
    { id: 'Clothing', label: t('category_fashion') },
    { id: 'Electronics', label: t('category_tech') },
    { id: 'Food', label: t('category_food') },
    { id: 'Home', label: t('category_home') },
    { id: 'Jewelry', label: t('category_jewelry') },
  ];

  // --- 1. CORE DATA FETCHING ---
  const fetchProducts = async (isReset: boolean = false) => {
    const currentOffset = isReset ? 0 : productsLengthRef.current;
    
    // Capture ALL current filters/categories at the START of the request
    const targetCategory = activeCategoryRef.current;
    const targetSort = activeSortRef.current;
    const targetMin = activeMinPriceRef.current;
    const targetMax = activeMaxPriceRef.current;

    if (!isReset && (!hasMore || fetchingMore)) return;

    if (isReset) setLoading(true);
    else setFetchingMore(true);

    try {
      const params: any = {
        limit: PAGE_SIZE,
        offset: currentOffset,
        sort_by: targetSort, // 👇 Send Sort Param
      };

      if (targetCategory !== 'All') params.category = targetCategory;
      if (targetMin !== undefined) params.min_price = targetMin; // 👇 Send Min Price
      if (targetMax !== undefined) params.max_price = targetMax; // 👇 Send Max Price

      const res = await productsApi.getAll(params);

      // 🛡️ RACE CONDITION GUARD 🛡️
      // If category OR filters changed while waiting, discard.
      if (
        activeCategoryRef.current !== targetCategory ||
        activeSortRef.current !== targetSort
      ) {
        return;
      }

      const newItems = res.data || res || [];
      const total = res.total || 0;

      if (isReset) {
        setProducts(newItems);
        productsLengthRef.current = newItems.length;
      } else {
        setProducts(prev => {
          const updated = [...prev, ...newItems];
          productsLengthRef.current = updated.length;
          return updated;
        });
      }

      setTotalCount(total);

      // Stop if we got fewer items than requested
      if (newItems.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      // Only turn off loading if we are still on the same request context
      if (activeCategoryRef.current === targetCategory) {
        setLoading(false);
        setFetchingMore(false);
        setRefreshing(false);
      }
    }
  };

  // --- 2. INITIAL LOAD ---
  useEffect(() => {
    checkUserAndAddress();
    fetchProducts(true);
  }, []);

  const checkUserAndAddress = async () => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      setIsGuest(false);
      try {
        const addrData = await addressesApi.getDefault();
        if (addrData) {
          setAddressLabel(addrData.label || t('deliver_to'));
          const full = addrData.address_line;
          setAddressLine(full.length > 25 ? full.substring(0, 25) + '...' : full);
        }
      } catch (e) { /* Ignore */ }
    } else {
      setAddressLabel(t('welcome'));
      setAddressLine(t('please_login'));
      setIsGuest(true);
    }
  };

  // --- 3. HANDLERS ---
  
  // Category Change
  const handleCategoryPress = (categoryId: string) => {
    if (categoryId === activeCategory) return;

    // Update UI & Ref
    setActiveCategory(categoryId);
    activeCategoryRef.current = categoryId;

    // Reset Data
    setProducts([]);
    productsLengthRef.current = 0;
    setTotalCount(0);
    setHasMore(true);
    setLoading(true);

    fetchProducts(true);
  };

  // Filter Apply
  const handleFilterApply = (min: number | undefined, max: number | undefined, sort: string) => {
    // 1. Update UI State (for Modal)
    setActiveSort(sort);
    
    // 2. Update Refs (for Fetching)
    activeSortRef.current = sort;
    activeMinPriceRef.current = min;
    activeMaxPriceRef.current = max;

    // 3. Reset Data & Fetch
    setProducts([]);
    productsLengthRef.current = 0;
    setTotalCount(0);
    setHasMore(true);
    setLoading(true);

    fetchProducts(true);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    checkUserAndAddress();
    fetchProducts(true);
  }, []);

  const handleLoadMore = () => {
    if (!loading && !fetchingMore && hasMore) {
      fetchProducts(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      
      <View className="px-6" style={{ paddingHorizontal: 12 }}>
        <DashboardHeader 
          subtitle={t('browse')}
          title={t('marketplace')}
          addressLabel={addressLabel}
          addressLine={addressLine}
          isGuest={isGuest}
          onAddressPress={() => navigation.navigate('Addresses')}
          searchPlaceholder={t('search_products')}
          onSearchPress={() => navigation.navigate('Search', { type: 'product' })}
          categories={CATEGORIES}
          activeCategory={activeCategory}
          
          onCategoryPress={handleCategoryPress}
          // 👇 Open Filter Modal
          onFilterPress={() => setFilterVisible(true)}
        />
      </View>

      <ProductGrid
        products={products}
        isLoading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          fetchingMore ? (
            <View className="py-6">
              <ActivityIndicator color="#D4AF37" />
            </View>
          ) : <View className="h-20" />
        }
        
        contentContainerStyle={{
          paddingHorizontal: 12, 
          backgroundColor: 'transparent'
        }}
        
        onProductPress={(item) => navigation.navigate('ProductDetails', {
          productId: item.id,
          name: item.name,
          price: item.price,
          description: item.description ?? '',
          category: item.category ?? '',
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

      <PaginationBadge 
        currentCount={products.length} 
        totalCount={totalCount} 
        visible={!loading && products.length > 0} 
      />

      {/* 👇 Filter Modal */}
      <FilterModal 
        visible={isFilterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleFilterApply}
        currentSort={activeSort}
      />
    </SafeAreaView>
  );
}