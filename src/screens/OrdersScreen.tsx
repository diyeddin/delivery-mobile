import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Package, Clock, ChevronRight, Store } from 'lucide-react-native';
import client from '../api/client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';
import { useFocusEffect } from '@react-navigation/native'; // <--- IMPORT THIS

type Props = NativeStackScreenProps<ProfileStackParamList, 'Orders'>;

interface Order {
  id: number;
  group_id?: string;
  created_at: string;
  total_price: number;
  status: string;
  store: { name: string; image_url?: string }; 
  items: any[];
}

interface OrderGroup {
  groupId: string;
  createdAt: string;
  totalPrice: number;
  orders: Order[];
}

export default function OrdersScreen({ navigation }: Props) {
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
    try {
      const res = await client.get('/orders/me/');
      groupOrders(res.data);
    } catch (error) {
      console.error("Failed to load orders", error);
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
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-onyx/5 rounded-full mr-4">
          <ArrowLeft color="#0F0F0F" size={20} />
        </TouchableOpacity>
        <Text className="text-xl text-onyx font-serif">My Orders</Text>
      </View>

      <View className="flex-row p-4 mx-2">
        <TouchableOpacity onPress={() => setActiveTab('active')} className={`flex-1 py-3 rounded-xl items-center justify-center mr-2 border ${activeTab === 'active' ? 'bg-onyx border-onyx' : 'bg-white border-gray-200'}`}>
          <Text className={`font-bold ${activeTab === 'active' ? 'text-white' : 'text-gray-400'}`}>Ongoing</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('past')} className={`flex-1 py-3 rounded-xl items-center justify-center ml-2 border ${activeTab === 'past' ? 'bg-onyx border-onyx' : 'bg-white border-gray-200'}`}>
          <Text className={`font-bold ${activeTab === 'past' ? 'text-white' : 'text-gray-400'}`}>History</Text>
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
              <Text className="text-gray-400 mt-4 font-serif text-lg">No {activeTab} orders found.</Text>
            </View>
          }
          renderItem={({ item: group }) => (
            <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
              <View className="flex-row justify-between items-start mb-3 border-b border-gray-100 pb-3">
                <View>
                  <Text className="font-bold text-onyx text-base">Order Bundle</Text>
                  <View className="flex-row items-center mt-1">
                    <Clock size={12} color="#9CA3AF" className="mr-1" />
                    <Text className="text-gray-400 text-xs">{formatDate(group.createdAt)}</Text>
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
                    <View className="w-8 h-8 bg-gray-50 rounded-full items-center justify-center mr-3">
                      <Store size={14} color="#6B7280" />
                    </View>
                    <View>
                       <Text className="font-bold text-gray-800 text-sm">
                         {subOrder.store?.name || `Store Order #${subOrder.id}`}
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
                  <ChevronRight size={16} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}