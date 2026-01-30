import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, MapPin, ShoppingBag, Store } from 'lucide-react-native';
import client from '../api/client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';
import * as SecureStore from 'expo-secure-store';

// --- CONFIG: WebSocket URL ---
// Android Emulator: 10.0.2.2
// Physical Device: Your Computer IP (e.g., 192.168.1.101)
const HOST = '192.168.1.101:8000';
const WS_BASE_URL = `ws://${HOST}/api/v1/orders`; 

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

  // 1. Initial Fetch
  useEffect(() => {
    fetchOrderDetails();
  }, []);

  // 2. WebSocket Listener
  useEffect(() => {
    let ws: WebSocket | null = null;

    const connectWebSocket = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) return;

            const url = `${WS_BASE_URL}/${orderId}/ws?token=${token}`;
            ws = new WebSocket(url);

            ws.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    if (data.type === 'status_update') {
                        setOrder((prev: any) => prev ? ({ ...prev, status: data.status }) : prev);
                    }
                } catch (err) {
                    console.log("WS Parse Error", err);
                }
            };
        } catch (error) {
            console.error("Failed to setup WebSocket:", error);
        }
    };

    connectWebSocket();

    return () => {
        if (ws) ws.close();
    };
  }, [orderId]);

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

  if (loading && !order) {
    return (
      <View className="flex-1 items-center justify-center bg-creme">
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (!order) return null;

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order.status);
  const isCanceled = order.status === 'canceled';

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-onyx/5 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-gray-100 rounded-full mr-4">
          <ArrowLeft color="#0F0F0F" size={20} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-serif text-onyx">Order #{order.id}</Text>
          <View className="flex-row items-center">
            {/* Store Name Display */}
            <Text className="text-xs text-gray-500 font-bold mr-1">
              From: {order.store?.name || "Store"}
            </Text>
            <Text className="text-xs text-gray-400">• {new Date(order.created_at).toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
        }
      >
        {/* Status Timeline */}
        <View className="bg-white p-6 mb-4">
          <View className="flex-row justify-between items-center mb-6">
             <Text className="text-lg font-bold text-onyx">Order Status</Text>
             <View className={`px-2 py-1 rounded ${
                order.status === 'delivered' ? 'bg-green-100' : 'bg-amber-100'
             }`}>
                <Text className={`text-xs font-bold capitalize ${
                    order.status === 'delivered' ? 'text-green-700' : 'text-amber-800'
                }`}>
                    {order.status.replace('_', ' ')}
                </Text>
             </View>
          </View>

          {isCanceled ? (
            <View className="bg-red-50 p-4 rounded-xl border border-red-100 flex-row items-center">
                <Text className="text-red-800 font-bold">Order Canceled</Text>
            </View>
          ) : (
            <View className="pl-2">
              {STATUS_STEPS.map((step, index) => {
                const isActive = index <= currentStepIndex;
                const isLast = index === STATUS_STEPS.length - 1;
                const isCurrent = index === currentStepIndex;

                return (
                  <View key={step.key} className="flex-row">
                    <View className="items-center mr-4" style={{ width: 20 }}>
                      <View className={`w-5 h-5 rounded-full items-center justify-center z-10 ${
                        isActive ? 'bg-gold' : 'bg-gray-200'
                      }`}>
                        {isActive && <Check size={10} color="white" strokeWidth={4} />}
                      </View>
                      {!isLast && (
                        <View className={`w-0.5 flex-1 ${
                          isActive && index < currentStepIndex ? 'bg-gold' : 'bg-gray-200'
                        }`} />
                      )}
                    </View>
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

        {/* Store Info Card (Optional but nice) */}
        {order.store && (
            <View className="bg-white p-4 mb-4 flex-row items-center">
                <View className="w-12 h-12 bg-gray-100 rounded-lg mr-3 overflow-hidden">
                    {order.store.image_url ? (
                        <Image source={{ uri: order.store.image_url }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <View className="w-full h-full items-center justify-center"><Store size={20} color="#9CA3AF" /></View>
                    )}
                </View>
                <View>
                    <Text className="text-sm font-bold text-onyx">{order.store.name}</Text>
                    <Text className="text-xs text-gray-500">Store Partner</Text>
                </View>
            </View>
        )}

        {/* Items List */}
        <View className="bg-white p-6 mb-4">
          <Text className="text-lg font-bold text-onyx mb-4">Items</Text>
          {order.items?.map((item: any, idx: number) => (
            <View key={idx} className="flex-row justify-between items-center mb-4 last:mb-0">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center mr-3">
                  <ShoppingBag size={18} color="#9CA3AF" />
                </View>
                <View>
                  {/* Robust Name Check */}
                  <Text className="text-onyx font-medium">
                    {item.product?.name || `Item #${item.product_id}`}
                  </Text>
                  <Text className="text-gray-400 text-xs">Qty: {item.quantity}</Text>
                </View>
              </View>
              <Text className="font-bold text-onyx">${item.price_at_purchase.toFixed(2)}</Text>
            </View>
          ))}
          
          <View className="h-[1px] bg-gray-100 my-4" />
          
          <View className="flex-row justify-between items-center">
             <Text className="font-bold text-onyx text-base">Total</Text>
             <Text className="font-bold text-onyx text-xl">${order.total_price.toFixed(2)}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View className="bg-white p-6">
          <Text className="text-lg font-bold text-onyx mb-4">Delivery Details</Text>
          <View className="flex-row items-start">
            <MapPin size={20} color="#D4AF37" className="mt-0.5 mr-3" />
            <View>
              <Text className="text-onyx font-medium">Delivery Address</Text>
              <Text className="text-gray-500 mt-1">{order.delivery_address || "No address provided"}</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}