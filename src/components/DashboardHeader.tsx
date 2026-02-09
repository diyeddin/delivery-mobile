import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Search, MapPin, ChevronDown, SlidersHorizontal } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useLanguage } from '../context/LanguageContext';

interface Category { id: string; label: string; }

interface DashboardHeaderProps {
  subtitle: string;
  title: string;
  addressLabel: string;
  addressLine: string;
  onAddressPress: () => void;
  isGuest?: boolean;
  onSearchPress: () => void; 
  searchPlaceholder: string;
  categories: Category[];
  activeCategory: string;
  onCategoryPress: (id: string) => void;
  onFilterPress?: () => void;
}

export default function DashboardHeader({
  subtitle, title, addressLabel, addressLine, onAddressPress, isGuest = false,
  onSearchPress, searchPlaceholder, categories, activeCategory, onCategoryPress, onFilterPress,

}: DashboardHeaderProps) {
  const { t } = useLanguage();

  return (
    <View className="pt-3">
      {/* TOP ROW: Search + Address */}
      <View className="flex-row items-center mb-2 gap-1">
        <TouchableOpacity 
          onPress={onSearchPress}
          activeOpacity={0.9}
          className="flex-1 flex-row items-center bg-white rounded-xl px-4 py-2.5 shadow-sm border border-gray-100"
        >
          <Search color="#9CA3AF" size={16} />
          <Text className="ms-2 text-gray-400 text-sm">
            {searchPlaceholder}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={isGuest ? () => Toast.show({type: 'info', text1: t('login_required')}) : onAddressPress} 
          activeOpacity={0.7} 
          className="flex-row items-center bg-white px-3 py-2.5 rounded-xl shadow-sm border border-gray-100"
        >
            <MapPin size={12} color="#D4AF37" />
            <View className="ms-1.5 me-1">
              <Text className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">{addressLabel}</Text>
            </View>
            <ChevronDown size={12} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* 👇 FILTER & CATEGORIES ROW */}
      <View className="flex-row items-center mt-3 pb-2">  
        
        {/* Filter Button: Updated to match Pill Height & Shape */}
        <TouchableOpacity 
          onPress={onFilterPress}
          className="bg-white border border-gray-200 p-2 rounded-full me-2 shadow-sm active:bg-gray-50 items-center justify-center"
          style={styles.filterButton}
        >
          <SlidersHorizontal size={14} color="#1F2937" />
        </TouchableOpacity>

        {/* Categories: Added flex-1 to occupy remaining space properly */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="flex-1"
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onCategoryPress(cat.id)}
              className={`me-2 px-4 py-2 rounded-full border ${
                activeCategory === cat.id ? 'bg-onyx border-onyx' : 'bg-white border-gray-200'
              }`}
            >
              <Text className={`text-xs px-1 font-bold tracking-wide ${
                activeCategory === cat.id ? 'text-gold-400' : 'text-gray-500'
              }`}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    width: 34,
    height: 34,
  },
  categoryScrollContent: {
    paddingRight: 10,
    alignItems: 'center' as const,
  },
});