import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Star, MapPin } from 'lucide-react-native';

interface StoreProps {
  id: number;
  name: string;
  category: string;
  image_url?: string;
  rating?: number;
  onPress: () => void;
}

export default function StoreCard({ name, category, image_url, rating = 4.8, onPress }: StoreProps) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={1}
      className="mb-6 bg-onyx rounded-2xl overflow-hidden border border-white/10 shadow-lg"
    >
      {/* Store Image */}
      <View className="h-40 w-full bg-gray-800">
        <Image 
          source={{ uri: image_url || 'https://via.placeholder.com/400x200' }} 
          className="w-full h-full opacity-80"
          resizeMode="cover"
        />
        {/* Category Badge */}
        <View className="absolute top-3 left-3 bg-gold-500/90 px-3 py-1 rounded-full">
          <Text className="text-onyx text-xs font-bold uppercase tracking-wider">
            {category}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="p-4">
        <View className="flex-row justify-between items-start">
          <View>
            <Text className="text-xl text-white font-serif mb-1">{name}</Text>
            <View className="flex-row items-center">
              <MapPin size={14} color="#6B7280" />
              <Text className="text-gray-400 text-xs ml-1">Grand Mall, Level 1</Text>
            </View>
          </View>
          
          {/* Rating */}
          <View className="flex-row items-center bg-white/5 px-2 py-1 rounded-lg">
            <Star size={14} color="#D4AF37" fill="#D4AF37" />
            <Text className="text-gold-400 font-bold ml-1 text-xs">{rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}