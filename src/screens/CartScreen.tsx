import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { Trash2, ArrowRight, ShoppingBag, Minus, Plus } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export default function CartScreen({ navigation }: any) {
  const { items, addToCart, decreaseCount, totalPrice } = useCart();
  const { user } = useAuth();

  const handleCheckout = () => {
    if (!user) {
      // Logic: If Guest, force Login
      Alert.alert(
        "Sign In Required",
        "You need to log in to place an order.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Log In", 
            onPress: () => navigation.navigate('Login') 
          }
        ]
      );
      return;
    }
    // Logic: If User, go to Checkout
    navigation.navigate('Checkout'); 
    // Note: Since Checkout is in HomeStack, we might need to cross-navigate. 
    // Easier way: Add Checkout to root, or just verify navigation structure. 
    // Since Cart is a Tab and Checkout is in HomeStack, try:
    // navigation.navigate('HomeTab', { screen: 'Checkout' });
  };

  // 1. The Empty State (If cart has 0 items)
  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-creme items-center justify-center p-6">
        <View className="bg-onyx/5 p-6 rounded-full mb-6">
          <ShoppingBag size={48} color="#0F0F0F" />
        </View>
        <Text className="text-2xl font-serif text-onyx mb-2">Your bag is empty</Text>
        <Text className="text-gray-500 text-center">
          Looks like you haven't found your perfect match yet.
        </Text>
      </SafeAreaView>
    );
  }

  // 2. The Cart List
  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 border-b border-onyx/5">
          <Text className="text-3xl font-serif text-onyx">Shopping Bag</Text>
          <Text className="text-gray-500 text-sm mt-1">{items.length} Items</Text>
        </View>

        {/* List of Items */}
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 24 }}
          renderItem={({ item }) => (
            <View className="flex-row mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              {/* Image */}
              <Image 
                source={{ uri: item.image_url || 'https://via.placeholder.com/150' }} 
                className="w-20 h-20 rounded-lg bg-gray-50"
              />
              
              {/* Details */}
              <View className="flex-1 ml-4 justify-between">
                <View>
                  <Text className="text-onyx font-bold text-lg" numberOfLines={1}>{item.name}</Text>
                  <Text className="text-gray-500 text-xs">Qty: {item.quantity}</Text>
                </View>
                <Text className="text-gold-600 font-bold">${(item.price * item.quantity).toFixed(2)}</Text>
              </View>

              {/* Quantity Controls (Right Side) */}
              <View className="flex-column items-center bg-gray-50 rounded-lg border border-gray-200">
                {/* Increase Button (Reuse addToCart) */}
                <TouchableOpacity 
                  onPress={() => addToCart(item)}
                  className="p-2"
                >
                  <Plus size={12} color="#0F0F0F" />
                </TouchableOpacity>

                {/* Number */}
                <Text className="text-onyx font-bold px-2 min-w-[20px] text-center">
                  {item.quantity}
                </Text>

                {/* Decrease Button */}
                <TouchableOpacity 
                  onPress={() => decreaseCount(item.id)}
                  className="p-2"
                >
                  <Minus size={12} color="#0F0F0F" />
                </TouchableOpacity>

              </View>
            </View>
          )}
        />
      </View>

      {/* Checkout Footer */}
      <View className="bg-white p-6 shadow-2xl border-t border-gray-100">
        <View className="flex-row justify-between mb-4">
          <Text className="text-gray-500">Subtotal</Text>
          <Text className="text-onyx font-bold text-lg">${totalPrice.toFixed(2)}</Text>
        </View>

        <TouchableOpacity 
          className="bg-onyx py-4 rounded-xl flex-row items-center justify-center shadow-lg"
          activeOpacity={0.8}
          onPress={handleCheckout}
        >
          <Text className="text-white font-bold text-lg mr-2">Checkout</Text>
          <ArrowRight color="white" size={20} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}