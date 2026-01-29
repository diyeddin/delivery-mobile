import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, RefreshControl 
} from 'react-native';
import client from '../api/client';
import ProductCard from '../components/ProductCard';
import DashboardHeader from '../components/DashboardHeader'; // <--- NEW IMPORT
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useCart } from '../context/CartContext';

// --- MOCK CATEGORIES ---
const CATEGORIES = [
  { id: 'All', label: 'All Items' },
  { id: 'Clothing', label: 'Fashion' },
  { id: 'Electronics', label: 'Tech' },
  { id: 'Food', label: 'Food' },
  { id: 'Home', label: 'Home' },
];

interface Product {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  description?: string;
}

export default function MarketplaceScreen({ navigation }: { navigation: any }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // --- ADDRESS STATE ---
  const [addressLabel, setAddressLabel] = useState<string>("Deliver to");
  const [addressLine, setAddressLine] = useState<string>("Select Location");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const { addToCart } = useCart();
  

  const fetchData = async () => {
    try {
      // 1. Fetch Default Address
      try {
        const addrRes = await client.get('/addresses/default');
        if (addrRes.data) {
          setAddressLabel(addrRes.data.label || "Deliver to");
          const fullAddress = addrRes.data.address_line;
          setAddressLine(fullAddress.length > 25 ? fullAddress.substring(0, 25) + '...' : fullAddress);
        }
      } catch (addrErr: any) {
        if (addrErr.response?.status !== 404) console.error("Address fetch error:", addrErr);
      }

      // 2. Fetch Products
      const res = await client.get('/products/'); 
      setProducts(res.data);
      setFilteredProducts(res.data);
    } catch (error) {
      console.error("Failed to fetch marketplace data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FILTERING LOGIC ---
  useEffect(() => {
    let result = products;

    if (activeCategory !== 'All') {
      result = result.filter(p => 
        p.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    if (searchText) {
      const lowerText = searchText.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lowerText)
      );
    }

    setFilteredProducts(result);
  }, [searchText, activeCategory, products]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const handleAddToCart = (item: Product) => {
    console.log("Adding to cart:", item.name);
  };

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
          
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
          }

          ListHeaderComponent={
            // --- NEW SHARED HEADER ---
            <DashboardHeader 
              subtitle="Browse"
              title="Marketplace"
              addressLabel={addressLabel}
              addressLine={addressLine}
              onAddressPress={() => navigation.navigate('Addresses')}
              
              searchText={searchText}
              onSearchChange={setSearchText}
              searchPlaceholder="Search products..."
              
              categories={CATEGORIES}
              activeCategory={activeCategory}
              onCategoryPress={setActiveCategory}
            />
          }

          renderItem={({ item }) => (
            <View style={{ width: "48%" }}>
              <ProductCard 
                name={item.name}
                price={item.price}
                image_url={item.image_url}
                category={item.category ?? ''}
                onPress={() => navigation.navigate('ProductDetails', {
                  productId: item.id,
                  name: item.name,
                  price: item.price,
                  description: item.description ?? '',
                  category: item.category ?? '',
                  image_url: item.image_url
                })}
                onAddToCart={() => {
                  addToCart({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    image_url: item.image_url
                  });
                  Toast.show({
                    type: 'success',
                    text1: 'Added to Bag',
                    text2: `${item.name} has been added to your cart.`,
                    visibilityTime: 3000,
                  });
                }}
                
              />
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center mt-20">
               <Text className="text-gray-400">No products found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}