import React from 'react';
import { View, Text } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { Clock, Check, Truck, ShoppingBag, MapPin, XCircle } from 'lucide-react-native';

const STATUS_STEP_KEYS = [
  { key: 'pending', labelKey: 'order_placed', descKey: 'order_placed_desc', icon: Clock },
  { key: 'confirmed', labelKey: 'confirmed', descKey: 'status_confirmed_desc', icon: Check },
  { key: 'assigned', labelKey: 'driver_assigned', descKey: 'driver_assigned_desc', icon: Truck },
  { key: 'picked_up', labelKey: 'picked_up', descKey: 'picked_up_desc', icon: ShoppingBag },
  { key: 'in_transit', labelKey: 'in_transit', descKey: 'in_transit_desc', icon: Truck },
  { key: 'delivered', labelKey: 'delivered', descKey: 'delivered_desc', icon: MapPin },
  { key: 'canceled', labelKey: 'canceled', descKey: 'canceled_desc', icon: XCircle },
];

interface OrderTimelineProps {
  status: string;
}

export default function OrderTimeline({ status }: OrderTimelineProps) {
  const { t } = useLanguage();

  const currentStepIndex = STATUS_STEP_KEYS.findIndex(s => s.key === status);
  const isCanceled = status === 'canceled';

  return (
    <View className="bg-white mt-4 p-6 shadow-sm border-y border-gray-100">
      <Text className="text-lg font-bold text-onyx font-serif mb-6">{t('order_status')}</Text>
      <View className="ms-2">
        {STATUS_STEP_KEYS.map((step, index) => {
          if (step.key === 'canceled' && !isCanceled) return null;
          const isActive = index <= currentStepIndex;
          const isLast = index === STATUS_STEP_KEYS.length - 1 || (step.key === 'delivered' && !isCanceled);
          return (
            <View key={step.key} className="flex-row">
              <View className="items-center me-4">
                <View className={`w-8 h-8 rounded-full items-center justify-center border-2 z-10 ${
                  isActive ? 'bg-gold-500 border-gold-500' : 'bg-white border-gray-200'
                }`}>
                  <step.icon size={14} color={isActive ? '#1A1A1A' : '#9CA3AF'} />
                </View>
                {!isLast && (
                  <View className={`w-0.5 flex-1 my-1 ${isActive && index < currentStepIndex ? 'bg-gold-500' : 'bg-gray-200'}`} />
                )}
              </View>
              <View className={`pb-8 flex-1 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                <Text className="text-base font-bold text-onyx">{t(step.labelKey as any)}</Text>
                <Text className="text-xs text-gray-500 mt-0.5">{t(step.descKey as any)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
