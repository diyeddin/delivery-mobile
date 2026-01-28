import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, RefreshControl, Dimensions, 
  Image, TouchableOpacity, LayoutAnimation, Platform, UIManager 
} from 'react-native';
import client from '../api/client';
import StoreCard from '../components/StoreCard';
import DashboardHeader from '../components/DashboardHeader'; // <--- IMPORT
import { ShoppingBag, Truck, ChevronDown, ChevronRight } from 'lucide-react-native'; 
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// --- MOCK DATA ---
const PROMOS = [
  { id: 1, title: 'Summer Collection', subtitle: 'New Arrivals', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop' },
  { id: 2, title: 'Tech Week', subtitle: 'Up to 30% Off', image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=800&auto=format&fit=crop' },
  { id: 3, title: 'Food Court', subtitle: 'Free Delivery', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop' },
];

const CATEGORIES = [
  { id: 'All', label: 'All' },
  { id: 'Clothing', label: 'Fashion' },
  { id: 'Food', label: 'Dining' },
  { id: 'Electronics', label: 'Tech' },
  { id: 'Jewelry', label: 'Jewelry' },
  { id: 'Home', label: 'Home' },
];

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

interface Store {
  id: number;
  name: string;
  description: string;
  category: string;
}

interface ActiveOrder {
  id: number;
  status: string;
  total_price: number;
  items: any[];
}

export default function HomeScreen({ navigation }: Props) {
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  
  // --- REAL DATA STATES ---
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  
  // Address States
  const [addressLabel, setAddressLabel] = useState<string>("Deliver to");
  const [addressLine, setAddressLine] = useState<string>("Select Location");

  // Search State (Added for DashboardHeader)
  const [searchText, setSearchText] = useState('');

  const [isWidgetExpanded, setIsWidgetExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<FlatList>(null);

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
        if (addrErr.response?.status !== 404) {
          console.error("Address fetch error:", addrErr);
        }
      }

      // 2. Fetch Stores
      const storeRes = await client.get('/stores/'); 
      setStores(storeRes.data);
      setFilteredStores(storeRes.data);

      // 3. Fetch Active Order
      const orderRes = await client.get('/orders/me'); 
      const current = orderRes.data.find((o: ActiveOrder) => 
        ['confirmed', 'assigned', 'in_transit', 'picked_up'].includes(o.status)
      );
      setActiveOrder(current || null);

    } catch (error) {
      console.error("Failed to fetch home data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FILTER LOGIC ---
  useEffect(() => {
    let result = stores;

    // 1. Filter by Category
    if (activeCategory !== 'All') {
      result = result.filter(store => 
        store.category?.toLowerCase() === activeCategory.toLowerCase() ||
        store.category?.toLowerCase().includes(activeCategory.toLowerCase())
      );
    }

    // 2. Filter by Search Text (Added logic since we added the state)
    if (searchText) {
      const lowerText = searchText.toLowerCase();
      result = result.filter(store => 
        store.name.toLowerCase().includes(lowerText)
      );
    }

    setFilteredStores(result);
  }, [activeCategory, searchText, stores]);

  // --- CAROUSEL LOGIC ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current) {
        let nextIndex = activeSlide + 1;
        if (nextIndex >= PROMOS.length) nextIndex = 0;
        carouselRef.current.scrollToIndex({ index: nextIndex, animated: true });
        setActiveSlide(nextIndex);
      }
    }, 4000); 
    return () => clearInterval(interval);
  }, [activeSlide]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(); 
  }, []);

  // --- WIDGET LOGIC ---
  const toggleWidget = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsWidgetExpanded(!isWidgetExpanded);
  };

  const getProgressStep = (status: string) => {
    switch (status) {
      case 'confirmed': return 1;
      case 'assigned': return 2;
      case 'picked_up': return 3;
      case 'in_transit': return 3;
      default: return 0;
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'confirmed': return 'Preparing your order...';
      case 'assigned': return 'Driver assigned';
      case 'picked_up': return 'Heading to you';
      case 'in_transit': return 'Arriving soon';
      default: return 'Active Order';
    }
  };

  const isOrderOnTheWay = (status: string) => {
    return status === 'in_transit' || status === 'picked_up';
  };

  // --- COMPONENTS ---
  const renderCarousel = () => (
    <View className="mb-6">
      <FlatList
        ref={carouselRef}
        data={PROMOS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / (width - 48));
          setActiveSlide(index);
        }}
        renderItem={({ item }) => (
          <View style={{ width: width - 48 }} className="h-40 mr-6 rounded-2xl overflow-hidden relative">
            <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
            <View className="absolute inset-0 bg-black/30 justify-center px-6">
              <Text className="text-gold-400 font-bold uppercase tracking-widest text-xs mb-1">{item.subtitle}</Text>
              <Text className="text-white font-serif text-3xl">{item.title}</Text>
            </View>
          </View>
        )}
      />
      <View className="flex-row justify-center mt-3 space-x-2">
        {PROMOS.map((_, index) => (
          <View key={index} className={`h-1.5 rounded-full transition-all ${index === activeSlide ? 'w-6 bg-gold-500' : 'w-1.5 bg-gray-600'}`} />
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-creme relative" edges={['top']}>
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <>
          <FlatList
            data={filteredStores}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }} 
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
            
            ListHeaderComponent={
              <View>
                {/* 1. SHARED HEADER COMPONENT */}
                <DashboardHeader 
                  subtitle="Golden Rose"
                  title="Mall Delivery"
                  addressLabel={addressLabel}
                  addressLine={addressLine}
                  onAddressPress={() => navigation.navigate('Addresses')}
                  
                  searchText={searchText}
                  onSearchChange={setSearchText}
                  searchPlaceholder="Search stores..."
                  
                  categories={CATEGORIES}
                  activeCategory={activeCategory}
                  onCategoryPress={setActiveCategory}
                />

                {/* 2. CAROUSEL (Specific to Home) */}
                {renderCarousel()}

                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-base font-serif text-onyx">
                    {activeCategory === 'All' ? 'All Boutiques' : `${activeCategory} Stores`}
                  </Text>
                </View>
              </View>
            }

            renderItem={({ item }) => (
              <View style={{ width: '48%' }}> 
                <StoreCard 
                  id={item.id}
                  name={item.name}
                  category={item.category || "Luxury"} 
                  onPress={() => navigation.navigate('StoreDetails', { storeId: item.id, name: item.name })}
                />
              </View>
            )}
            ListEmptyComponent={<Text className="text-gray-500 text-center mt-10">No stores found.</Text>}
          />

          {/* ACTIVE ORDER WIDGET */}
          {activeOrder && (
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={toggleWidget}
              className={`absolute bottom-6 left-6 right-6 bg-onyx rounded-2xl border border-white/10 shadow-2xl overflow-hidden ${isWidgetExpanded ? 'pb-4' : 'p-4'}`}
            >
              <View className={`${isWidgetExpanded ? 'p-4 bg-white/5 mb-4' : ''} flex-row items-center justify-between`}>
                <View className="flex-row items-center">
                  <View className="bg-gold-500 h-10 w-10 rounded-full items-center justify-center mr-3">
                    {isOrderOnTheWay(activeOrder.status) ? (
                        <Truck size={20} color="#1A1A1A" fill="#1A1A1A" />
                    ) : (
                        <ShoppingBag size={20} color="#1A1A1A" fill="#1A1A1A" />
                    )}
                  </View>
                  <View>
                    <Text className="text-gold-400 text-[10px] font-bold uppercase tracking-widest">
                      {isOrderOnTheWay(activeOrder.status) ? 'On the way' : 'Active Order'}
                    </Text>
                    <Text className="text-white font-bold text-sm">
                      {getStatusText(activeOrder.status)}
                    </Text>
                  </View>
                </View>
                <View className="bg-white/10 p-2 rounded-full">
                  <ChevronDown size={16} color="#D4AF37" style={{ transform: [{ rotate: isWidgetExpanded ? '0deg' : '-90deg' }]}} />
                </View>
              </View>

              {isWidgetExpanded && (
                <View className="px-4">
                  <View className="flex-row items-center justify-between mb-2 relative">
                    <View className="absolute top-1.5 left-0 right-0 h-0.5 bg-gray-700 z-0" />
                    <View className="items-center z-10">
                      <View className={`h-3 w-3 rounded-full ${getProgressStep(activeOrder.status) >= 1 ? 'bg-gold-500' : 'bg-gray-700'}`} />
                      <Text className="text-gray-400 text-[9px] mt-1">Prep</Text>
                    </View>
                    <View className="items-center z-10">
                       <View className={`h-3 w-3 rounded-full ${getProgressStep(activeOrder.status) >= 2 ? 'bg-gold-500' : 'bg-gray-700'}`} />
                       <Text className="text-gray-400 text-[9px] mt-1">Driver</Text>
                    </View>
                    <View className="items-center z-10">
                       <View className={`h-3 w-3 rounded-full ${getProgressStep(activeOrder.status) >= 3 ? 'bg-gold-500' : 'bg-gray-700'}`} />
                       <Text className="text-gray-400 text-[9px] mt-1">On Way</Text>
                    </View>
                  </View>
                  <View className="h-4" />
                  
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('OrderDetails', { orderId: activeOrder.id })} 
                    className="w-full bg-gold-500 py-3 rounded-xl items-center"
                  >
                    <Text className="text-onyx font-bold uppercase tracking-wider text-xs">Track on Map</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          )}
        </>
      )}
    </SafeAreaView>
  );
}