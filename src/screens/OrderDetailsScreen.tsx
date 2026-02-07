import React, { useCallback, useEffect, useState } from 'react';
import { 
  View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, 
  StatusBar, Linking, Platform, Alert, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { 
  ArrowLeft, Check, MapPin, ShoppingBag, Store, Clock, Truck, 
  Phone, XCircle, Star 
} from 'lucide-react-native';
import client from '../api/client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';
import * as SecureStore from 'expo-secure-store';
import { useLanguage } from '../context/LanguageContext';
import Toast from 'react-native-toast-message';

// 👇 Import the Modal
import RateOrderModal from '../components/RateOrderModal';

const HOST = '192.168.1.101:8000'; 
const WS_BASE_URL = `ws://${HOST}/api/v1/orders`; 

const STATUS_STEP_KEYS = [
  { key: 'pending', labelKey: 'order_placed', descKey: 'order_placed_desc', icon: Clock },
  { key: 'confirmed', labelKey: 'confirmed', descKey: 'status_confirmed_desc', icon: Check },
  { key: 'assigned', labelKey: 'driver_assigned', descKey: 'driver_assigned_desc', icon: Truck },
  { key: 'picked_up', labelKey: 'picked_up', descKey: 'picked_up_desc', icon: ShoppingBag },
  { key: 'in_transit', labelKey: 'in_transit', descKey: 'in_transit_desc', icon: Truck },
  { key: 'delivered', labelKey: 'delivered', descKey: 'delivered_desc', icon: MapPin },
  { key: 'canceled', labelKey: 'canceled', descKey: 'canceled_desc', icon: XCircle },
];

type Props = NativeStackScreenProps<ProfileStackParamList, 'OrderDetails'>;

export default function OrderDetailsScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const { t, isRTL } = useLanguage();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 👇 Rating State
  const [isRateVisible, setRateVisible] = useState(false);
  const [hasRated, setHasRated] = useState(false); 

  useEffect(() => { fetchOrderDetails(); }, []);

  // ... (WebSocket Logic kept exactly as is) ...
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
      // Optional: If your backend returns "is_reviewed", setHasRated(res.data.is_reviewed) here
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); fetchOrderDetails(); }, []);

  const contactStore = () => {
    if (!order?.store?.phone_number) return;
    Linking.openURL(`whatsapp://send?phone=${order.store.phone_number}`);
  };

  const handleCancelOrder = () => {
    Alert.alert(
      t('cancel_order'),
      t('confirm_cancel_order'),
      [
        { text: t('no'), style: "cancel" },
        { 
          text: t('yes_cancel'), 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await client.put(`/orders/${orderId}/cancel`);
              setOrder((prev: any) => ({ ...prev, status: 'canceled' }));
              Toast.show({ type: 'success', text1: t('order_canceled_title') });
            } catch (err: any) {
              const msg = err.response?.data?.detail || t('could_not_cancel');
              Toast.show({ type: 'error', text1: msg });
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // 👇 Submit Review Handler
  const handleSubmitReview = async (rating: number, comment: string) => {
    try {
      // Assuming you added submitReview to client.ts
      await client.submitReview(order.store.id, order.id, rating, comment);
      setHasRated(true);
      Toast.show({ type: 'success', text1: t('review_submitted'), text2: t('thank_you') });
    } catch (err: any) {
      const msg = err.response?.data?.detail || t('error');
      // If already reviewed, just update UI so they can't try again
      if (msg.includes('already reviewed')) setHasRated(true);
      Toast.show({ type: 'error', text1: msg });
    }
  };

  if (loading && !order) {
    return (
      <View className="flex-1 items-center justify-center bg-creme">
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }
  if (!order) return null;

  const currentStepIndex = STATUS_STEP_KEYS.findIndex(s => s.key === order.status);
  const isCanceled = order.status === 'canceled';
  const showMap = order.status !== 'delivered' && !isCanceled;

  return (
    <View className="flex-1 bg-creme">
      <StatusBar barStyle="dark-content" />
      
      <SafeAreaView edges={['top']} className="bg-white z-10 shadow-sm border-b border-gray-100">
        <View className="flex-row items-center p-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="me-4 bg-gray-50 p-2 rounded-full">
            <ArrowLeft color="#1A1A1A" size={20} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-bold text-onyx font-serif">Order #{order.id}</Text>
            <Text className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 120 }} // Increased padding for bottom button
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
                {/* ... Marker ... */}
                <Marker coordinate={{ latitude: order.store?.latitude || 0, longitude: order.store?.longitude || 0 }}>
                  <View className="bg-onyx p-2 rounded-full border-2 border-white shadow-sm">
                      <Store size={16} color="#D4AF37" />
                  </View>
                </Marker>
              </MapView>
              
              <View className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-xl shadow-lg flex-row justify-between items-center border border-gray-100">
                <View>
                    <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t('estimated_arrival')}</Text>
                    <Text className="text-xl font-bold text-onyx font-serif">{t('arrival_estimate')}</Text>
                </View>
                {order.store?.phone_number && (
                  <TouchableOpacity onPress={contactStore} className="bg-green-500 flex-row items-center px-4 py-2 rounded-full shadow-sm">
                    <Phone color="white" size={16} className="me-2" />
                    <Text className="text-white font-bold text-xs">{t('chat')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
        ) : (
            <View className="bg-white p-8 items-center justify-center border-b border-gray-100 mb-2">
                <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isCanceled ? 'bg-red-100' : 'bg-green-100'}`}>
                    {isCanceled ? <XCircle size={32} color="#EF4444" /> : <Check size={32} color="#22C55E" />}
                </View>
                <Text className="text-2xl font-serif font-bold text-onyx text-center">
                    {isCanceled ? t('order_canceled_title') : t('order_delivered_title')}
                </Text>
                <Text className="text-gray-500 text-center mt-2 max-w-[250px]">
                    {isCanceled ? t('canceled_desc') : t('enjoy_purchase')}
                </Text>
            </View>
        )}

        {/* --- TIMELINE SECTION --- */}
        <View className="bg-white mt-4 p-6 shadow-sm border-y border-gray-100">
           {/* ... (Timeline code same as before) ... */}
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

        {/* --- RECEIPT SECTION --- */}
        <View className="bg-white mt-4 p-6 shadow-sm border-y border-gray-100 pb-10">
           {/* ... (Receipt code same as before) ... */}
           <Text className="text-lg font-bold text-onyx font-serif mb-4">{t('order_summary')}</Text>
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
              <Text className="font-bold text-gray-900 text-lg">{t('total')}</Text>
              <Text className="font-bold text-gold-600 text-2xl font-mono">${order.total_price.toFixed(2)}</Text>
           </View>
        </View>

        {/* --- ACTIONS: CANCEL --- */}
        {['pending', 'confirmed'].includes(order.status) && (
          <View className="px-6 pb-10">
            <TouchableOpacity 
              onPress={handleCancelOrder}
              className="w-full py-4 border border-red-200 bg-red-50 rounded-xl items-center justify-center mt-6"
            >
              <Text className="text-red-600 font-bold uppercase tracking-wider">
                {t('cancel_order')}
              </Text>
            </TouchableOpacity>
            <Text className="text-center text-gray-400 text-xs mt-2">
              {t('cancel_disclaimer')}
            </Text>
          </View>
        )}
        
        {/* 👇 NEW ACTIONS: RATE ORDER (Only if delivered & not rated) */}
        {order.status === 'delivered' && !hasRated && (
           <View className="px-6 pb-10">
              <TouchableOpacity 
                onPress={() => setRateVisible(true)}
                className="w-full bg-onyx py-4 rounded-xl items-center shadow-lg shadow-black/20 flex-row justify-center mt-6"
              >
                <Star size={16} color="#D4AF37" fill="#D4AF37" className="mr-2" />
                <Text className="text-gold-400 font-bold uppercase tracking-wider ml-2">
                   {t('rate_your_order')}
                </Text>
              </TouchableOpacity>
           </View>
        )}

      </ScrollView>

      {/* 👇 RATE MODAL */}
      <RateOrderModal 
        visible={isRateVisible}
        onClose={() => setRateVisible(false)}
        onSubmit={handleSubmitReview}
        storeName={order.store?.name || ''}
      />
      
    </View>
  );
}