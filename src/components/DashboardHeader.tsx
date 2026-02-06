import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Search, MapPin, ChevronDown } from 'lucide-react-native';
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
  
  // 👇 Replaced "searchText/onChange" with simple "onSearchPress"
  onSearchPress: () => void; 
  searchPlaceholder: string;

  categories: Category[];
  activeCategory: string;
  onCategoryPress: (id: string) => void;
}

export default function DashboardHeader({
  subtitle, title, addressLabel, addressLine, onAddressPress, isGuest = false,
  onSearchPress, searchPlaceholder, categories, activeCategory, onCategoryPress,
}: DashboardHeaderProps) {
  const { t } = useLanguage();

  return (
    <View className="pt-3">
      {/* TOP ROW: Search + Address */}
      <View className="flex-row items-center mb-2 gap-1">
        
        {/* PILL 1: FAKE SEARCH BAR (Clickable) */}
        <TouchableOpacity 
          onPress={onSearchPress} // 👈 Navigates to new screen
          activeOpacity={0.9}
          className="flex-1 flex-row items-center bg-white rounded-xl px-4 py-2.5 shadow-sm border border-gray-100"
        >
          <Search color="#9CA3AF" size={16} />
          <Text className="ms-2 text-gray-400 text-sm">
            {searchPlaceholder}
          </Text>
        </TouchableOpacity>
        
        {/* PILL 2: ADDRESS */}
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

      {/* CATEGORIES */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onCategoryPress(cat.id)}
            className={`me-1 px-4 py-1.5 rounded-full border ${
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
  );
}