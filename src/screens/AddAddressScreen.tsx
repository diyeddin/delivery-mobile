import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';
import client from '../api/client';
import Toast from 'react-native-toast-message';

type Props = NativeStackScreenProps<ProfileStackParamList, 'AddAddress'>;

export default function AddAddressScreen({ navigation }: Props) {
  const [label, setLabel] = useState('Home');
  const [addressLine, setAddressLine] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!addressLine.trim()) {
      Toast.show({ type: 'error', text1: 'Address Required', text2: 'Please enter a valid address.' });
      return;
    }

    setLoading(true);
    try {
      await client.post('/addresses/', {
        label,
        address_line: addressLine,
        instructions,
        is_default: isDefault,
        // latitude/longitude can be added here if you integrate Google Maps later
      });
      
      Toast.show({ type: 'success', text1: 'Address Saved' });
      navigation.goBack(); // Return to list
      
    } catch (error: any) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Failed to save', text2: 'Please try again.' });
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
        <Text className="text-xl text-onyx font-serif">Add New Address</Text>
      </View>

      <ScrollView className="p-6">
        
        {/* Label Field */}
        <View className="mb-6">
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Label</Text>
          <View className="flex-row gap-3">
            {['Home', 'Work', 'Other'].map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => setLabel(tag)}
                className={`px-4 py-2 rounded-full border ${
                  label === tag ? 'bg-onyx border-onyx' : 'bg-white border-gray-200'
                }`}
              >
                <Text className={label === tag ? 'text-white font-bold' : 'text-gray-500'}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Address Input */}
        <View className="mb-6">
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Full Address</Text>
          <TextInput
            className="bg-white p-4 rounded-xl border border-gray-100 text-onyx h-24 text-base"
            placeholder="Street, Building, City..."
            multiline
            textAlignVertical="top"
            value={addressLine}
            onChangeText={setAddressLine}
          />
        </View>

        {/* Instructions Input */}
        <View className="mb-6">
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Delivery Instructions (Optional)</Text>
          <TextInput
            className="bg-white p-4 rounded-xl border border-gray-100 text-onyx text-base"
            placeholder="e.g. Leave at front desk"
            value={instructions}
            onChangeText={setInstructions}
          />
        </View>

        {/* Default Switch */}
        <View className="flex-row items-center justify-between bg-white p-4 rounded-xl border border-gray-100 mb-8">
          <Text className="text-onyx font-bold text-base">Set as Default Address</Text>
          <Switch
            trackColor={{ false: "#E5E7EB", true: "#D4AF37" }}
            thumbColor={isDefault ? "#FFFFFF" : "#f4f3f4"}
            onValueChange={setIsDefault}
            value={isDefault}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          className="bg-onyx py-4 rounded-xl flex-row items-center justify-center shadow-lg"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Save color="white" size={20} className="mr-2" />
              <Text className="text-white font-bold text-lg">Save Address</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}