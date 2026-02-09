import React from 'react';
import { View, Text } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { OrderItem } from '../types';

interface OrderReceiptProps {
  items: OrderItem[];
  totalPrice: number;
}

export default function OrderReceipt({ items, totalPrice }: OrderReceiptProps) {
  const { t } = useLanguage();

  return (
    <View className="bg-white mt-4 p-6 shadow-sm border-y border-gray-100 pb-10">
      <Text className="text-lg font-bold text-onyx font-serif mb-4">{t('order_summary')}</Text>
      {items?.map((item: OrderItem, idx: number) => (
        <View key={idx} className="flex-row justify-between mb-3">
          <View className="flex-row gap-3 flex-1">
            <Text className="font-bold text-gray-500">{item.quantity}x</Text>
            <Text className="text-onyx flex-1 font-medium">{item.product?.name}</Text>
          </View>
          <Text className="text-gray-700 font-mono">${(item.price_at_purchase * item.quantity).toFixed(2)}</Text>
        </View>
      ))}
      <View className="h-px bg-gray-100 my-4" />
      <View className="flex-row justify-between items-center mb-6">
        <Text className="font-bold text-gray-900 text-lg">{t('total')}</Text>
        <Text className="font-bold text-gold-600 text-2xl font-mono">${totalPrice.toFixed(2)}</Text>
      </View>
    </View>
  );
}
