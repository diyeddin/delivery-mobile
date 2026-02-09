import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Package, Clock, ChevronRight, Store } from 'lucide-react-native';
import { ordersApi } from '../api/orders';
import { useLanguage } from '../context/LanguageContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList, Order, OrderGroup } from '../types';
import { useFocusEffect } from '@react-navigation/native';
import { useAbortController } from '../hooks/useAbortController';
import { handleApiError } from '../utils/handleApiError';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Orders'>;


export default function OrdersScreen({ navigation }: Props) {
  const { t, isRTL, language } = useLanguage();
  const { getSignal } = useAbortController();
  const [orderGroups, setOrderGroups] = useState<OrderGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  // --- REFRESH FIX: Triggered every time you look at this screen ---
  useFocusEffect(
    useCallback(() => {
      // Force loading state so user sees update happening
      setLoading(true); 
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    const signal = getSignal();
    try {
      const data = await ordersApi.getMyOrders(signal);
      groupOrders(data);
    } catch (error: unknown) {
      handleApiError(error, { fallbackTitle: 'Failed to load orders', showToast: false });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const groupOrders = (flatOrders: Order[]) => {
    const groups: Record<string, OrderGroup> = {};

    flatOrders.forEach(order => {
      const key = order.group_id || `single-${order.id}`;
      if (!groups[key]) {
        groups[key] = {
          groupId: key,
          createdAt: order.created_at,
          totalPrice: 0,
          orders: [],
        };
      }
      groups[key].orders.push(order);
      groups[key].totalPrice += order.total_price;
    });

    const groupArray = Object.values(groups).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setOrderGroups(groupArray);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const formatDate = (dateString: string) => {
    const locale = language === 'ar' ? 'ar-u-nu-latn' : 'en-US';
    const date = new Date(dateString);
    return date.toLocaleDateString(locale) + ' ' + date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  const filteredGroups = orderGroups.filter(group => {
    // Check for "Active" status (Using 'canceled')
    const isGroupActive = group.orders.some(o => 
      !['completed', 'delivered', 'canceled', 'refunded', 'canceled'].includes(o.status.toLowerCase())
    );
    return activeTab === 'active' ? isGroupActive : !isGroupActive;
  });

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      <View className="px-6 py-4 flex-row items-center border-b border-onyx/5 bg-creme z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-onyx/5 rounded-full me-4">
          <ArrowLeft color="#0F0F0F" size={20} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>
        <Text className="text-xl text-onyx font-serif">{t('my_orders')}</Text>
      </View>

      <View className="flex-row p-4 mx-2">
        <TouchableOpacity onPress={() => setActiveTab('active')} className={`flex-1 py-3 rounded-xl items-center justify-center me-2 border ${activeTab === 'active' ? 'bg-onyx border-onyx' : 'bg-white border-gray-200'}`}>
          <Text className={`font-bold ${activeTab === 'active' ? 'text-white' : 'text-gray-400'}`}>{t('ongoing')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('past')} className={`flex-1 py-3 rounded-xl items-center justify-center ms-2 border ${activeTab === 'past' ? 'bg-onyx border-onyx' : 'bg-white border-gray-200'}`}>
          <Text className={`font-bold ${activeTab === 'past' ? 'text-white' : 'text-gray-400'}`}>{t('history')}</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#D4AF37" size="large" /></View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.groupId}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
          ListEmptyComponent={
            <View className="items-center mt-20 opacity-50">
              <Package size={64} color="#E5E7EB" />
              <Text className="text-gray-400 mt-4 font-serif text-lg">
                {activeTab === 'active' ? `${t('no')} ${t('ongoing')} ${t('orders').toLowerCase()}` : `${t('no')} ${t('history')} ${t('orders').toLowerCase()}`}
              </Text>
            </View>
          }
          renderItem={({ item: group }) => (
            <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
              <View className="flex-row justify-between items-start mb-3 border-b border-gray-100 pb-3">
                <View>
                  <Text className="font-bold text-onyx text-base">{t('order_bundle')}</Text>
                  <View className="flex-row items-center mt-1">
                    <Clock size={12} color="#9CA3AF" className="me-1" />
                    <Text className="text-gray-400 text-xs ms-1">{formatDate(group.createdAt)}</Text>
                  </View>
                </View>
                <Text className="text-onyx font-serif font-bold text-lg">${group.totalPrice.toFixed(2)}</Text>
              </View>

              {group.orders.map((subOrder, index) => (
                <TouchableOpacity 
                  key={subOrder.id}
                  onPress={() => navigation.navigate('OrderDetails', { orderId: subOrder.id })}
                  className={`flex-row justify-between items-center py-3 ${index !== group.orders.length -1 ? 'border-b border-gray-50' : ''}`}
                >
                  <View className="flex-row items-center flex-1">
                    <View className="w-8 h-8 bg-gray-50 rounded-full items-center justify-center me-3">
                      <Store size={14} color="#6B7280" />
                    </View>
                    <View>
                       <Text className="font-bold text-gray-800 text-sm">
                         {subOrder.store?.name || `${t('store_order')} #${subOrder.id}`}
                       </Text>
                       <View className={`self-start px-1.5 py-0.5 rounded mt-1 ${
                          subOrder.status === 'delivered' ? 'bg-green-100' : 
                          subOrder.status === 'canceled' ? 'bg-red-100' : 'bg-amber-100'
                       }`}>
                         <Text className={`text-[10px] font-bold capitalize ${
                            subOrder.status === 'delivered' ? 'text-green-700' : 
                            subOrder.status === 'canceled' ? 'text-red-700' : 'text-amber-800'
                         }`}>
                           {subOrder.status.replace('_', ' ')}
                         </Text>
                       </View>
                    </View>
                  </View>
                  <ChevronRight size={16} color="#D1D5DB" style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}