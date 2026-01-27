import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, CreditCard, CheckCircle, Plus } from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native'; // Keep data fresh

type Props = NativeStackScreenProps<HomeStackParamList, 'Checkout'>;

// Define Address Type
interface Address {
  id: number;
  label: string;
  address_line: string;
  is_default: boolean;
}

export default function CheckoutScreen({ navigation }: Props) {
  const { items, totalPrice, count, clearCart } = useCart();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<Address | null>(null);
  const [fetchingAddress, setFetchingAddress] = useState(true);

  // 1. Fetch Default Address on Load (and when returning to screen)
  useFocusEffect(
    useCallback(() => {
      fetchDefaultAddress();
    }, [])
  );

  const fetchDefaultAddress = async () => {
    try {
      setFetchingAddress(true);
      const res = await client.get('/addresses/default');
      setAddress(res.data);
    } catch (error: any) {
      // If 404, it just means no default set. 
      if (error.response?.status !== 404) {
        console.error("Failed to fetch default address", error);
      }
      setAddress(null);
    } finally {
      setFetchingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    // 1. Auth Check
    if (!user) {
      Alert.alert("Login Required", "Please login to checkout", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    // 2. Address Check
    if (!address) {
      Toast.show({
        type: 'error',
        text1: 'Address Missing',
        text2: 'Please add a shipping address first.',
      });
      // Optional: Navigate them to Add Address screen
      // navigation.navigate('AddAddress'); 
      return;
    }

    setLoading(true);
    try {
      const itemsPayload = items.map(i => ({
        product_id: i.id,
        quantity: i.quantity
      }));

      // 3. Send API Request with REAL Address
      await client.post('/orders/', {
        delivery_address: address.address_line, // <--- Using the fetched address
        items: itemsPayload
      });

      // 4. Success Handling
      Toast.show({
        type: 'success',
        text1: 'Order Confirmed',
        text2: 'Thank you for your purchase.',
        visibilityTime: 4000,
      });

      // Navigate to Orders Tab
      navigation.navigate('MainTabs', { screen: "ProfileTab" });

      setTimeout(() => {
        clearCart();
      }, 500);

    } catch (err: any) {
      console.error("Checkout Error:", err);
      const msg = err.response?.data?.detail || "Checkout failed";
      
      Toast.show({
        type: 'error',
        text1: 'Order Failed',
        text2: msg,
      });
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
        {/* Shipping Address Section */}
        <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Shipping To</Text>
            {/* Link to change address if needed */}
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'ProfileTab' })}> 
                 <Text className="text-gold text-xs font-bold">Change</Text>
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
            // Fallback UI if no address exists
            <TouchableOpacity 
                // Assuming you have an 'AddAddress' route, or direct them to Profile -> Addresses
                onPress={() => navigation.navigate('MainTabs', { screen: 'ProfileTab' })}
                className="bg-white p-4 rounded-xl flex-row items-center justify-center shadow-sm mb-6 border border-dashed border-gray-300"
            >
                <Plus color="#9CA3AF" size={20} className="mr-2" />
                <Text className="text-gray-400 font-bold">Add Delivery Address</Text>
            </TouchableOpacity>
        )}

        {/* Payment Method */}
        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Payment Method</Text>
        <View className="bg-white p-4 rounded-xl flex-row items-center shadow-sm mb-6 border border-gray-100">
          <View className="bg-gray-50 p-3 rounded-lg mr-4">
            <CreditCard color="#0F0F0F" size={24} />
          </View>
          <View>
            <Text className="text-onyx font-bold text-base">Credit Card</Text>
            <Text className="text-gray-500 text-sm">**** **** **** 4242</Text>
          </View>
        </View>

        {/* Order Summary */}
        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Summary</Text>
        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-20">
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Subtotal ({count} items)</Text>
            <Text className="text-onyx">${totalPrice.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Delivery Fee</Text>
            <Text className="text-onyx">$5.00</Text>
          </View>
          <View className="h-[1px] bg-gray-100 my-2" />
          <View className="flex-row justify-between">
            <Text className="text-onyx font-bold text-lg">Total</Text>
            <Text className="text-gold-600 font-bold text-lg">${(totalPrice + 5).toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View className="bg-white p-6 shadow-2xl border-t border-gray-100">
        <TouchableOpacity 
          onPress={handlePlaceOrder}
          disabled={loading || !address} // Disable if no address
          className={`py-4 rounded-xl flex-row items-center justify-center shadow-lg ${
              !address ? 'bg-gray-300' : 'bg-onyx'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white font-bold text-lg mr-2">Pay & Place Order</Text>
              <CheckCircle color="white" size={20} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}