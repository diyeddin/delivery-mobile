import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Search, ArrowUpLeft } from 'lucide-react-native';

interface SearchSuggestionRowProps {
  item: { id: number; name: string; category?: string; image_url?: string; price?: number; description?: string };
  type: 'store' | 'product';
  isRTL: boolean;
  onPress: () => void;
  onFillSearch: () => void;
}

export default React.memo(function SearchSuggestionRow({
  item, isRTL, onPress, onFillSearch,
}: SearchSuggestionRowProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center py-3 border-b border-gray-50 px-4 active:bg-gray-50"
      onPress={onPress}
    >
      <View className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden border border-gray-100">
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="items-center justify-center flex-1">
            <Search size={14} color="#9CA3AF" />
          </View>
        )}
      </View>

      <View className="flex-1 ms-3 justify-center">
        <Text className="text-sm text-onyx font-medium" numberOfLines={1}>{item.name}</Text>
        <Text className="text-xs text-gray-400" numberOfLines={1}>{item.category}</Text>
      </View>

      <TouchableOpacity className="p-2" onPress={onFillSearch}>
        <ArrowUpLeft size={16} color="#D1D5DB" style={{ transform: [{ rotateY: isRTL ? '180deg' : '0deg' }] }} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});
