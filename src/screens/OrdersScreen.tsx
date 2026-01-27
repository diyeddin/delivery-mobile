import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck, ChevronRight } from 'lucide-react-native';
import client from '../api/client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Orders'>;

interface Order {
  id: number;
  created_at: string;
  total_price: number;
  status: string;
}

export default function OrdersScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  // Fetch orders when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchOrders();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchOrders = async () => {
    try {
      const res = await client.get('/orders/me/');
      setOrders(res.data);
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredOrders = orders.filter(order => {
    const finishedStatuses = ['completed', 'delivered', 'canceled', 'refunded'];
    const status = order.status ? order.status.toLowerCase() : '';
    
    if (activeTab === 'active') {
      return !finishedStatuses.includes(status); 
    } else {
      return finishedStatuses.includes(status);
    }
  });

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-onyx/5 bg-creme z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-onyx/5 rounded-full mr-4">
          <ArrowLeft color="#0F0F0F" size={20} />
        </TouchableOpacity>
        <Text className="text-xl text-onyx font-serif">My Orders</Text>
      </View>

      {/* Tab Buttons */}
      <View className="flex-row p-4 mx-2">
        <TouchableOpacity 
          onPress={() => setActiveTab('active')}
          className={`flex-1 py-3 rounded-xl items-center justify-center mr-2 border ${
            activeTab === 'active' ? 'bg-onyx border-onyx' : 'bg-white border-gray-200'
          }`}
        >
          <Text className={`font-bold ${activeTab === 'active' ? 'text-white' : 'text-gray-400'}`}>
            Ongoing
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setActiveTab('past')}
          className={`flex-1 py-3 rounded-xl items-center justify-center ml-2 border ${
            activeTab === 'past' ? 'bg-onyx border-onyx' : 'bg-white border-gray-200'
          }`}
        >
          <Text className={`font-bold ${activeTab === 'past' ? 'text-white' : 'text-gray-400'}`}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4AF37" size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" colors={['#D4AF37']} />
          }
          ListEmptyComponent={
            <View className="items-center mt-20 opacity-50">
              <Package size={64} color="#E5E7EB" />
              <Text className="text-gray-400 mt-4 text-center font-serif text-lg">
                No {activeTab} orders found.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-4"
            >
              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <Text className="font-bold text-onyx text-lg">Order #{item.id}</Text>
                  <View className="flex-row items-center mt-1">
                    <Clock size={12} color="#9CA3AF" className="mr-1" />
                    <Text className="text-gray-400 text-xs">{formatDate(item.created_at)}</Text>
                  </View>
                </View>
                
                {/* Chevron indicating Clickability */}
                <ChevronRight size={20} color="#D1D5DB" />
              </View>

              <View className="flex-row justify-between items-center bg-gray-50 p-3 rounded-lg mb-3">
                <Text className="text-xs text-gray-500 font-medium uppercase tracking-wider">Status</Text>
                <View className={`px-2 py-1 rounded text-xs ${
                   item.status === 'completed' || item.status === 'delivered' ? 'bg-green-100' : 
                   item.status === 'canceled' ? 'bg-red-100' : 'bg-amber-100'
                }`}>
                   <Text className={`text-xs font-bold capitalize ${
                      item.status === 'completed' || item.status === 'delivered' ? 'text-green-700' : 
                      item.status === 'canceled' ? 'text-red-700' : 'text-amber-800'
                   }`}>
                     {item.status?.replace('_', ' ') || 'Processing'}
                   </Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-gray-400 text-xs uppercase font-bold tracking-widest">Total</Text>
                <Text className="text-onyx font-serif font-bold text-xl">
                  ${item.total_price?.toFixed(2) || "0.00"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}