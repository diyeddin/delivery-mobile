import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Wallet, QrCode, CheckCircle, Info, Copy } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

export default function PaymentsScreen({ navigation }: any) {
  const [defaultMethod, setDefaultMethod] = useState<'cash' | 'transfer'>('cash');
  
  // Store's Transfer Number (You could fetch this from API later)
  const STORE_TRANSFER_NUMBER = "0999 123 456";

  useEffect(() => {
    loadDefault();
  }, []);

  const loadDefault = async () => {
    const saved = await SecureStore.getItemAsync('default_payment_method');
    if (saved === 'transfer') setDefaultMethod('transfer');
  };

  const handleSetDefault = async (method: 'cash' | 'transfer') => {
    setDefaultMethod(method);
    await SecureStore.setItemAsync('default_payment_method', method);
    Toast.show({
      type: 'success',
      text1: 'Preference Saved',
      text2: `Default payment set to ${method === 'cash' ? 'Cash' : 'Transfer'}`
    });
  };

  const copyToClipboard = () => {
    // Clipboard.setString(STORE_TRANSFER_NUMBER); // Requires react-native clipboard
    Toast.show({ type: 'info', text1: 'Copied', text2: 'Number copied to clipboard' });
  };

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-onyx/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-onyx/5 rounded-full me-4">
          <ArrowLeft color="#0F0F0F" size={20} />
        </TouchableOpacity>
        <Text className="text-xl text-onyx font-serif">Payment Methods</Text>
      </View>

      <ScrollView className="flex-1 p-6">
        
        <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
          Select Default Method
        </Text>

        {/* --- OPTION 1: CASH --- */}
        <TouchableOpacity 
          onPress={() => handleSetDefault('cash')}
          activeOpacity={0.9}
          className={`h-40 rounded-2xl p-6 justify-between shadow-sm mb-4 border-2 ${
            defaultMethod === 'cash' ? 'bg-onyx border-onyx' : 'bg-white border-gray-100'
          }`}
        >
          <View className="flex-row justify-between items-start">
            <View className={`p-3 rounded-full ${defaultMethod === 'cash' ? 'bg-white/10' : 'bg-gray-50'}`}>
                <Wallet color={defaultMethod === 'cash' ? '#D4AF37' : '#9CA3AF'} size={24} />
            </View>
            {defaultMethod === 'cash' && (
                <View className="bg-gold-500 px-3 py-1 rounded-full">
                    <Text className="text-onyx text-xs font-bold uppercase">Default</Text>
                </View>
            )}
          </View>
          
          <View>
            <Text className={`text-xl font-serif font-bold ${defaultMethod === 'cash' ? 'text-white' : 'text-onyx'}`}>
              Cash on Delivery
            </Text>
            <Text className={`text-sm mt-1 ${defaultMethod === 'cash' ? 'text-white/60' : 'text-gray-400'}`}>
              Pay simply when your order arrives.
            </Text>
          </View>
        </TouchableOpacity>

        {/* --- OPTION 2: TRANSFER --- */}
        <TouchableOpacity 
          onPress={() => handleSetDefault('transfer')}
          activeOpacity={0.9}
          className={`h-40 rounded-2xl p-6 justify-between shadow-sm mb-6 border-2 ${
            defaultMethod === 'transfer' ? 'bg-onyx border-onyx' : 'bg-white border-gray-100'
          }`}
        >
          <View className="flex-row justify-between items-start">
             <View className={`p-3 rounded-full ${defaultMethod === 'transfer' ? 'bg-white/10' : 'bg-gray-50'}`}>
                <QrCode color={defaultMethod === 'transfer' ? '#D4AF37' : '#9CA3AF'} size={24} />
            </View>
            {defaultMethod === 'transfer' && (
                <View className="bg-gold-500 px-3 py-1 rounded-full">
                    <Text className="text-onyx text-xs font-bold uppercase">Default</Text>
                </View>
            )}
          </View>

          <View>
            <Text className={`text-xl font-serif font-bold ${defaultMethod === 'transfer' ? 'text-white' : 'text-onyx'}`}>
              E-Transfer / QR
            </Text>
            <Text className={`text-sm mt-1 ${defaultMethod === 'transfer' ? 'text-white/60' : 'text-gray-400'}`}>
              Syriatel Cash, MTN Cash, or Bank Transfer.
            </Text>
          </View>
        </TouchableOpacity>

        {/* --- INFO SECTION --- */}
        <View className="bg-white p-5 rounded-xl border border-gray-100">
            <View className="flex-row items-center mb-3">
                <Info size={16} color="#D4AF37" />
                <Text className="text-onyx font-bold ms-2">Transfer Instructions</Text>
            </View>
            <Text className="text-gray-500 text-sm leading-5 mb-4">
                If you select Transfer, please send the total amount to our official number below and include the Transaction ID in your order notes.
            </Text>
            
            <View className="bg-gray-50 p-3 rounded-lg flex-row justify-between items-center border border-gray-200">
                <View>
                    <Text className="text-xs text-gray-400 uppercase font-bold">Official Number</Text>
                    <Text className="text-lg text-onyx font-mono font-bold">{STORE_TRANSFER_NUMBER}</Text>
                </View>
                <TouchableOpacity onPress={copyToClipboard} className="p-2">
                    <Copy size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}