import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, Text, FlatList, Image, TouchableOpacity, LayoutAnimation, Dimensions 
} from 'react-native';
import client from '../api/client';
import DashboardHeader from '../components/DashboardHeader';
import StoreGrid from '../components/StoreGrid';
import { ShoppingBag, Truck, ChevronDown } from 'lucide-react-native'; 
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// 1. Constants for Carousel
const GAP = 12; // The spacing between slides
const CARD_WIDTH = width - 32; // Width of the card (Screen - 32px parent padding)
const SNAP_INTERVAL = CARD_WIDTH + GAP; // The total width to snap (Card + Gap)

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
  image_url?: string;
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
  
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [addressLabel, setAddressLabel] = useState<string>("Deliver to");
  const [addressLine, setAddressLine] = useState<string>("Select Location");
  const [searchText, setSearchText] = useState('');

  const [isWidgetExpanded, setIsWidgetExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<FlatList>(null);

  const fetchData = async () => {
    try {
      try {
        const addrRes = await client.get('/addresses/default');
        if (addrRes.data) {
          setAddressLabel(addrRes.data.label || "Deliver to");
          const fullAddress = addrRes.data.address_line;
          setAddressLine(fullAddress.length > 25 ? fullAddress.substring(0, 25) + '...' : fullAddress);
        }
      } catch (addrErr: any) {
        if (addrErr.response?.status !== 404) console.error("Address error:", addrErr);
      }

      const storeRes = await client.get('/stores/'); 
      setStores(storeRes.data);
      setFilteredStores(storeRes.data);

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

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let result = stores;
    if (activeCategory !== 'All') {
      result = result.filter(store => 
        store.category?.toLowerCase() === activeCategory.toLowerCase() ||
        store.category?.toLowerCase().includes(activeCategory.toLowerCase())
      );
    }
    if (searchText) {
      const lowerText = searchText.toLowerCase();
      result = result.filter(store => store.name.toLowerCase().includes(lowerText));
    }
    setFilteredStores(result);
  }, [activeCategory, searchText, stores]);

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

  const toggleWidget = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsWidgetExpanded(!isWidgetExpanded);
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

  // --- CAROUSEL (FIXED: NO SKIPPING) ---
    const renderCarousel = () => (
      <View className="mb-6">
        <FlatList
          ref={carouselRef}
          data={PROMOS}
          horizontal
          pagingEnabled={false} 

          // --- SNAP LOGIC ---
          snapToInterval={SNAP_INTERVAL} 
          snapToAlignment="start"

          // FIX 1: Use 'fast' for snapping, but disable momentum so it won't skip items
          decelerationRate="fast" 
          disableIntervalMomentum={true}

          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}

          // FIX 2: Reactive scrolling (updates dots immediately)
          onScroll={(event) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            // Use Math.round to find the closest slide index
            const index = Math.round(offsetX / SNAP_INTERVAL);
            if (index !== activeSlide) {
              setActiveSlide(index);
            }
          }}
          scrollEventThrottle={16} // 60fps updates

          renderItem={({ item, index }) => (
            <View 
              style={{ 
                width: CARD_WIDTH,
                // Margin right for all except last
                marginRight: index === PROMOS.length - 1 ? 0 : GAP 
              }} 
              className="h-40 rounded-2xl overflow-hidden relative"
            >
              <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
              <View className="absolute inset-0 bg-black/30 justify-center px-6">
                <Text className="text-gold-400 font-bold uppercase tracking-widest text-xs mb-1">{item.subtitle}</Text>
                <Text className="text-white font-serif text-3xl">{item.title}</Text>
              </View>
            </View>
          )}
        />

        {/* Dots Indicator */}
        <View className="flex-row justify-center mt-3 space-x-2">
          {PROMOS.map((_, index) => (
            <View key={index} className={`h-1.5 rounded-full transition-all mx-0.5 ${index === activeSlide ? 'w-6 bg-gold-500' : 'w-1.5 bg-gray-600'}`} />
          ))}
        </View>
      </View>
    );

  return (
    <SafeAreaView className="flex-1 bg-creme relative" edges={['top']}>
      
      {/* 1. FIXED HEADER */}
      <View className="px-6 z-10" style={{ paddingHorizontal: 16 }}>
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
      </View>

      {/* 2. REUSABLE STORE GRID */}
      <StoreGrid 
        stores={filteredStores}
        isLoading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onStorePress={(store) => navigation.navigate('StoreDetails', { storeId: store.id, name: store.name })}
        
        // Pass the Carousel and Title as the Header
        ListHeaderComponent={
          <View>
             {renderCarousel()}
             <View className="flex-row justify-between items-center mb-3">
               <Text className="text-base font-serif text-onyx">
                 {activeCategory === 'All' ? 'All Shops' : `${activeCategory} Stores`}
               </Text>
             </View>
          </View>
        }
      />

      {/* 3. ACTIVE ORDER WIDGET */}
      {activeOrder && (
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={toggleWidget}
          className={`absolute bottom-6 left-6 right-6 bg-onyx rounded-2xl border border-white/10 shadow-2xl overflow-hidden ${isWidgetExpanded ? 'pb-4' : 'p-4'}`}
        >
          <View className={`${isWidgetExpanded ? 'p-4 bg-white/5 mb-4' : ''} flex-row items-center justify-between`}>
            <View className="flex-row items-center">
              <View className="bg-gold-500 h-10 w-10 rounded-full items-center justify-center mr-3">
                {['in_transit', 'picked_up'].includes(activeOrder.status) ? (
                    <Truck size={20} color="#1A1A1A" fill="#1A1A1A" />
                ) : (
                    <ShoppingBag size={20} color="#1A1A1A" fill="#1A1A1A" />
                )}
              </View>
              <View>
                <Text className="text-gold-400 text-[10px] font-bold uppercase tracking-widest">
                  {['in_transit', 'picked_up'].includes(activeOrder.status) ? 'On the way' : 'Active Order'}
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
              <TouchableOpacity 
                onPress={() => navigation.navigate('OrderDetails', { orderId: activeOrder.id })} 
                className="w-full bg-gold-500 py-3 rounded-xl items-center mt-4"
              >
                <Text className="text-onyx font-bold uppercase tracking-wider text-xs">Track on Map</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}