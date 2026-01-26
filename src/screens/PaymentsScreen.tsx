import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, CreditCard } from 'lucide-react-native';

export default function PaymentsScreen({ navigation }: any) {
  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      <View className="px-6 py-4 flex-row items-center border-b border-onyx/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-onyx/5 rounded-full mr-4">
          <ArrowLeft color="#0F0F0F" size={20} />
        </TouchableOpacity>
        <Text className="text-xl text-onyx font-serif">Payment Methods</Text>
      </View>

      <View className="p-6">
        {/* Mock Card */}
        <View className="bg-onyx h-48 rounded-2xl p-6 justify-between shadow-xl mb-6 relative overflow-hidden">
          {/* Gold Decor */}
          <View className="absolute -right-10 -top-10 w-40 h-40 bg-gold-500/20 rounded-full blur-2xl" />
          
          <View className="flex-row justify-between items-start">
            <CreditCard color="#D4AF37" size={32} />
            <Text className="text-white/50 text-xs tracking-widest uppercase">Platinum</Text>
          </View>

          <View>
            <Text className="text-white text-xl tracking-[4px] font-medium mb-2">**** **** **** 4242</Text>
            <View className="flex-row justify-between">
              <Text className="text-gray-400 text-xs">Card Holder</Text>
              <Text className="text-gray-400 text-xs">Expires</Text>
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-white font-bold uppercase text-sm">John Doe</Text>
              <Text className="text-white font-bold text-sm">12/28</Text>
            </View>
          </View>
        </View>

        {/* Add Button */}
        <TouchableOpacity 
          className="bg-white border-2 border-dashed border-gray-300 p-4 rounded-xl flex-row items-center justify-center"
          onPress={() => alert("Payment integration coming soon!")}
        >
          <Plus size={20} color="#9CA3AF" />
          <Text className="text-gray-500 font-bold ml-2">Add New Card</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}