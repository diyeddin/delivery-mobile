import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

export default function PrivacyScreen({ navigation }: any) {
  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      <View className="px-6 py-4 flex-row items-center border-b border-onyx/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-onyx/5 rounded-full me-4">
          <ArrowLeft color="#0F0F0F" size={20} />
        </TouchableOpacity>
        <Text className="text-xl text-onyx font-serif">Privacy & Security</Text>
      </View>
      <ScrollView className="p-6">
        <Text className="text-gray-600 leading-6">
          Your privacy is important to us. All personal data is encrypted and stored securely...
          {"\n\n"}
          (This is where your legal text goes.)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}