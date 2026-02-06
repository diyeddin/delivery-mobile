import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Keyboard, FlatList, Image, 
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, X, Clock, Search, ChevronRight, ArrowUpLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';
import ProductGrid from '../components/ProductGrid';
import StoreGrid from '../components/StoreGrid';
import { useLanguage } from '../context/LanguageContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { useCart } from '../context/CartContext'; 
import Toast from 'react-native-toast-message';

type Props = NativeStackScreenProps<HomeStackParamList, 'Search'>;

const HISTORY_KEY = 'search_history';

export default function SearchScreen({ navigation, route }: Props) {
  const { type } = route.params; 
  const { t } = useLanguage();
  const { addToCart } = useCart();
  
  // --- STATE ---
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'history' | 'suggestions' | 'results'>('history');
  
  const [history, setHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]); // List View Data
  const [results, setResults] = useState<any[]>([]);       // Grid View Data
  
  const [loading, setLoading] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // --- 1. SETUP ---
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
    const newHistory = [clean, ...history.filter(h => h !== clean)].slice(0, 10);
    setHistory(newHistory);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem(HISTORY_KEY);
  };

  // --- 2. FETCHING LOGIC ---
  
  // A. Suggestions (While typing)
  const fetchSuggestions = async (text: string) => {
    if (!text.trim()) return;
    try {
      const endpoint = type === 'store' ? '/stores/' : '/products/';
      // Limit to 6 items for suggestions, they are just previews
      const res = await client.get(endpoint, {
        params: { q: text, limit: 6 } 
      });
      setSuggestions(res.data);
    } catch (error) {
      console.error("Suggestion error:", error);
    }
  };

  // B. Full Results (On Enter)
  const performFullSearch = async (text: string) => {
    const term = text.trim();
    if (!term) return;

    Keyboard.dismiss();
    setMode('results'); // Switch to Grid View
    setLoading(true);
    saveToHistory(term);

    try {
      const endpoint = type === 'store' ? '/stores/' : '/products/';
      // Fetch more items for the grid
      const res = await client.get(endpoint, {
        params: { q: term, limit: 50 } 
      });
      setResults(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. INPUT HANDLERS ---
  const handleTextChange = (text: string) => {
    setQuery(text);

    // 1. If empty, show history
    if (text.length === 0) {
      setMode('history');
      setSuggestions([]);
      return;
    }

    // 2. If typing, switch to suggestions mode
    if (mode !== 'suggestions') setMode('suggestions');

    // 3. Debounce the suggestion fetch (300ms)
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
  };

  const handleClear = () => {
    setQuery('');
    setMode('history');
    setSuggestions([]);
    setResults([]);
    inputRef.current?.focus();
  };

  // --- 4. SUB-COMPONENTS ---

  // A. Suggestion Row (The "List" View)
  const renderSuggestionRow = ({ item }: { item: any }) => (
    <TouchableOpacity 
      className="flex-row items-center py-3 border-b border-gray-50 px-4 active:bg-gray-50"
      onPress={() => {
        // Clicking a suggestion goes straight to details
        if (type === 'store') {
            navigation.navigate('StoreDetails', { storeId: item.id, name: item.name });
        } else {
            navigation.navigate('ProductDetails', { 
                productId: item.id, name: item.name, price: item.price, 
                image_url: item.image_url, description: item.description, category: item.category 
            });
        }
      }}
    >
      {/* Thumbnail */}
      <View className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden border border-gray-100">
        {item.image_url ? (
           <Image source={{ uri: item.image_url }} className="w-full h-full" resizeMode="cover" />
        ) : (
           <View className="items-center justify-center flex-1">
             <Search size={14} color="#9CA3AF" />
           </View>
        )}
      </View>

      {/* Text Info */}
      <View className="flex-1 ms-3 justify-center">
         <Text className="text-sm text-onyx font-medium" numberOfLines={1}>{item.name}</Text>
         <Text className="text-xs text-gray-400" numberOfLines={1}>{item.category}</Text>
      </View>

      {/* Auto-fill Icon (Optional UX: Click arrow to fill text but not search yet) */}
      <TouchableOpacity 
        className="p-2"
        onPress={() => {
           setQuery(item.name);
           performFullSearch(item.name);
        }}
      >
         <ArrowUpLeft size={16} color="#D1D5DB" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // --- 5. RENDER CONTENT ---
  const renderContent = () => {
    // MODE 1: HISTORY
    if (mode === 'history') {
      return (
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
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
                  onPress={() => { setQuery(term); performFullSearch(term); }}
                  className="flex-row items-center py-3.5 border-b border-gray-100"
                >
                  <Clock size={16} color="#9CA3AF" />
                  <Text className="ms-3 text-onyx text-base font-medium">{term}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      );
    }

    // MODE 2: SUGGESTIONS (List View while typing)
    if (mode === 'suggestions') {
        return (
            <View className="flex-1">
                {suggestions.length === 0 ? (
                     // Loading skeleton or silent
                     <View className="pt-10 items-center">
                        <ActivityIndicator size="small" color="#D4AF37" />
                     </View>
                ) : (
                    <FlatList
                        data={suggestions}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderSuggestionRow}
                        keyboardShouldPersistTaps="handled"
                    />
                )}
            </View>
        );
    }

    // MODE 3: RESULTS (Grid View after Enter)
    if (mode === 'results') {
        if (loading) {
            return <View className="pt-20"><ActivityIndicator size="large" color="#D4AF37" /></View>;
        }

        if (results.length === 0) {
            return (
                <View className="flex-1 items-center justify-center pt-20 opacity-60">
                   <Search size={48} color="#D1D5DB" />
                   <Text className="text-gray-400 font-serif mt-4 text-lg">{t('no_results_found')}</Text>
                </View>
            );
        }

        if (type === 'store') {
            return (
                <StoreGrid 
                  stores={results} 
                  isLoading={false} 
                  onStorePress={(store) => navigation.navigate('StoreDetails', { storeId: store.id, name: store.name })}
                  contentContainerStyle={{ padding: 16, paddingTop: 16 }} 
                />
            );
        } else {
            return (
                <ProductGrid 
                  products={results} 
                  isLoading={false} 
                  contentContainerStyle={{ padding: 16, paddingTop: 16, backgroundColor: 'transparent' }} 
                  onProductPress={(item) => navigation.navigate('ProductDetails', { 
                    productId: item.id, name: item.name, price: item.price, 
                    image_url: item.image_url, description: item.description, category: item.category 
                  })}
                  onAddToCart={(item) => {
                    addToCart({ id: item.id, name: item.name, price: item.price, image_url: item.image_url });
                    Toast.show({ type: 'success', text1: t('added_to_bag'), text2: item.name });
                  }}
                />
            );
        }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F0]" edges={['top']}>
      {/* HEADER */}
      <View className="flex-row items-center px-4 py-2 border-b border-gray-200/50 bg-[#F5F5F0] gap-3 pb-4">
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm"
        >
          <ArrowLeft size={20} color="#1F2937" />
        </TouchableOpacity>
        
        <View className="flex-1 flex-row items-center bg-white rounded-xl px-4 py-2.5 shadow-sm border border-gray-100">
          <Search size={18} color="#D4AF37" />
          <TextInput
            ref={inputRef}
            className="flex-1 ms-3 text-base text-onyx p-0 font-medium"
            placeholder={type === 'store' ? t('search_stores') : t('search_products')}
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={handleTextChange}
            onSubmitEditing={() => performFullSearch(query)}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
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