import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { X } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (minPrice: number | undefined, maxPrice: number | undefined, sortBy: string) => void;
  currentSort: string;
}

export default function FilterModal({ visible, onClose, onApply, currentSort }: FilterModalProps) {
  const { t } = useLanguage();
  
  // Local state
  const [selectedSort, setSelectedSort] = useState(currentSort);
  const [selectedPriceRange, setSelectedPriceRange] = useState<'all' | 'under_50' | '50_100' | 'over_100'>('all');

  const handleApply = () => {
    let min: number | undefined;
    let max: number | undefined;

    switch (selectedPriceRange) {
      case 'under_50': max = 50; break;
      case '50_100': min = 50; max = 100; break;
      case 'over_100': min = 100; break;
      case 'all': default: break;
    }
    
    onApply(min, max, selectedSort);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      {/* 👇 OUTER LAYER: TouchableOpacity fills the screen. 
        activeOpacity={1} prevents flashing when tapped.
        onPress={onClose} handles the "tap outside to close".
      */}
      <TouchableOpacity 
        className="flex-1 justify-end bg-transparent" 
        activeOpacity={1} 
        onPress={onClose}
      >
        {/* 👇 INNER LAYER: TouchableWithoutFeedback stops the tap event 
           from bubbling up to the outer layer when you tap the white box.
        */}
        <TouchableWithoutFeedback>
          <View className="bg-white rounded-t-3xl p-6 pb-10 shadow-2xl shadow-black">
            
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-serif font-bold text-onyx">{t('filters')}</Text>
              <TouchableOpacity onPress={onClose} className="p-2 bg-gray-100 rounded-full">
                <X size={20} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {/* Sort Options */}
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('sort_by')}</Text>
            <View className="flex-row gap-2 mb-6">
              {[
                { id: 'newest', label: t('sort_newest') },
                { id: 'price_asc', label: t('sort_price_low') },
                { id: 'price_desc', label: t('sort_price_high') }
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setSelectedSort(opt.id)}
                  className={`px-4 py-2 rounded-lg border ${
                    selectedSort === opt.id ? 'bg-onyx border-onyx' : 'bg-white border-gray-200'
                  }`}
                >
                  <Text className={`text-xs font-bold ${selectedSort === opt.id ? 'text-gold-400' : 'text-gray-600'}`}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price Range */}
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('price_range')}</Text>
            <View className="flex-row flex-wrap gap-2 mb-8">
              {[
                { id: 'all', label: t('price_all') },
                { id: 'under_50', label: '< $50' },
                { id: '50_100', label: '$50 - $100' },
                { id: 'over_100', label: '> $100' }
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setSelectedPriceRange(opt.id as any)}
                  className={`px-4 py-2 rounded-lg border ${
                    selectedPriceRange === opt.id ? 'bg-onyx border-onyx' : 'bg-white border-gray-200'
                  }`}
                >
                  <Text className={`text-xs font-bold ${selectedPriceRange === opt.id ? 'text-gold-400' : 'text-gray-600'}`}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Apply Button */}
            <TouchableOpacity 
              onPress={handleApply}
              className="bg-gold-500 w-full py-4 rounded-xl items-center shadow-md active:opacity-90"
            >
              <Text className="text-onyx font-bold uppercase tracking-widest text-sm">{t('apply_filters')}</Text>
            </TouchableOpacity>

          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
}