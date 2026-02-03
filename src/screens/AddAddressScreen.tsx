import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';
import client from '../api/client';
import Toast from 'react-native-toast-message';

type Props = NativeStackScreenProps<ProfileStackParamList, 'AddAddress'>;

export default function AddAddressScreen({ navigation, route }: Props) {
  // 1. Check for incoming address to edit
  const addressToEdit = route.params?.addressToEdit;
  const isEditing = !!addressToEdit;

  // 2. Initialize State (Pre-fill if editing, else defaults)
  const [label, setLabel] = useState(addressToEdit?.label || 'Home');
  const [addressLine, setAddressLine] = useState(addressToEdit?.address_line || '');
  const [instructions, setInstructions] = useState(addressToEdit?.instructions || '');
  const [isDefault, setIsDefault] = useState(addressToEdit?.is_default || false);
  
  const [loading, setLoading] = useState(false);
  const [customLabel, setCustomLabel] = useState(''); // Handle custom typing for label

  // Sync custom label if the initial label isn't one of the presets
  useEffect(() => {
    if (isEditing && !['Home', 'Work', 'Other'].includes(addressToEdit.label)) {
        setLabel('Other');
        setCustomLabel(addressToEdit.label);
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (!addressLine.trim()) {
      Toast.show({ type: 'error', text1: 'Address Required', text2: 'Please enter a valid address.' });
      return;
    }

    setLoading(true);
    try {
      // Determine final label (Preset vs Custom)
      const finalLabel = (label === 'Other' && customLabel.trim()) ? customLabel : label;

      const payload = {
        label: finalLabel,
        address_line: addressLine,
        instructions: instructions || null,
        is_default: isDefault,
      };

      if (isEditing) {
        // --- EDIT MODE (PATCH) ---
        await client.patch(`/addresses/${addressToEdit.id}`, payload);
        Toast.show({ type: 'success', text1: 'Address Updated' });
      } else {
        // --- CREATE MODE (POST) ---
        await client.post('/addresses/', payload);
        Toast.show({ type: 'success', text1: 'Address Saved' });
      }
      
      navigation.goBack(); 
      
    } catch (error: any) {
      console.error("Save Error:", error.response?.data || error);
      const msg = error.response?.data?.detail || "Failed to save address";
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-onyx/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-onyx/5 rounded-full me-4">
          <ArrowLeft color="#0F0F0F" size={20} />
        </TouchableOpacity>
        <Text className="text-xl text-onyx font-serif">
          {isEditing ? 'Edit Address' : 'Add New Address'}
        </Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <ScrollView className="p-6">
          
          {/* Label Field */}
          <View className="mb-6">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Label</Text>
            <View className="flex-row gap-3 mb-3">
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

            {/* Custom Label Input (Only shows if 'Other' is selected) */}
            {label === 'Other' && (
               <TextInput
                 className="bg-white p-4 rounded-xl border border-gray-200 text-onyx text-base"
                 placeholder="e.g. Girlfriend's House"
                 value={customLabel}
                 onChangeText={setCustomLabel}
               />
            )}
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
              className="bg-white p-4 rounded-xl border border-gray-100 text-onyx text-base h-20"
              placeholder="e.g. Leave at front desk"
              multiline
              textAlignVertical="top"
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
            className="bg-onyx py-4 rounded-xl flex-row items-center justify-center shadow-lg mb-10"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                {isEditing ? (
                    <CheckCircle color="white" size={20} className="mr-2" />
                ) : (
                    <Save color="white" size={20} className="mr-2" />
                )}
                <Text className="text-white font-bold text-lg">
                    {isEditing ? 'Update Address' : 'Save Address'}
                </Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}