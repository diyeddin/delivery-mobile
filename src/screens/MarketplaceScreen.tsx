import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import client from '../api/client';
import DashboardHeader from '../components/DashboardHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import ProductGrid from '../components/ProductGrid';
import * as SecureStore from 'expo-secure-store';

interface Product {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  description?: string;
}

const PAGE_SIZE = 20; // Number of items to fetch per page

export default function MarketplaceScreen({ navigation }: { navigation: any }) {
  const { t } = useLanguage();
  
  // --- STATE ---
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);          // Initial full-screen loader
  const [fetchingMore, setFetchingMore] = useState(false); // Bottom spinner
  const [refreshing, setRefreshing] = useState(false);     // Pull-to-refresh
  
  // Filters & Pagination
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [hasMore, setHasMore] = useState(true); // Stop fetching if backend is empty
  
  // Address & User
  const [addressLabel, setAddressLabel] = useState<string>(t('deliver_to'));
  const [addressLine, setAddressLine] = useState<string>(t('select_location'));
  const [isGuest, setIsGuest] = useState(true);

  const { addToCart } = useCart();
  
  // Timer for Debouncing Search
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // --- MOCK CATEGORIES ---
  // Note: Since backend currently doesn't have a 'category' filter param in the router we wrote,
  // filtering by category will still be client-side OR require backend update.
  // For now, I will keep it simple.
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
    // Determine the offset
    // If resetting (Search change / Refresh), offset is 0.
    // If loading more, offset is current length.
    const currentOffset = isReset ? 0 : products.length;
    
    // Prevent fetching if we are already loading or if no more data
    if (!isReset && (!hasMore || fetchingMore)) return;

    if (isReset) setLoading(true);
    else setFetchingMore(true);

    try {
      // Build Params
      const params: any = {
        limit: PAGE_SIZE,
        offset: currentOffset,
      };

      // Only send 'q' if user typed something
      if (searchText.trim().length > 0) {
        params.q = searchText;
      }

      // 👇 NEW: Send Category to Backend
      if (activeCategory !== 'All') {
        params.category = activeCategory;
      }

      // API Call
      const res = await client.get('/products/', { params });
      const newItems = res.data;

      if (isReset) {
        setProducts(newItems);
      } else {
        // Append new items to old items
        setProducts(prev => [...prev, ...newItems]);
      }

      // If we got fewer than requested, we reached the end
      if (newItems.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setFetchingMore(false);
      setRefreshing(false);
    }
  };

  // --- 2. INITIAL LOAD & USER CHECK ---
  useEffect(() => {
    checkUserAndAddress();
    // fetchProducts(true); // Load Page 1
  }, []);

  const checkUserAndAddress = async () => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      setIsGuest(false);
      try {
        const addrRes = await client.get('/addresses/default');
        if (addrRes.data) {
          setAddressLabel(addrRes.data.label || t('deliver_to'));
          const full = addrRes.data.address_line;
          setAddressLine(full.length > 25 ? full.substring(0, 25) + '...' : full);
        }
      } catch (e) { /* Ignore */ }
    } else {
      setAddressLabel(t('welcome'));
      setAddressLine(t('please_login'));
      setIsGuest(true);
    }
  };

  // --- 3. HANDLE SEARCH & CATEGORY ---
  useEffect(() => {
    // Debounce Search, but Instant Category Click
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    searchTimeout.current = setTimeout(() => {
      fetchProducts(true); // Reset and fetch new results
    }, 500);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchText]);

  // --- 3.1. HANDLE CATEGORY (INSTANT) ---
  useEffect(() => {
    // 1. Clear any pending search timer so we don't double-fetch
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    // 2. Fetch immediately! No delay.
    fetchProducts(true);
  }, [activeCategory]); // 👈 Only depends on activeCategory

  // --- 4. HANDLE REFRESH ---
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    checkUserAndAddress();
    fetchProducts(true);
  }, [activeCategory, searchText]);

  // --- 5. HANDLE LOAD MORE ---
  const handleLoadMore = () => {
    if (!loading && !fetchingMore && hasMore) {
      fetchProducts(false); // Load Next Page
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      
      {/* HEADER */}
      <View className="px-6 z-1" style={{ paddingHorizontal: 16 }}>
        <DashboardHeader 
          subtitle={t('browse')}
          title={t('marketplace')}
          addressLabel={addressLabel}
          addressLine={addressLine}
          isGuest={isGuest}
          onAddressPress={() => navigation.navigate('Addresses')}

          searchText={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder={t('search_products')}

          categories={CATEGORIES}
          activeCategory={activeCategory}
          onCategoryPress={setActiveCategory}
        />
      </View>

      {/* LIST */}
      <ProductGrid
        products={products}
        isLoading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        
        // 👇 PAGINATION PROPS
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5} // Trigger when user is halfway down the last item
        ListFooterComponent={
          fetchingMore ? (
            <View className="py-6">
              <ActivityIndicator color="#D4AF37" />
            </View>
          ) : <View className="h-20" /> // Spacer
        }
        
        contentContainerStyle={{
          paddingHorizontal: 0,
          paddingBottom: 50,
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
    </SafeAreaView>
  );
}