import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';

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
      className="flex-1 m-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Product Image */}
      <View className="h-32 w-full bg-gray-50">
        <Image 
          source={{ uri: image_url || 'https://via.placeholder.com/200' }} 
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      {/* Details */}
      <View className="p-3">
        <Text numberOfLines={1} className="text-onyx font-serif text-base mb-1">
          {name}
        </Text>
        <Text className="text-gray-500 text-xs mb-3">
          {category}
        </Text>

        {/* Price & Add Button Row */}
        <View className="flex-row justify-between items-center">
          <Text className="text-gold-600 font-bold text-sm">
            ${price.toFixed(2)}
          </Text>
          
          <TouchableOpacity 
            onPress={onAddToCart}
            className="bg-onyx p-2 rounded-full"
          >
            <Plus color="white" size={16} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}