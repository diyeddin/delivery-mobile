import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell } from 'lucide-react-native';

export default function NotificationsScreen({ navigation }: any) {
  const [isEnabled, setIsEnabled] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-onyx/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-onyx/5 rounded-full mr-4">
          <ArrowLeft color="#0F0F0F" size={20} />
        </TouchableOpacity>
        <Text className="text-xl text-onyx font-serif">Notifications</Text>
      </View>

      <View className="p-6">
        {/* Toggle Switch */}
        <View className="flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm mb-8">
          <View>
            <Text className="text-onyx font-bold text-base">Push Notifications</Text>
            <Text className="text-gray-500 text-xs">Receive updates about your orders</Text>
          </View>
          <Switch 
            trackColor={{ false: "#E5E7EB", true: "#D4AF37" }}
            thumbColor={isEnabled ? "#FFFFFF" : "#f4f3f4"}
            onValueChange={setIsEnabled}
            value={isEnabled}
          />
        </View>

        {/* Empty State */}
        <View className="items-center justify-center mt-10 opacity-50">
          <Bell size={64} color="#9CA3AF" />
          <Text className="text-gray-400 mt-4 text-center font-medium">No new notifications</Text>
          <Text className="text-gray-400 text-center text-xs px-10 mt-2">
            We will notify you when your order status changes.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}