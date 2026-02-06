import React from 'react';
import { View, Text } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  currentCount: number;
  totalCount: number;
  visible: boolean;
}

export default function PaginationBadge({ currentCount, totalCount, visible }: Props) {
  const { t } = useLanguage();

  if (!visible || currentCount === 0) return null;

  return (
    <View 
      // 👇 Position: Bottom Right | Style: White with Grey Border
      className="absolute bottom-6 right-6 bg-white/95 px-4 py-2.5 rounded-full shadow-sm border border-gray-200 backdrop-blur-md z-50"
      pointerEvents="none"
    >
      <Text className="text-onyx text-xs font-bold font-serif tracking-wide">
        <Text className="text-gold-500">{currentCount}</Text> / {totalCount}
      </Text>
    </View>
  );
}