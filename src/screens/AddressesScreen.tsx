import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Plus } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Addresses'>;

export default function AddressesScreen({ navigation }: Props) {
  // Mock Data
  const addresses = [
    { id: 1, label: 'Concierge Pickup', details: 'Grand Mall, Main Lobby', isDefault: true },
    { id: 2, label: 'Office', details: 'Technopark Tower, Floor 4', isDefault: false },
  ];

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      <View className="px-6 py-4 flex-row items-center border-b border-onyx/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-onyx/5 rounded-full mr-4">
          <ArrowLeft color="#0F0F0F" size={20} />
        </TouchableOpacity>
        <Text className="text-xl text-onyx font-serif">Addresses</Text>
      </View>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 flex-row items-center">
            <View className="bg-gray-50 p-3 rounded-full mr-4">
              <MapPin color={item.isDefault ? '#D4AF37' : '#9CA3AF'} size={24} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="font-bold text-onyx text-base">{item.label}</Text>
                {item.isDefault && (
                  <Text className="ml-2 text-[10px] bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full font-bold">DEFAULT</Text>
                )}
              </View>
              <Text className="text-gray-500 text-sm mt-1">{item.details}</Text>
            </View>
          </View>
        )}
      />
      
      {/* Floating Add Button */}
      <View className="absolute bottom-10 right-6">
        <TouchableOpacity className="bg-onyx w-14 h-14 rounded-full items-center justify-center shadow-lg">
          <Plus color="white" size={24} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}