import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, CheckCircle, Plus, Wallet, QrCode, FileText } from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import Toast from 'react-native-toast-message';

type Props = NativeStackScreenProps<HomeStackParamList, 'Checkout'>;

interface Address {
  id: number;
  label: string;
  address_line: string;
  is_default: boolean;
}

export default function CheckoutScreen({ navigation }: Props) {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<Address | null>(null);
  const [fetchingAddress, setFetchingAddress] = useState(true);

  // New State for "Syria Context" features
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [note, setNote] = useState('');

  // 1. Fetch Default Address on Load
  useEffect(() => {
    fetchDefaultAddress();
  }, []);

  const fetchDefaultAddress = async () => {
    try {
      setFetchingAddress(true);
      const res = await client.get('/addresses/default');
      setAddress(res.data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error("Failed to fetch default address", error);
      }
      setAddress(null);
    } finally {
      setFetchingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert("Login Required", "Please login to checkout", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    if (!address) {
      Toast.show({ type: 'error', text1: 'Address Missing', text2: 'Please add a shipping address.' });
      return;
    }

    setLoading(true);
    try {
      // 1. Construct Payload
      const itemsPayload = items.map(i => ({
        product_id: i.id,
        quantity: i.quantity
      }));

      // 2. Send API Request
      const res = await client.post('/orders/', {
        delivery_address: address.address_line,
        items: itemsPayload,
        // 👇 New Fields
        payment_method: paymentMethod, 
        note: note,
        // store_id is handled by backend grouping logic usually, but passing it doesn't hurt if schema allows
        store_id: items[0]?.store_id 
      });

      // 3. Success Handling
      Toast.show({ type: 'success', text1: 'Order Confirmed', text2: 'Thank you for your purchase.' });
      
      // Clear Cart Logic
      clearCart();

      // 4. Navigate to Order Details
      // IMPORTANT: The backend returns a LIST of orders (because of store grouping).
      // We grab the first one [0] to show details.
      const newOrderId = Array.isArray(res.data) ? res.data[0].id : res.data.id;
      
      navigation.replace('OrderDetails', { orderId: newOrderId });

    } catch (err: any) {
      console.error("Checkout Error:", err);
      const msg = err.response?.data?.detail || "Checkout failed";
      Toast.show({ type: 'error', text1: 'Order Failed', text2: msg });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-onyx/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-onyx/5 rounded-full mr-4">
          <ArrowLeft color="#0F0F0F" size={20} />
        </TouchableOpacity>
        <Text className="text-xl text-onyx font-serif">Confirm Order</Text>
      </View>

      <ScrollView className="flex-1 p-6">
        
        {/* --- 1. ADDRESS SECTION --- */}
        <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Shipping To</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'ProfileTab' })}> 
                 <Text className="text-gold-600 text-xs font-bold">Change</Text>
            </TouchableOpacity>
        </View>

        {fetchingAddress ? (
            <ActivityIndicator size="small" color="#D4AF37" className="mb-6" />
        ) : address ? (
            <View className="bg-white p-4 rounded-xl flex-row items-center shadow-sm mb-6 border border-gray-100">
            <View className="bg-gray-50 p-3 rounded-lg mr-4">
                <MapPin color="#0F0F0F" size={24} />
            </View>
            <View className="flex-1">
                <Text className="text-onyx font-bold text-base">{address.label}</Text>
                <Text className="text-gray-500 text-sm" numberOfLines={2}>{address.address_line}</Text>
            </View>
            </View>
        ) : (
            <TouchableOpacity 
                onPress={() => navigation.navigate('MainTabs', { screen: 'ProfileTab' })}
                className="bg-white p-4 rounded-xl flex-row items-center justify-center shadow-sm mb-6 border-2 border-dashed border-gray-300"
            >
                <Plus color="#9CA3AF" size={20} className="mr-2" />
                <Text className="text-gray-400 font-bold">Add Address</Text>
            </TouchableOpacity>
        )}

        {/* --- 2. PAYMENT METHOD SELECTOR --- */}
        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Payment Method</Text>
        <View className="flex-row gap-2 mb-6">
            {/* Cash */}
            <TouchableOpacity 
                onPress={() => setPaymentMethod('cash')}
                className={`flex-1 p-4 rounded-xl border-2 flex-col items-center justify-center ${
                    paymentMethod === 'cash' ? 'bg-white border-gold-500' : 'bg-white border-gray-100'
                }`}
            >
                <Wallet size={24} color={paymentMethod === 'cash' ? '#D4AF37' : '#9CA3AF'} />
                <Text className={`font-bold mt-2 ${paymentMethod === 'cash' ? 'text-onyx' : 'text-gray-400'}`}>Cash</Text>
            </TouchableOpacity>

            {/* Transfer */}
            <TouchableOpacity 
                onPress={() => setPaymentMethod('transfer')}
                className={`flex-1 p-4 rounded-xl border-2 flex-col items-center justify-center ${
                    paymentMethod === 'transfer' ? 'bg-white border-gold-500' : 'bg-white border-gray-100'
                }`}
            >
                <QrCode size={24} color={paymentMethod === 'transfer' ? '#D4AF37' : '#9CA3AF'} />
                <Text className={`font-bold mt-2 ${paymentMethod === 'transfer' ? 'text-onyx' : 'text-gray-400'}`}>Transfer</Text>
            </TouchableOpacity>
        </View>

        {/* --- 3. DELIVERY NOTE --- */}
        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Delivery Instructions</Text>
        <View className="bg-white p-3 rounded-xl border border-gray-100 mb-6 flex-row items-start">
            <FileText size={20} color="#9CA3AF" style={{ marginTop: 2, marginRight: 8 }} />
            <TextInput 
                placeholder="e.g. Doorbell broken, call upon arrival..."
                multiline
                numberOfLines={2}
                value={note}
                onChangeText={setNote}
                className="flex-1 text-onyx text-sm leading-5"
                textAlignVertical="top"
            />
        </View>

        {/* --- 4. SUMMARY --- */}
        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Summary</Text>
        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-20">
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Subtotal</Text>
            <Text className="text-onyx">${totalPrice.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Delivery Fee</Text>
            <Text className="text-onyx">$2.00</Text> 
          </View>
          <View className="h-[1px] bg-gray-100 my-2" />
          <View className="flex-row justify-between items-center">
            <Text className="text-onyx font-bold text-lg">Total</Text>
            <Text className="text-gold-600 font-bold text-xl">${(totalPrice + 2).toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* --- FOOTER ACTION --- */}
      <View className="bg-white p-6 shadow-2xl border-t border-gray-100">
        <TouchableOpacity 
          onPress={handlePlaceOrder}
          disabled={loading || !address}
          className={`py-4 rounded-xl flex-row items-center justify-center shadow-lg ${
              !address ? 'bg-gray-300' : 'bg-onyx'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white font-bold text-lg mr-2 uppercase tracking-wider">
                {paymentMethod === 'cash' ? 'Place Order' : 'Proceed to Pay'}
              </Text>
              <CheckCircle color="white" size={20} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}