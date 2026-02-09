import React, { useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, FlatList,
  ScrollView, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, X, Clock, Search } from 'lucide-react-native';
import ProductGrid from '../components/ProductGrid';
import StoreGrid from '../components/StoreGrid';
import SearchSuggestionRow from '../components/SearchSuggestionRow';
import { useLanguage } from '../context/LanguageContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, Store, Product } from '../types';
import { useCart } from '../context/CartContext';
import Toast from 'react-native-toast-message';
import { useSearch } from '../hooks/useSearch';

type Props = NativeStackScreenProps<HomeStackParamList, 'Search'>;

export default function SearchScreen({ navigation, route }: Props) {
  const { type } = route.params;
  const { t, isRTL } = useLanguage();
  const { addToCart } = useCart();

  const {
    query, setQuery, mode, history, suggestions, results,
    loading, inputRef,
    loadHistory, clearHistory, performFullSearch,
    handleTextChange, handleClear,
  } = useSearch(type);

  useEffect(() => {
    loadHistory();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // --- RENDER CONTENT ---
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

    // MODE 2: SUGGESTIONS
    if (mode === 'suggestions') {
        return (
            <View className="flex-1">
                {suggestions.length === 0 ? (
                     <View className="pt-10 items-center">
                        <ActivityIndicator size="small" color="#D4AF37" />
                     </View>
                ) : (
                    <FlatList
                        data={suggestions}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                          <SearchSuggestionRow
                            item={item}
                            type={type}
                            isRTL={isRTL}
                            onPress={() => {
                              if (type === 'store') {
                                navigation.navigate('StoreDetails', { storeId: item.id, name: item.name });
                              } else {
                                const product = item as Product;
                                navigation.navigate('ProductDetails', {
                                  productId: product.id, name: product.name, price: product.price,
                                  image_url: product.image_url, description: product.description ?? '', category: product.category
                                });
                              }
                            }}
                            onFillSearch={() => {
                              setQuery(item.name);
                              performFullSearch(item.name);
                            }}
                          />
                        )}
                        keyboardShouldPersistTaps="handled"
                    />
                )}
            </View>
        );
    }

    // MODE 3: RESULTS
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
                  stores={results as Store[]}
                  isLoading={false}
                  onStorePress={(store) => navigation.navigate('StoreDetails', { storeId: store.id, name: store.name })}
                  contentContainerStyle={styles.storeResultsContainer}
                />
            );
        } else {
            return (
                <ProductGrid
                  products={results as Product[]}
                  isLoading={false}
                  contentContainerStyle={styles.productResultsContainer}
                  columnWrapperStyle={styles.productColumnWrapper}

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
          <ArrowLeft size={20} color="#1F2937" style={{ transform: [{ rotateY: isRTL ? '180deg' : '0deg' }] }} />
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

const styles = StyleSheet.create({
  storeResultsContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 50,
  },
  productResultsContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 50,
    backgroundColor: 'transparent',
  },
  productColumnWrapper: {
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
});
