import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Clock, MapPin, ShoppingBag } from 'lucide-react-native';
import client from '../api/client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';

// Define the Status Order
const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', desc: 'We have received your order.' },
  { key: 'confirmed', label: 'Confirmed', desc: 'The store is preparing your items.' },
  { key: 'assigned', label: 'Driver Assigned', desc: 'A driver is on the way to the store.' },
  { key: 'picked_up', label: 'Picked Up', desc: 'Driver has your order.' },
  { key: 'in_transit', label: 'In Transit', desc: 'Your order is on the way to you.' },
  { key: 'delivered', label: 'Delivered', desc: 'Enjoy your meal!' },
];

type Props = NativeStackScreenProps<ProfileStackParamList, 'OrderDetails'>;

export default function OrderDetailsScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      const res = await client.get(`/orders/${orderId}`);
      setOrder(res.data);
    } catch (error) {
      console.error("Failed to load order details", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrderDetails();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-creme">
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (!order) return null;

  // Calculate current step index
  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order.status);
  const isCanceled = order.status === 'canceled';

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-onyx/5 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-gray-100 rounded-full mr-4">
          <ArrowLeft color="#0F0F0F" size={20} />
        </TouchableOpacity>
        <View>
          <Text className="text-lg font-serif text-onyx">Order #{order.id}</Text>
          <Text className="text-xs text-gray-500">
            {new Date(order.created_at).toLocaleString()}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" colors={['#D4AF37']} />
        }
      >
        
        {/* SECTION 1: TIMELINE */}
        <View className="bg-white p-6 mb-4">
          <Text className="text-lg font-bold text-onyx mb-6">Order Status</Text>
          
          {isCanceled ? (
            <View className="bg-red-50 p-4 rounded-xl border border-red-100 flex-row items-center">
              <View className="bg-red-100 p-2 rounded-full mr-3">
                <Text className="text-red-600 font-bold">✕</Text>
              </View>
              <View>
                <Text className="text-red-800 font-bold">Order Canceled</Text>
                <Text className="text-red-600 text-xs">This order was canceled.</Text>
              </View>
            </View>
          ) : (
            <View className="pl-2">
              {STATUS_STEPS.map((step, index) => {
                const isActive = index <= currentStepIndex;
                const isLast = index === STATUS_STEPS.length - 1;
                const isCurrent = index === currentStepIndex;

                return (
                  <View key={step.key} className="flex-row">
                    {/* Left Column: Line & Dot */}
                    <View className="items-center mr-4" style={{ width: 20 }}>
                      {/* The Dot */}
                      <View className={`w-5 h-5 rounded-full items-center justify-center z-10 ${
                        isActive ? 'bg-gold' : 'bg-gray-200'
                      }`}>
                        {isActive && <Check size={10} color="white" strokeWidth={4} />}
                      </View>
                      {/* The Line */}
                      {!isLast && (
                        <View className={`w-0.5 flex-1 ${
                          isActive && index < currentStepIndex ? 'bg-gold' : 'bg-gray-200'
                        }`} />
                      )}
                    </View>

                    {/* Right Column: Text */}
                    <View className={`flex-1 pb-8 ${isCurrent ? 'opacity-100' : 'opacity-40'}`}>
                      <Text className="text-onyx font-bold text-base">{step.label}</Text>
                      <Text className="text-gray-500 text-xs mt-0.5">{step.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* SECTION 2: ITEMS */}
        <View className="bg-white p-6 mb-4">
          <Text className="text-lg font-bold text-onyx mb-4">Items</Text>
          {order.items?.map((item: any, idx: number) => (
            <View key={idx} className="flex-row justify-between items-center mb-4 last:mb-0">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center mr-3">
                  <ShoppingBag size={18} color="#9CA3AF" />
                </View>
                <View>
                  <Text className="text-onyx font-medium">{item.product_name || `Item #${item.product_id}`}</Text>
                  <Text className="text-gray-400 text-xs">Qty: {item.quantity}</Text>
                </View>
              </View>
              <Text className="font-bold text-onyx">${item.price_at_purchase.toFixed(2)}</Text>
            </View>
          ))}
          
          <View className="h-[1px] bg-gray-100 my-4" />
          
          <View className="flex-row justify-between items-center">
            <Text className="font-bold text-onyx text-lg">Total</Text>
            <Text className="font-bold text-gold text-xl">${order.total_price.toFixed(2)}</Text>
          </View>
        </View>

        {/* SECTION 3: DELIVERY INFO */}
        <View className="bg-white p-6">
          <Text className="text-lg font-bold text-onyx mb-4">Delivery Details</Text>
          <View className="flex-row items-start">
            <MapPin size={20} color="#D4AF37" className="mt-0.5 mr-3" />
            <View>
              <Text className="text-onyx font-medium">Delivery Address</Text>
              <Text className="text-gray-500 mt-1">
                {order.delivery_address || "No address provided"}
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}