import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl,
  StatusBar, Linking, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { ArrowLeft, Check, Store, Phone, XCircle, Star, Navigation, MapPin } from 'lucide-react-native';
import { ordersApi } from '../api/orders';
import { storesApi } from '../api/stores';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList, OrderDetail } from '../types';
import * as SecureStore from 'expo-secure-store';
import { useLanguage } from '../context/LanguageContext';
import Toast from 'react-native-toast-message';
import { useAbortController } from '../hooks/useAbortController';
import { useMountedRef } from '../hooks/useMountedRef';
import { handleApiError } from '../utils/handleApiError';
import { WS_HOST, WS_PROTOCOL } from '../api/client';

import RateOrderModal from '../components/RateOrderModal';
import OrderTimeline from '../components/OrderTimeline';
import OrderReceipt from '../components/OrderReceipt';

const WS_BASE_URL = `${WS_PROTOCOL}://${WS_HOST}/api/v1/orders`;

type Props = NativeStackScreenProps<ProfileStackParamList, 'OrderDetails'>;

export default function OrderDetailsScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const { t, isRTL, language } = useLanguage();
  const locale = language === 'ar' ? 'ar-u-nu-latn' : 'en-US';
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const [isRateVisible, setRateVisible] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const mapRef = useRef<MapView>(null);
  const { getSignal } = useAbortController();
  const mounted = useMountedRef();

  useEffect(() => { fetchOrderDetails(); }, []);

  // WebSocket with reconnection, heartbeat, and mounted guard
  useEffect(() => {
    // Don't maintain WS for terminal states
    if (order && (order.status === 'delivered' || order.status === 'canceled')) return;

    let ws: WebSocket | null = null;
    let cancelled = false;
    let reconnectAttempts = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let hasConnectedBefore = false;

    const connect = async () => {
      if (cancelled) return;

      try {
        const token = await SecureStore.getItemAsync('token');
        if (!token || cancelled) return;

        const url = `${WS_BASE_URL}/${orderId}/ws?token=${token}`;
        ws = new WebSocket(url);

        ws.onopen = () => {
          reconnectAttempts = 0;

          // Re-fetch order on reconnect to catch updates missed while disconnected
          if (hasConnectedBefore) {
            fetchOrderDetails();
          }
          hasConnectedBefore = true;

          // Heartbeat every 30s to keep connection alive through proxies
          heartbeatTimer = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 30000);
        };

        ws.onmessage = (e) => {
          if (!mounted.current) return;
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'status_update') {
              setOrder((prev) => prev ? ({ ...prev, status: data.status }) : prev);
            } else if (data.type === 'gps_update') {
              setDriverLocation({ latitude: data.latitude, longitude: data.longitude });
            }
          } catch (_err) { /* WS parse error - non-critical */ }
        };

        ws.onerror = () => {};

        ws.onclose = () => {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
          if (cancelled) return;

          // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s, up to 10 attempts
          if (reconnectAttempts < 10) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            reconnectAttempts++;
            reconnectTimer = setTimeout(connect, delay);
          }
        };
      } catch (_error) { /* WS connection error - non-critical */ }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      ws?.close();
    };
  }, [orderId, order?.status]);

  // Fit map to show all markers when driver location updates
  useEffect(() => {
    if (!mapRef.current || !driverLocation || !order) return;

    const storeCoords = order.store?.latitude && order.store?.longitude
      ? { latitude: order.store.latitude, longitude: order.store.longitude }
      : null;

    const deliveryCoords = order.delivery_latitude && order.delivery_longitude
      ? { latitude: order.delivery_latitude, longitude: order.delivery_longitude }
      : null;

    const coords = [driverLocation];
    if (storeCoords) coords.push(storeCoords);
    if (deliveryCoords) coords.push(deliveryCoords);

    if (coords.length > 1) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 60, right: 40, bottom: 200, left: 40 },
        animated: true,
      });
    }
  }, [driverLocation, order?.store?.latitude, order?.store?.longitude, order?.delivery_latitude, order?.delivery_longitude]);

  const fetchOrderDetails = async () => {
    try {
      const signal = getSignal();
      const data = await ordersApi.getOrderDetails(orderId, signal);
      setOrder(data);
      setHasRated(data.is_reviewed || false);
    } catch (error) {
      handleApiError(error, { fallbackTitle: 'Order Details', showToast: false });
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
              await ordersApi.cancelOrder(orderId);
              setOrder((prev) => prev ? ({ ...prev, status: 'canceled' }) : prev);
              Toast.show({ type: 'success', text1: t('order_canceled_title') });
            } catch (err: unknown) {
              handleApiError(err, { fallbackTitle: t('could_not_cancel') });
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
      await storesApi.submitReview(order!.store.id, order!.id, rating, comment);
      setHasRated(true);
      Toast.show({ type: 'success', text1: t('review_submitted'), text2: t('thank_you') });
    } catch (err: unknown) {
      const msg = handleApiError(err, { fallbackTitle: t('error'), showToast: false });
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

  const isCanceled = order.status === 'canceled';
  const showMap = order.status !== 'delivered' && !isCanceled;
  const isDriverTracking = ['assigned', 'picked_up', 'in_transit'].includes(order.status);

  const storeCoords = order.store?.latitude && order.store?.longitude
    ? { latitude: order.store.latitude, longitude: order.store.longitude }
    : null;

  const deliveryCoords = order.delivery_latitude && order.delivery_longitude
    ? { latitude: order.delivery_latitude, longitude: order.delivery_longitude }
    : null;

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
            <Text className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString(locale)}</Text>
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
                ref={mapRef}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={{ width: '100%', height: '100%' }}
                initialRegion={{
                  latitude: order.store?.latitude || 33.5138,
                  longitude: order.store?.longitude || 36.2765,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
              >
                {/* Store Marker */}
                {storeCoords && (
                  <Marker coordinate={storeCoords}>
                    <View className="bg-onyx p-2 rounded-full border-2 border-white shadow-sm">
                      <Store size={16} color="#D4AF37" />
                    </View>
                  </Marker>
                )}

                {/* Delivery Address Marker */}
                {deliveryCoords && (
                  <Marker coordinate={deliveryCoords}>
                    <View className="bg-white p-2 rounded-full border-2 border-onyx shadow-sm">
                      <MapPin size={16} color="#0F0F0F" />
                    </View>
                  </Marker>
                )}

                {/* Driver Live Location Marker */}
                {isDriverTracking && driverLocation && (
                  <Marker coordinate={driverLocation}>
                    <View className="bg-gold-500 p-2 rounded-full border-2 border-white shadow-lg">
                      <Navigation size={16} color="#FFFFFF" />
                    </View>
                  </Marker>
                )}

                {/* Route Polyline: driver -> store -> delivery */}
                {isDriverTracking && driverLocation && (
                  <Polyline
                    coordinates={[
                      driverLocation,
                      ...(storeCoords ? [storeCoords] : []),
                      ...(deliveryCoords ? [deliveryCoords] : []),
                    ]}
                    strokeColor="#D4AF37"
                    strokeWidth={3}
                    lineDashPattern={[6, 3]}
                  />
                )}
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
        <OrderTimeline status={order.status} />

        {/* --- RECEIPT SECTION --- */}
        <OrderReceipt items={order.items} totalPrice={order.total_price} />

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