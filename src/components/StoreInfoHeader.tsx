import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';

interface StoreInfoHeaderProps {
  storeName: string;
  category: string;
  imageUrl?: string;
  store: { rating?: number; review_count?: number; description?: string; address?: string } | null;
  activeTab: 'products' | 'reviews';
  onTabChange: (tab: 'products' | 'reviews') => void;
  bannerHeight: number;
  sheetBgColor: string;
}

export default function StoreInfoHeader({
  storeName, category, imageUrl, store,
  activeTab, onTabChange, bannerHeight, sheetBgColor,
}: StoreInfoHeaderProps) {
  const { t } = useLanguage();

  return (
    <View>
      <View style={{ height: bannerHeight, backgroundColor: 'transparent' }} />

      <View
        className="-mt-6 rounded-t-3xl pt-2 pb-0 px-6 shadow-sm"
        style={{ backgroundColor: sheetBgColor }}
      >
        <View className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 opacity-40" />

        <View className="flex-row gap-4">
          <View className="-mt-14 w-24 h-24 rounded-2xl border-4 border-[#F5F5F0] bg-white items-center justify-center overflow-hidden shadow-sm">
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Text className="text-4xl font-serif text-onyx font-bold opacity-20">{storeName.charAt(0)}</Text>
            )}
          </View>

          <View className="flex-1 pt-1">
            <Text className="text-2xl font-serif font-bold text-onyx" numberOfLines={2}>
              {storeName}
            </Text>
            <View className="flex-row items-center gap-2 mt-2">
              <View className="bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{category}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Star size={12} color="#D4AF37" fill="#D4AF37" />
                <Text className="text-xs text-onyx font-bold">
                  {(store?.rating && Number(store.rating) > 0) ? Number(store.rating).toFixed(1) : "New"}
                </Text>
                {(store?.review_count || 0) > 0 && (
                  <Text className="text-[10px] text-gray-400 ml-0.5">
                    ({store?.review_count})
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View className="mt-5 bg-white p-3 rounded-xl border border-gray-100/50 shadow-sm">
          <Text className="text-gray-500 text-xs leading-relaxed" numberOfLines={3}>
            {store?.description || t('default_store_description')}
          </Text>
          {store?.address && (
            <View className="mt-3 pt-3 border-t border-gray-50 flex-row items-center gap-2">
              <MapPin size={12} color="#9CA3AF" />
              <Text className="text-gray-400 text-[10px] font-bold">{store.address}</Text>
            </View>
          )}
        </View>

        {/* TABS */}
        <View className="flex-row mt-8 mb-4 border-b border-gray-200">
          <TouchableOpacity
            onPress={() => onTabChange('products')}
            className={`pb-3 mr-6 ${activeTab === 'products' ? 'border-b-2 border-gold-500' : ''}`}
          >
            <Text className={`text-lg font-serif font-bold ${activeTab === 'products' ? 'text-onyx' : 'text-gray-400'}`}>
              {t('products')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onTabChange('reviews')}
            className={`pb-3 ${activeTab === 'reviews' ? 'border-b-2 border-gold-500' : ''}`}
          >
            <Text className={`text-lg font-serif font-bold ${activeTab === 'reviews' ? 'text-onyx' : 'text-gray-400'}`}>
              {t('reviews')}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 2, marginBottom: -1, backgroundColor: sheetBgColor }} />
      </View>
    </View>
  );
}
