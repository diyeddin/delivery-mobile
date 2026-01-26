import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, CreditCard, CheckCircle } from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import Toast from 'react-native-toast-message'; // <--- NEW IMPORT

type Props = NativeStackScreenProps<HomeStackParamList, 'Checkout'>;

export default function CheckoutScreen({ navigation }: Props) {
  const { items, totalPrice, count, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    // 1. Auth Check (Kept as Alert because we need the buttons)
    if (!user) {
      Alert.alert("Login Required", "Please login to checkout", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    setLoading(true);
    try {
      // 2. Prepare Payload
      const itemsPayload = items.map(i => ({
        product_id: i.id,
        quantity: i.quantity
      }));

      // 3. Send API Request
      await client.post('/orders/', {
        delivery_address: "Concierge Pickup", 
        items: itemsPayload
      });

      // 4. Success Handling (Now using Toast)
      
      // A. Show the notification
      Toast.show({
        type: 'success',
        text1: 'Order Confirmed',
        text2: 'Thank you for your purchase.',
        visibilityTime: 4000,
      });

      // B. Navigate immediately (Don't wait for user input)
      // navigation.goBack(); // Close Checkout first
      navigation.navigate('MainTabs', { screen: "ProfileTab" }); // Then go to Profile to see Orders
      // navigation.reset({
      //   index: 0,
      //   routes: [
      //     {
      //       name: 'MainTabs',
      //       params: { screen: 'Profile' } // Going to Profile (Orders) is better UX than empty Cart
      //     },
      //   ],
      // });

      // C. Clear Cart (Delayed slightly to prevent UI flicker during transition)
      setTimeout(() => {
        clearCart();
      }, 500);

    } catch (err: any) {
      console.error("Checkout Error:", err);
      const msg = err.response?.data?.detail || "Checkout failed";
      
      // 5. Error Handling (Now using Toast)
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
        {/* Shipping Address */}
        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Shipping To</Text>
        <View className="bg-white p-4 rounded-xl flex-row items-center shadow-sm mb-6 border border-gray-100">
          <View className="bg-gray-50 p-3 rounded-lg mr-4">
            <MapPin color="#0F0F0F" size={24} />
          </View>
          <View>
            <Text className="text-onyx font-bold text-base">{user?.name || user?.name}</Text>
            <Text className="text-gray-500 text-sm">Concierge Pickup</Text>
          </View>
        </View>

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
          disabled={loading}
          className="bg-onyx py-4 rounded-xl flex-row items-center justify-center shadow-lg"
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