import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Search, MapPin, ChevronDown } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

interface Category {
  id: string;
  label: string;
}

interface DashboardHeaderProps {
  // Text Props
  subtitle: string;
  title: string;
  
  // Address Props
  addressLabel: string;
  addressLine: string;
  onAddressPress: () => void;
  isGuest?: boolean;

  // Search Props
  searchText: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder: string;

  // Category Props
  categories: Category[];
  activeCategory: string;
  onCategoryPress: (id: string) => void;
}

export default function DashboardHeader({
  subtitle,
  title,
  addressLabel,
  addressLine,
  onAddressPress,
  isGuest = false,
  searchText,
  onSearchChange,
  searchPlaceholder,
  categories,
  activeCategory,
  onCategoryPress,
}: DashboardHeaderProps) {
  const handleAddressPress = () => {
    if (isGuest) {
      Toast.show({
        type: 'info',
        text1: 'Login Required',
        text2: 'Please log in to change your address',
      });
      return;
    }
    onAddressPress();
  };

  return (
    <View className="pt-3">

      {/* SEARCH BAR */}
      <View className="flex-row items-center mb-2 gap-1">
        {/* PILL 1: SEARCH BAR (Takes remaining space) */}
        <View className="flex-1 flex-row items-center bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100">
          <Search color="#9CA3AF" size={16} />
          <TextInput 
            placeholder={searchPlaceholder}
            placeholderTextColor="#9CA3AF"
            className="ml-2 flex-1 text-onyx text-sm p-0"
            value={searchText}
            onChangeText={onSearchChange}
          />
        </View>
        
        {/* PILL 2: ADDRESS (Side by side) */}
        <TouchableOpacity 
          onPress={handleAddressPress} 
          activeOpacity={0.7} 
          className="flex-row items-center bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100"
        >
            <MapPin size={12} color="#D4AF37" />
            <View className="ml-1.5 mr-1">
              <Text className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">{addressLabel}</Text>
              {/* <Text className="text-[6px] text-onyx font-bold" numberOfLines={1}>{addressLine}</Text> */}
            </View>
            <ChevronDown size={12} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* CATEGORIES */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="mb-2"
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onCategoryPress(cat.id)}
            className={`mr-1 px-4 py-1.5 rounded-full border ${
              activeCategory === cat.id 
                ? 'bg-onyx border-onyx' 
                : 'bg-white border-gray-200'
            }`}
          >
            <Text className={`text-xs font-bold tracking-wide ${
              activeCategory === cat.id ? 'text-gold-400' : 'text-gray-500'
            }`}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}