import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, StyleSheet } from 'react-native';
import { ShoppingBag, Truck, ChevronDown, MapPin, User } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { ActiveOrder } from '../types';

interface ActiveOrderWidgetProps {
  activeOrder: ActiveOrder;
  onViewDetails: () => void;
}

export default function ActiveOrderWidget({ activeOrder, onViewDetails }: ActiveOrderWidgetProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const TIMELINE_STEPS = [
    { label: t('status_confirmed'), icon: ShoppingBag },
    { label: t('status_driver'), icon: User },
    { label: t('status_on_way'), icon: Truck },
    { label: t('status_arriving'), icon: MapPin },
  ];

  const toggleWidget = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return t('status_preparing');
      case 'assigned': return t('status_driver_assigned');
      case 'picked_up': return t('status_heading_to_you');
      case 'in_transit': return t('status_arriving_soon');
      case 'pending': return t('status_waiting_for_store');
      default: return t('active_order');
    }
  };

  const getCurrentStepIndex = (status: string) => {
    if (status === 'delivered') return 3;
    if (['picked_up', 'in_transit'].includes(status)) return 2;
    if (['assigned'].includes(status)) return 1;
    return 0;
  };

  return (
    <View className="absolute bottom-6 left-4 right-4 z-50">
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={toggleWidget}
        className={`bg-onyx rounded-2xl border border-white/10 shadow-2xl overflow-hidden shadow-black/50 ${isExpanded ? 'pb-5' : 'p-0'}`}
      >
        {/* Widget Header */}
        <View className="flex-row items-center justify-between p-4 bg-onyx z-20">
          <View className="flex-row items-center flex-1">
            <View className="relative me-4">
              <View className="w-10 h-10 bg-gold-500/20 rounded-full items-center justify-center animate-pulse">
                <View className="w-6 h-6 bg-gold-500 rounded-full items-center justify-center shadow-lg">
                  {['in_transit', 'picked_up'].includes(activeOrder.status) ? (
                    <Truck size={12} color="#1A1A1A" fill="#1A1A1A" />
                  ) : (
                    <ShoppingBag size={12} color="#1A1A1A" fill="#1A1A1A" />
                  )}
                </View>
              </View>
            </View>

            <View>
              <Text className="text-gold-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                {activeOrder.store?.name || t('active_order')}
              </Text>
              <Text className="text-white font-bold text-sm">
                {getStatusText(activeOrder.status)}
              </Text>
            </View>
          </View>

          <View className="bg-white/10 p-2 rounded-full ms-4">
            <ChevronDown size={16} color="#D4AF37" style={{ transform: [{ rotate: isExpanded ? '0deg' : '180deg' }] }} />
          </View>
        </View>

        {/* Expanded Timeline */}
        {isExpanded && (
          <View className="px-5 pt-2">
            <View className="flex-row items-center justify-between mt-2 mb-6 relative">
              <View className="absolute top-[14px] left-4 right-4 h-[2px] bg-white/10 z-0" />
              <View
                className="absolute top-[14px] left-4 h-[2px] bg-gold-500 z-0"
                style={{
                  width: `${(getCurrentStepIndex(activeOrder.status) / (TIMELINE_STEPS.length - 1)) * 90}%`
                }}
              />
              {TIMELINE_STEPS.map((step, index) => {
                const currentIndex = getCurrentStepIndex(activeOrder.status);
                const isActive = index <= currentIndex;
                return (
                  <View key={index} className="items-center z-10" style={styles.timelineStep}>
                    <View className={`w-8 h-8 rounded-full items-center justify-center border-2 mb-2 ${
                      isActive ? 'bg-onyx border-gold-500' : 'bg-onyx border-gray-600'
                    }`}>
                      {isActive ? <step.icon size={12} color="#D4AF37" /> : <View className="w-2 h-2 rounded-full bg-gray-600" />}
                    </View>
                    <Text className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-gray-600'}`}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={onViewDetails}
              className="w-full bg-gold-500 py-3 rounded-xl items-center shadow-lg shadow-gold-500/20 active:opacity-90"
            >
              <Text className="text-onyx font-bold uppercase tracking-wider text-xs">{t('view_order_details')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  timelineStep: {
    width: 60,
  },
});
