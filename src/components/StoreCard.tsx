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
      activeOpacity={0.9}
      // REMOVED mb-6 (handled by grid gap now)
      // Added flex-1 to fill the grid column
      className="flex-1 bg-onyx rounded-xl overflow-hidden border border-gray-100 shadow-sm"
    >
      {/* Store Image - Reduced height for compact grid (h-32) */}
      <View className="h-32 w-full bg-gray-800 relative">
        <Image 
          source={{ uri: image_url }} 
          className="w-full h-full opacity-90"
          resizeMode="cover"
        />
        {/* Compact Category Badge */}
        <View className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md">
          <Text className="text-white/[0.9] text-[10px] font-bold uppercase tracking-wide">
            {category}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="p-3">
        <View className="flex-row justify-between items-start mb-1">
          <Text 
            className="text-base text-white font-serif flex-1 me-1" 
            numberOfLines={1}
          >
            {name}
          </Text>
          {/* Rating */}
          <View className="flex-row items-center bg-white/10 px-1.5 py-0.5 rounded">
            <Star size={10} color="#D4AF37" fill="#D4AF37" />
            <Text className="text-gold-400 font-bold ms-1 text-[10px]">{rating}</Text>
          </View>
        </View>
        
        <View className="flex-row items-center">
          <MapPin size={12} color="#6B7280" />
          <Text className="text-gray-400 text-[10px] ms-1" numberOfLines={1}>
            Level 1
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}