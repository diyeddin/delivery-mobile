import React, { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
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

export default function MarketplaceScreen({ navigation }: { navigation: any }) {
  const { t } = useLanguage();
  
  // --- MOCK CATEGORIES ---
  const CATEGORIES = [
    { id: 'All', label: t('category_all_items') },
    { id: 'Clothing', label: t('category_fashion') },
    { id: 'Electronics', label: t('category_tech') },
    { id: 'Food', label: t('category_food') },
    { id: 'Home', label: t('category_home') },
  ];
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // --- ADDRESS STATE ---
  const [addressLabel, setAddressLabel] = useState<string>(t('deliver_to'));
  const [addressLine, setAddressLine] = useState<string>(t('select_location'));

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const [isGuest, setIsGuest] = useState(true);

  const { addToCart } = useCart();

  const fetchData = async () => {
    try {
      // 1. Check if user is logged in
      const token = await SecureStore.getItemAsync('token');

      if (token) {
        setIsGuest(false);
        // --- LOGGED IN: Fetch User Address ---
        try {
          const addrRes = await client.get('/addresses/default');
          if (addrRes.data) {
            setAddressLabel(addrRes.data.label || t('deliver_to'));
            const fullAddress = addrRes.data.address_line;
            setAddressLine(fullAddress.length > 25 ? fullAddress.substring(0, 25) + '...' : fullAddress);
          }
        } catch (addrErr: any) {
          // Ignore 404 (No address set) and 401 (Token expired)
          if (addrErr.response?.status !== 404 && addrErr.response?.status !== 401) {
             console.error("Address fetch error:", addrErr);
          }
        }
      } else {
        // --- LOGGED OUT: Reset Header UI ---
        setAddressLabel(t('welcome'));
        setAddressLine(t('please_login'));
        setIsGuest(true);
      }

      // 2. Fetch Products (Public Access)
      // We run this regardless of login status
      const res = await client.get('/products/'); 
      setProducts(res.data);
      setFilteredProducts(res.data);

    } catch (error) {
      console.error("Failed to fetch marketplace data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FILTERING LOGIC ---
  useEffect(() => {
    let result = products;

    if (activeCategory !== 'All') {
      result = result.filter(p => 
        p.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    if (searchText) {
      const lowerText = searchText.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lowerText)
      );
    }

    setFilteredProducts(result);
  }, [searchText, activeCategory, products]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      
      {/* FIXED HEADER */}
      <View className="px-6 z-9" style={{ paddingHorizontal: 16 }} >
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

      {/* REUSABLE PRODUCT GRID */}
      <ProductGrid
        products={filteredProducts}
        isLoading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        
        // Align grid with header: 16px header padding - 8px item padding = 8px container padding
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
            text2: `${item.name} ${t('added_to_cart_message') }` 
          });
        }}
      />
    </SafeAreaView>
  );
}