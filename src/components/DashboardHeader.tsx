import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Search, MapPin, ChevronDown } from 'lucide-react-native';

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
  searchText,
  onSearchChange,
  searchPlaceholder,
  categories,
  activeCategory,
  onCategoryPress,
}: DashboardHeaderProps) {
  return (
    <View className="pt-2">
      {/* HEADER ROW */}
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-gold-500 text-[9px] font-bold uppercase tracking-[2px]">
            {subtitle}
          </Text>
          <Text className="text-xl text-onyx font-serif">
            {title}
          </Text>
        </View>

        {/* ADDRESS PILL */}
        <TouchableOpacity 
          onPress={onAddressPress} 
          activeOpacity={0.7} 
          className="flex-row items-center bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100"
        >
           <MapPin size={12} color="#D4AF37" />
           <View className="ml-1.5 mr-1">
              <Text className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">{addressLabel}</Text>
              <Text className="text-[10px] text-onyx font-bold" numberOfLines={1}>{addressLine}</Text>
           </View>
           <ChevronDown size={12} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View className="flex-row items-center bg-white rounded-xl px-4 py-2 mb-4 shadow-sm border border-gray-100">
        <Search color="#9CA3AF" size={16} />
        <TextInput 
          placeholder={searchPlaceholder}
          placeholderTextColor="#9CA3AF"
          className="ml-2 flex-1 text-onyx text-sm p-0"
          value={searchText}
          onChangeText={onSearchChange}
        />
      </View>

      {/* CATEGORIES */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="mb-4"
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onCategoryPress(cat.id)}
            className={`mr-3 px-4 py-1.5 rounded-full border ${
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