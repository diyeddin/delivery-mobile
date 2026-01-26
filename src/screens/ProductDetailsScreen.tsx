import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ShoppingBag } from 'lucide-react-native';
import { HomeStackParamList } from '../types';
import { useCart } from '../context/CartContext';
import Toast from 'react-native-toast-message';
import client from '../api/client'; // <--- Import API Client

type Props = NativeStackScreenProps<HomeStackParamList, 'ProductDetails'>;

export default function ProductDetailsScreen({ route, navigation }: Props) {
  const { addToCart } = useCart();
  
  // 1. Initialize State with the navigation params (so it loads instantly)
  const { productId, name: initialName, price: initialPrice, description: initialDesc, image_url: initialImg } = route.params;

  const [product, setProduct] = useState({
    name: initialName,
    price: initialPrice,
    description: initialDesc,
    image_url: initialImg
  });

  const [refreshing, setRefreshing] = useState(false);

  // 2. The Refresh Logic
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Fetch fresh data from backend
      // Assumes GET /products/{id} exists
      const res = await client.get(`/products/${productId}`);
      
      // Update the local state with fresh data
      setProduct({
        name: res.data.name,
        price: res.data.price,
        description: res.data.description,
        image_url: res.data.image_url
      });
      
      // Optional: Show a subtle toast that data updated
      // Toast.show({ type: 'success', text1: 'Updated', visibilityTime: 1000 });

    } catch (error) {
      console.error("Failed to refresh product:", error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Could not fetch latest product details.'
      });
    } finally {
      setRefreshing(false);
    }
  }, [productId]);

  return (
    <View className="flex-1 bg-creme">
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
        // 3. Attach Refresh Control
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#D4AF37" // Gold
            colors={['#D4AF37']}
          />
        }
      >
        
        {/* Large Image Header */}
        <View className="h-96 w-full bg-gray-100 relative">
          <Image 
            // Use state 'product' instead of static params
            source={{ uri: product.image_url || 'https://via.placeholder.com/600' }} 
            className="w-full h-full"
            resizeMode="cover"
          />
          <SafeAreaView className="absolute top-0 left-0 w-full" edges={['top']}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="ml-6 mt-4 p-2 bg-white/20 backdrop-blur-md rounded-full w-10 h-10 items-center justify-center"
            >
              <ArrowLeft color="#0F0F0F" size={20} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Content Body */}
        <View className="px-6 py-8">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 mr-4">
              {/* Use state 'product' */}
              <Text className="text-3xl font-serif text-onyx mb-2">{product.name}</Text>
              <Text className="text-gray-500 text-xs uppercase tracking-widest font-bold">
                Luxury Collection
              </Text>
            </View>
            <Text className="text-2xl text-gold-600 font-serif">
              ${product.price.toFixed(2)}
            </Text>
          </View>

          <View className="h-[1px] bg-onyx/10 my-4 w-full" />

          <Text className="text-lg font-serif text-onyx mb-3">Description</Text>
          <Text className="text-gray-600 leading-6">
            {product.description || "Experience the finest quality with this exclusive item. Crafted for elegance and durability, it is the perfect addition to your collection."}
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom "Add to Cart" Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6 pb-10 shadow-2xl">
        <TouchableOpacity 
          className="bg-onyx py-4 rounded-xl flex-row items-center justify-center shadow-lg"
          activeOpacity={0.8}
          onPress={() => {
            addToCart({
              id: productId,
              name: product.name, // Use the (potentially updated) name
              price: product.price, // Use the (potentially updated) price
              image_url: product.image_url
            });
            Toast.show({
              type: 'success',
              text1: 'Added to Bag',
              text2: `${product.name} has been added to your cart.`,
              visibilityTime: 3000,
            });
            navigation.goBack(); 
          }}
        >
          <ShoppingBag color="white" size={20} className="mr-2" />
          <Text className="text-white font-bold text-lg ml-2">Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}