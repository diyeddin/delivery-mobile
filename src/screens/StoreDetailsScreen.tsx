import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeStackParamList } from '../types';
import client from '../api/client';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import Toast from 'react-native-toast-message';

type Props = NativeStackScreenProps<HomeStackParamList, 'StoreDetails'>;

interface Product {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  description?: string;
  category?: string;
}

export default function StoreDetailsScreen({ route, navigation }: Props) {
  const { storeId, name } = route.params;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // <--- 1. Refresh State
  const { addToCart } = useCart();

  // 2. Define Fetch Logic (Wrapped in useCallback)
  const fetchProducts = useCallback(async () => {
    try {
      const res = await client.get(`/products/?store_id=${storeId}`);
      setProducts(res.data);
    } catch (error) {
      // If we blocked it in client.ts, don't show a toast (Banner is enough)
      // if (error === 'NO_INTERNET') return;
      
      console.error("Failed to load products", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to refresh products.'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId]);

  // Initial Load
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 3. Handle Refresh (with artificial delay)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Optional: Wait 0.5s so the user actually sees the spinner
    await new Promise(resolve => setTimeout(resolve, 500));
    fetchProducts();
  }, [fetchProducts]);

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top', 'left', 'right']}>
      
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-onyx/5">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="p-2 bg-onyx/5 rounded-full mr-4"
        >
          <ArrowLeft color="#0F0F0F" size={20} />
        </TouchableOpacity>
        <Text className="text-xl text-onyx font-serif">{name}</Text>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          
          // 4. THIS FIXES THE "CANNOT PULL" ISSUE
          contentContainerStyle={{ padding: 16, flexGrow: 1 }} 
          
          // 5. Connect Refresh Control
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#D4AF37"
              colors={['#D4AF37']}
            />
          }

          renderItem={({ item }) => (
            <View style={{ width: '48%' }}>
            <ProductCard 
              name={item.name}
              price={item.price}
              image_url={item.image_url}
              category={item.category ?? ''}
              
              onPress={() => navigation.navigate('ProductDetails', {
                productId: item.id,
                name: item.name,
                price: item.price,
                description: item.description ?? '',
                image_url: item.image_url
              })}
              onAddToCart={() => {
                addToCart({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  image_url: item.image_url
                });
                Toast.show({
                  type: 'success',
                  text1: 'Added to Bag',
                  text2: `${item.name} has been added to your cart.`,
                  visibilityTime: 3000,
                });
              }}
            />
            </View>
          )}
          ListEmptyComponent={
            // Center the empty text properly
            <View className="flex-1 items-center justify-center mt-20">
              <Text className="text-gray-400">No products found in this store.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}