import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TextInput } from 'react-native';
import client from '../api/client';
import StoreCard from '../components/StoreCard';
import { Search } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define the navigation prop specifically for Home
type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

interface Store {
  id: number;
  name: string;
  description: string;
  category: string; // Ensure your backend sends this, or add a default
}

export default function HomeScreen({ navigation }: Props) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    try {
      // Update this endpoint to match your actual Backend Route!
      const res = await client.get('/stores/'); 
      setStores(res.data);
    } catch (error) {
      console.error("Failed to fetch stores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-creme pt-8" edges={['top', 'left', 'right']}>
      {/* Header Section */}
      <View className="px-6 mb-6">
        <Text className="text-gold-500 text-xs font-bold uppercase tracking-[4px] mb-2">
          Golden Rose
        </Text>
        <Text className="text-3xl text-onyx font-serif">
          Discover Luxury
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-6 mb-8">
        <View className="flex-row items-center bg-onyx/5 rounded-xl px-4 py-3 border border-white/5">
          <Search color="#9CA3AF" size={20} />
          <TextInput 
            placeholder="Search boutiques..." 
            placeholderTextColor="#6B7280"
            className="ml-3 flex-1 text-onyx"
          />
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <StoreCard 
              id={item.id}
              name={item.name}
              category={item.category || "Luxury"} // Fallback if backend doesn't send category
              onPress={() => navigation.navigate('StoreDetails', { 
                storeId: item.id,
                name: item.name 
              })}
            />
          )}
          ListEmptyComponent={
            <Text className="text-gray-500 text-center mt-10">No stores found.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}