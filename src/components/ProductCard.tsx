import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { ShoppingBag, Plus } from 'lucide-react-native';

interface ProductProps {
  name: string;
  price: number;
  image_url?: string;
  category: string;
  onPress: () => void;
  onAddToCart: () => void;
}

export default function ProductCard({ name, price, image_url, category, onPress, onAddToCart }: ProductProps) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.9}
      // 👇 PADDING (p-2) creates the whitespace around the islands
      className="flex-1 bg-white rounded-xl border border-gray-200 p-2 shadow-sm"
    >
      {/* 👇 IMAGE ISLAND (Rounded corners separate from card edge) */}
      <View className="h-56 w-full bg-gray-50 rounded-lg overflow-hidden relative">
        <Image 
          source={{ uri: image_url || 'https://via.placeholder.com/200' }} 
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      {/* Details Section */}
      <View className="mt-2 px-1">
        {/* Category & Name */}
        <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">
          {category}
        </Text>
        <Text numberOfLines={2} className="text-onyx font-serif text-sm font-medium mb-3 h-10 leading-tight">
          {name}
        </Text>

        {/* 👇 PRICE ISLAND */}
        <View className="bg-gray-100 rounded-lg p-1 flex-row items-center justify-between">
          
          {/* Price (Left) */}
          <View className="px-2">
            <Text className="text-onyx font-bold text-sm">
              ${price.toFixed(2)}
            </Text>
          </View>

          {/* Add to Cart Button (Right) */}
          <TouchableOpacity 
            onPress={onAddToCart}
            className="bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-200 flex-row items-center gap-1 active:bg-gray-50"
          >
            <ShoppingBag size={14} color="#1A1A1A" />
            <Plus size={10} color="#1A1A1A" strokeWidth={4} />
          </TouchableOpacity>
        </View>

      </View>
    </TouchableOpacity>
  );
}