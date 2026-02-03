import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, StatusBar, Linking, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { ArrowLeft, Check, MapPin, ShoppingBag, Store, Clock, Truck, Phone, DollarSign, XCircle } from 'lucide-react-native';
import client from '../api/client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';
import * as SecureStore from 'expo-secure-store';

const HOST = '192.168.1.101:8000'; // Update with your IP
const WS_BASE_URL = `ws://${HOST}/api/v1/orders`; 

// Updated Steps to include 'canceled'
const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', desc: 'We have received your order.', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', desc: 'The store is preparing your items.', icon: Check },
  { key: 'assigned', label: 'Driver Assigned', desc: 'A driver is on the way.', icon: Truck },
  { key: 'picked_up', label: 'Picked Up', desc: 'Driver has your order.', icon: ShoppingBag },
  { key: 'in_transit', label: 'In Transit', desc: 'Order is on the way to you.', icon: Truck },
  { key: 'delivered', label: 'Delivered', desc: 'Enjoy your order!', icon: MapPin },
  { key: 'canceled', label: 'Canceled', desc: 'This order was canceled.', icon: XCircle }, // Added for logic safety
];

type Props = NativeStackScreenProps<ProfileStackParamList, 'OrderDetails'>;

export default function OrderDetailsScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchOrderDetails(); }, []);

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
                } catch (err) { console.log("WS Parse Error", err); }
            };
        } catch (error) { console.error("WS Error:", error); }
    };
    connectWebSocket();
    return () => { if (ws) ws.close(); };
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const res = await client.get(`/orders/${orderId}`);
      setOrder(res.data);
    } catch (error) { console.error(error); } finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); fetchOrderDetails(); }, []);

  const contactStore = () => {
    if (!order?.store?.phone_number) return;
    Linking.openURL(`whatsapp://send?phone=${order.store.phone_number}`);
  };

  const handleCancelOrder = () => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await client.put(`/orders/${orderId}/cancel`);
              // ✅ CORRECT SPELLING: 'canceled'
              setOrder((prev: any) => ({ ...prev, status: 'canceled' }));
              alert("Order has been canceled.");
            } catch (err: any) {
              const msg = err.response?.data?.detail || "Could not cancel order";
              alert(msg);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading && !order) {
    return (
      <View className="flex-1 items-center justify-center bg-creme">
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }
  if (!order) return null;

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order.status);
  
  // ✅ CORRECT SPELLING CHECKS
  const isCanceled = order.status === 'canceled';
  const showMap = order.status !== 'delivered' && !isCanceled;

  return (
    <View className="flex-1 bg-creme">
      <StatusBar barStyle="dark-content" />
      
      <SafeAreaView edges={['top']} className="bg-white z-10 shadow-sm border-b border-gray-100">
        <View className="flex-row items-center p-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 bg-gray-50 p-2 rounded-full">
            <ArrowLeft color="#1A1A1A" size={20} />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-bold text-onyx font-serif">Order #{order.id}</Text>
            <Text className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
      >
        
        {/* --- MAP SECTION vs. BANNER --- */}
        {showMap ? (
            <View className="h-72 w-full bg-gray-200 relative">
              <MapView
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={{ width: '100%', height: '100%' }}
                initialRegion={{
                  latitude: order.store?.latitude || 33.5138,
                  longitude: order.store?.longitude || 36.2765,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker coordinate={{ latitude: order.store?.latitude || 0, longitude: order.store?.longitude || 0 }}>
                  <View className="bg-onyx p-2 rounded-full border-2 border-white shadow-sm">
                      <Store size={16} color="#D4AF37" />
                  </View>
                </Marker>
              </MapView>
              
              <View className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-xl shadow-lg flex-row justify-between items-center border border-gray-100">
                <View>
                    <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider">Estimated Arrival</Text>
                    <Text className="text-xl font-bold text-onyx font-serif">15-20 min</Text>
                </View>
                {order.store?.phone_number && (
                  <TouchableOpacity onPress={contactStore} className="bg-green-500 flex-row items-center px-4 py-2 rounded-full shadow-sm">
                    <Phone color="white" size={16} className="mr-2" />
                    <Text className="text-white font-bold text-xs">Chat</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
        ) : (
            // ✅ SUCCESS/CANCEL BANNER
            <View className="bg-white p-8 items-center justify-center border-b border-gray-100 mb-2">
                <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                    isCanceled ? 'bg-red-100' : 'bg-green-100'
                }`}>
                    {isCanceled ? <XCircle size={32} color="#EF4444" /> : <Check size={32} color="#22C55E" />}
                </View>
                <Text className="text-2xl font-serif font-bold text-onyx text-center">
                    {isCanceled ? 'Order Canceled' : 'Order Delivered'}
                </Text>
                <Text className="text-gray-500 text-center mt-2 max-w-[250px]">
                    {isCanceled 
                        ? 'This order was canceled.' 
                        : 'We hope you enjoy your purchase!'}
                </Text>

                {order.store?.phone_number && (
                   <TouchableOpacity onPress={contactStore} className="mt-6 flex-row items-center bg-gray-50 px-5 py-3 rounded-xl border border-gray-200">
                       <Phone size={18} color="#D4AF37" />
                       <Text className="text-onyx font-bold ml-2">Contact Store</Text>
                   </TouchableOpacity>
                )}
            </View>
        )}

        {/* --- TIMELINE SECTION --- */}
        <View className="bg-white mt-4 p-6 shadow-sm border-y border-gray-100">
           <Text className="text-lg font-bold text-onyx font-serif mb-6">Order Status</Text>
           <View className="ml-2">
                {STATUS_STEPS.map((step, index) => {
                  // Only show up to delivered in timeline, hide 'canceled' from vertical list if it's not canceled
                  if (step.key === 'canceled' && !isCanceled) return null;

                  const isActive = index <= currentStepIndex;
                  const isLast = index === STATUS_STEPS.length - 1 || (step.key === 'delivered' && !isCanceled);
                  
                  return (
                    <View key={step.key} className="flex-row">
                      <View className="items-center mr-4">
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
                        <Text className="text-base font-bold text-onyx">{step.label}</Text>
                        <Text className="text-xs text-gray-500 mt-0.5">{step.desc}</Text>
                      </View>
                    </View>
                  );
                })}
           </View>
        </View>

        {/* --- RECEIPT SECTION --- */}
        <View className="bg-white mt-4 p-6 shadow-sm border-y border-gray-100 pb-10">
           <Text className="text-lg font-bold text-onyx font-serif mb-4">Order Summary</Text>
           {order.items?.map((item: any, idx: number) => (
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
              <Text className="font-bold text-gray-900 text-lg">Total</Text>
              <Text className="font-bold text-gold-600 text-2xl font-mono">${order.total_price.toFixed(2)}</Text>
           </View>
        </View>

        {/* --- CANCEL BUTTON (Only if Pending or Confirmed) --- */}
        {['pending', 'confirmed'].includes(order.status) && (
          <View className="px-6 pb-10">
            <TouchableOpacity 
              onPress={handleCancelOrder}
              className="w-full py-4 border border-red-200 bg-red-50 rounded-xl items-center justify-center mt-6"
            >
              <Text className="text-red-600 font-bold uppercase tracking-wider">
                Cancel Order
              </Text>
            </TouchableOpacity>
            <Text className="text-center text-gray-400 text-xs mt-2">
              Note: You cannot cancel once a driver is assigned.
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}