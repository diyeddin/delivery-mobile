import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ShoppingBag } from 'lucide-react-native';
import { HomeStackParamList } from '../types';
import { useCart } from '../context/CartContext';
import { Alert } from 'react-native'; // Optional, for feedback

type Props = NativeStackScreenProps<HomeStackParamList, 'ProductDetails'>;

export default function ProductDetailsScreen({ route, navigation }: Props) {
  const { addToCart } = useCart();
  const { productId, name, price, description, image_url } = route.params;

  return (
    <View className="flex-1 bg-creme">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Large Image Header */}
        <View className="h-96 w-full bg-gray-100 relative">
          <Image 
            source={{ uri: image_url || 'https://via.placeholder.com/600' }} 
            className="w-full h-full"
            resizeMode="cover"
          />
          {/* Back Button (Absolute Positioned over Image) */}
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
              <Text className="text-3xl font-serif text-onyx mb-2">{name}</Text>
              <Text className="text-gray-500 text-xs uppercase tracking-widest font-bold">
                Luxury Collection
              </Text>
            </View>
            <Text className="text-2xl text-gold-600 font-serif">
              ${price.toFixed(2)}
            </Text>
          </View>

          <View className="h-[1px] bg-onyx/10 my-4 w-full" />

          <Text className="text-lg font-serif text-onyx mb-3">Description</Text>
          <Text className="text-gray-600 leading-6">
            {description || "Experience the finest quality with this exclusive item. Crafted for elegance and durability, it is the perfect addition to your collection."}
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
              name,
              price,
              image_url
            });
            Alert.alert("Success", "Added to your bag"); // Simple feedback
            navigation.goBack(); // Optional: go back to store after adding
            }}
          >
          <ShoppingBag color="white" size={20} className="mr-2" />
          <Text className="text-white font-bold text-lg ml-2">Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}