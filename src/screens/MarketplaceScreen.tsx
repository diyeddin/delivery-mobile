import React, { useEffect, useState, useCallback } from 'react';
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
  description: string;
}

const PAGE_SIZE = 20;

export default function MarketplaceScreen({ navigation }: { navigation: any }) {
  const { t } = useLanguage();
  
  // --- STATE ---
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters (Search Removed)
  const [activeCategory, setActiveCategory] = useState('All');
  const [hasMore, setHasMore] = useState(true);
  
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
    const currentOffset = isReset ? 0 : products.length;
    
    if (!isReset && (!hasMore || fetchingMore)) return;

    if (isReset) setLoading(true);
    else setFetchingMore(true);

    try {
      const params: any = {
        limit: PAGE_SIZE,
        offset: currentOffset,
      };

      // Only Category Logic Remains
      if (activeCategory !== 'All') {
        params.category = activeCategory;
      }

      const res = await client.get('/products/', { params });
      const newItems = res.data;

      if (isReset) {
        setProducts(newItems);
      } else {
        setProducts(prev => [...prev, ...newItems]);
      }

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

  // --- 2. INITIAL LOAD ---
  useEffect(() => {
    checkUserAndAddress();
    // fetchProducts(true) is handled by category effect
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

  // --- 3. HANDLE CATEGORY (INSTANT) ---
  useEffect(() => {
    fetchProducts(true);
  }, [activeCategory]);


  // --- 4. HANDLERS ---
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    checkUserAndAddress();
    fetchProducts(true);
  }, [activeCategory]);

  const handleLoadMore = () => {
    if (!loading && !fetchingMore && hasMore) {
      fetchProducts(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      
      {/* HEADER */}
      <View className="px-6" style={{ paddingHorizontal: 16 }}>
        <DashboardHeader 
          subtitle={t('browse')}
          title={t('marketplace')}
          addressLabel={addressLabel}
          addressLine={addressLine}
          isGuest={isGuest}
          onAddressPress={() => navigation.navigate('Addresses')}

          // 👇 Simplified Search Trigger
          searchPlaceholder={t('search_products')}
          onSearchPress={() => navigation.navigate('Search', { type: 'product' })}

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