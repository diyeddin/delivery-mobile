import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Keyboard 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, X, Clock, Search, Trash2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';
import ProductGrid from '../components/ProductGrid';
import StoreGrid from '../components/StoreGrid';
import { useLanguage } from '../context/LanguageContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { useCart } from '../context/CartContext'; // Import Cart Context
import Toast from 'react-native-toast-message';   // Import Toast

type Props = NativeStackScreenProps<HomeStackParamList, 'Search'>;

const HISTORY_KEY = 'search_history';

export default function SearchScreen({ navigation, route }: Props) {
  const { type } = route.params; 
  const { t, isRTL } = useLanguage();
  const { addToCart } = useCart(); // Hook up Add to Cart
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // 1. Load History & Focus
  useEffect(() => {
    loadHistory();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch (e) { console.error(e); }
  };

  const saveToHistory = async (text: string) => {
    if (!text.trim()) return;
    const clean = text.trim();
    // Keep unique, max 10 items
    const newHistory = [clean, ...history.filter(h => h !== clean)].slice(0, 10);
    setHistory(newHistory);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem(HISTORY_KEY);
  };

  // 2. Perform Search
  const handleSearch = async (text: string) => {
    const searchTerm = text || query;
    if (!searchTerm.trim()) return;

    Keyboard.dismiss();
    setLoading(true);
    setHasSearched(true);
    saveToHistory(searchTerm);

    try {
      const endpoint = type === 'store' ? '/stores/' : '/products/';
      const res = await client.get(endpoint, {
        params: { q: searchTerm, limit: 50 } 
      });
      setResults(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Render Content
  const renderContent = () => {
    // A. Loading
    if (loading) {
      return (
        <View className="flex-1 items-center justify-center pt-20">
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      );
    }

    // B. Show History (if not searched yet)
    if (!hasSearched && query.length === 0) {
      return (
        <View className="px-6 py-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {t('recent_searches')}
            </Text>
            {history.length > 0 && (
              <TouchableOpacity onPress={clearHistory} className="bg-red-50 px-2 py-1 rounded-md">
                <Text className="text-[10px] font-bold text-red-400">{t('clear')}</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {history.length === 0 ? (
             <Text className="text-gray-300 italic text-center mt-10">{t('no_recent_searches')}</Text>
          ) : (
             history.map((term, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => {
                  setQuery(term);
                  handleSearch(term);
                }}
                className="flex-row items-center py-3.5 border-b border-gray-100 active:bg-gray-50 -mx-2 px-2 rounded-lg"
              >
                <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                   <Clock size={14} color="#9CA3AF" />
                </View>
                <Text className="ms-3 text-onyx text-base font-medium">{term}</Text>
                <View className="flex-1 items-end">
                    <ArrowLeft size={14} color="#D1D5DB" style={{ transform: [{rotate: isRTL ? '225deg' : '-45deg'}]}} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      );
    }

    // C. No Results
    if (results.length === 0 && hasSearched) {
      return (
        <View className="flex-1 items-center justify-center pt-20 opacity-60">
           <Search size={48} color="#D1D5DB" />
           <Text className="text-gray-400 font-serif mt-4 text-lg">{t('no_results_found')}</Text>
           <Text className="text-gray-300 text-xs mt-1">{t('try_different_keyword')}</Text>
        </View>
      );
    }

    // D. Show Results
    if (type === 'store') {
      return (
        <StoreGrid 
          stores={results} 
          isLoading={false} 
          onStorePress={(store) => navigation.navigate('StoreDetails', { storeId: store.id, name: store.name })}
          // 👇 FIX: Padding + Transparent BG
          contentContainerStyle={{ padding: 16, paddingTop: 16 }} 
        />
      );
    } else {
      return (
        <ProductGrid 
          products={results} 
          isLoading={false} 
          // 👇 FIX: Padding + Transparent BG
          contentContainerStyle={{ padding: 16, paddingTop: 16, backgroundColor: 'transparent' }} 
          
          onProductPress={(item) => navigation.navigate('ProductDetails', { 
            productId: item.id, 
            name: item.name, 
            price: item.price, 
            image_url: item.image_url,
            description: item.description,
            category: item.category
          })}
          onAddToCart={(item) => {
            addToCart({ 
              id: item.id, 
              name: item.name, 
              price: item.price, 
              image_url: item.image_url 
            });
            Toast.show({ type: 'success', text1: t('added_to_bag'), text2: item.name });
          }}
        />
      );
    }
  };

  return (
    // 👇 FIX: Match App Background (#F5F5F0)
    <SafeAreaView className="flex-1 bg-[#F5F5F0]" edges={['top']}>
      
      {/* HEADER */}
      <View className="flex-row items-center px-4 py-2 border-b border-gray-200/50 bg-[#F5F5F0] gap-3 pb-4">
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm"
        >
          <ArrowLeft size={20} color="#1F2937" style={{ transform: [{rotate: isRTL ? '180deg' : '0deg'}]}} />
        </TouchableOpacity>
        
        <View className="flex-1 flex-row items-center bg-white rounded-xl px-4 py-2.5 shadow-sm border border-gray-100">
          <Search size={18} color="#D4AF37" />
          <TextInput
            ref={inputRef}
            className="flex-1 ms-3 text-base text-onyx p-0 font-medium"
            placeholder={type === 'store' ? t('search_stores') : t('search_products')}
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch(query)}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => {
              setQuery('');
              setHasSearched(false);
              setResults([]);
              inputRef.current?.focus();
            }}>
              <View className="bg-gray-100 rounded-full p-1">
                 <X size={12} color="#6B7280" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* BODY */}
      {renderContent()}
    </SafeAreaView>
  );
}