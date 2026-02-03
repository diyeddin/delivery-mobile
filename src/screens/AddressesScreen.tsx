import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Plus, Trash2, Pencil } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList, Address } from '../types';
import client from '../api/client';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Addresses'>;

export default function AddressesScreen({ navigation }: Props) {
  const { t, isRTL } = useLanguage();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAddresses = async () => {
    try {
      const res = await client.get('/addresses/');
      setAddresses(res.data);
    } catch (error) {
      console.error("Failed to load addresses", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAddresses();
  };

  const handleDelete = (id: number) => {
    Alert.alert(t('delete_address'), t('are_you_sure'), [
      { text: t('cancel'), style: "cancel" },
      { 
        text: t('delete'), 
        style: "destructive", 
        onPress: async () => {
          try {
            await client.delete(`/addresses/${id}`);
            setAddresses(prev => prev.filter(a => a.id !== id));
            Toast.show({ type: 'success', text1: t('address_deleted') });
          } catch (err) {
            Toast.show({ type: 'error', text1: t('could_not_delete_address') });
          }
        }
      }
    ]);
  };

  const handleSetDefault = async (id: number) => {
    try {
      // Optimistic Update
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
      // Explicit Payload (ensure only ONE field is sent)
      const payload = { is_default: true };
      await client.patch(`/addresses/${id}`, payload);
      Toast.show({ type: 'success', text1: t('default_address_updated') });
    } catch (err) {
      Toast.show({ type: 'error', text1: t('failed_to_update') });
      fetchAddresses();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-onyx/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-onyx/5 rounded-full me-4">
          <ArrowLeft color="#0F0F0F" size={20} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>
        <Text className="text-xl text-onyx font-serif">{t('addresses')}</Text>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D4AF37" size="large" />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 24, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
          }
          ListEmptyComponent={
            <View className="items-center mt-20 opacity-50">
              <MapPin size={64} color="#E5E7EB" />
              <Text className="text-gray-400 mt-4 font-serif">{t('no_addresses')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => handleSetDefault(item.id)}
              className={`bg-white p-4 rounded-xl shadow-sm border mb-4 flex-row items-center ${
                item.is_default ? 'border-gold-500 bg-gold-50/10' : 'border-gray-100'
              }`}
            >
              {/* Icon */}
              <View className={`p-3 rounded-full me-4 ${item.is_default ? 'bg-gold-100' : 'bg-gray-50'}`}>
                <MapPin color={item.is_default ? '#D4AF37' : '#9CA3AF'} size={24} />
              </View>

              {/* Text Info */}
              <View className="flex-1 me-2">
                <View className="flex-row items-center">
                  <Text className="font-bold text-onyx text-base">{item.label}</Text>
                  {item.is_default && (
                    <Text className="ms-2 text-[10px] bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full font-bold">
                      {t('default').toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text className="text-gray-500 text-sm mt-1 leading-5" numberOfLines={2}>
                  {item.address_line}
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row items-center">
                
                {/* 1. NEW: Edit Button */}
                <TouchableOpacity 
                  onPress={() => navigation.navigate('AddAddress', { addressToEdit: item })}
                  className="p-2 me-1 bg-gray-50 rounded-lg"
                >
                  <Pencil size={18} color="#4B5563" />
                </TouchableOpacity>

                {/* 2. Delete Button */}
                <TouchableOpacity 
                  onPress={() => handleDelete(item.id)}
                  className="p-2 bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      
      {/* FAB */}
      <View className="absolute bottom-10 right-6">
        <TouchableOpacity 
          onPress={() => navigation.navigate('AddAddress')}
          className="bg-onyx w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-onyx/30"
        >
          <Plus color="white" size={24} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}