import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeStackParamList } from '../types';
import client from '../api/client';
import ProductCard from '../components/ProductCard'; // <--- Import the new component
import { useCart } from '../context/CartContext';

type Props = NativeStackScreenProps<HomeStackParamList, 'StoreDetails'>;

interface Product {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  description?: string;
}

export default function StoreDetailsScreen({ route, navigation }: Props) {
  const { storeId, name } = route.params;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // CHECK YOUR BACKEND URL HERE:
        // Option A: Get all products and filter by store (if your API works that way)
        const res = await client.get(`/products/?store_id=${storeId}`);
        // Option B: const res = await client.get(`/stores/${storeId}/products`);
        
        setProducts(res.data);
      } catch (error) {
        console.error("Failed to load products", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [storeId]);

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
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2} // <--- Creates the Grid Layout
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <ProductCard 
              name={item.name}
              price={item.price}
              image_url={item.image_url}
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
                Alert.alert("Success", "Added to your bag"); // Simple feedback
              }}
            />
          )}
          ListEmptyComponent={
            <View className="mt-10 items-center">
              <Text className="text-gray-400">No products found in this store.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}