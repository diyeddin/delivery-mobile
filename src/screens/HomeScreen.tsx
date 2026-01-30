import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, Text, FlatList, Image, TouchableOpacity, LayoutAnimation, Dimensions 
} from 'react-native';
import client from '../api/client';
import DashboardHeader from '../components/DashboardHeader';
import StoreGrid from '../components/StoreGrid';
import { ShoppingBag, Truck, ChevronDown, Check, MapPin, User, Package } from 'lucide-react-native'; 
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// 1. Constants for Carousel
const GAP = 12; 
const CARD_WIDTH = width - 32; 
const SNAP_INTERVAL = CARD_WIDTH + GAP; 

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

// --- TIMELINE CONFIG ---
const TIMELINE_STEPS = [
    { label: 'Confirmed', icon: ShoppingBag, statusMatch: ['pending', 'confirmed'] },
    { label: 'Driver', icon: User, statusMatch: ['assigned'] },
    { label: 'On Way', icon: Truck, statusMatch: ['picked_up', 'in_transit'] },
    { label: 'Arriving', icon: MapPin, statusMatch: ['delivered'] },
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
  store?: { name: string }; // <--- Added Store Name support
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
      // 1. Filter: Get ONLY active orders (ignore delivered/canceled)
      const activeList = orderRes.data.filter((o: ActiveOrder) => 
        ['pending', 'confirmed', 'assigned', 'in_transit', 'picked_up'].includes(o.status)
      );

      // 2. Sort: Rank them by "Excitement Level"
      // This helper calculates the score
      const getStatusScore = (status: string) => {
          switch (status) {
              case 'in_transit': return 5; // Highest priority
              case 'picked_up': return 4;
              case 'assigned': return 3;
              case 'confirmed': return 2;
              case 'pending': return 1;
              default: return 0;
          }
      };

      if (activeList.length > 0) {
          // Sort descending (Highest score first)
          activeList.sort((a: ActiveOrder, b: ActiveOrder) => {
              return getStatusScore(b.status) - getStatusScore(a.status);
          });
          
          // Set the winner
          setActiveOrder(activeList[0]);
      } else {
          setActiveOrder(null);
      }

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
      case 'pending': return 'Waiting for store...';
      default: return 'Active Order';
    }
  };

  // --- HELPER: Calculate current step index ---
  const getCurrentStepIndex = (status: string) => {
      if (status === 'delivered') return 3;
      if (['picked_up', 'in_transit'].includes(status)) return 2;
      if (['assigned'].includes(status)) return 1;
      return 0; // pending, confirmed
  };

  const renderCarousel = () => (
      <View className="mb-6">
        <FlatList
          ref={carouselRef}
          data={PROMOS}
          horizontal
          pagingEnabled={false} 
          snapToInterval={SNAP_INTERVAL} 
          snapToAlignment="start"
          decelerationRate="fast" 
          disableIntervalMomentum={true}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          onScroll={(event) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / SNAP_INTERVAL);
            if (index !== activeSlide) setActiveSlide(index);
          }}
          scrollEventThrottle={16} 
          renderItem={({ item, index }) => (
            <View 
              style={{ width: CARD_WIDTH, marginRight: index === PROMOS.length - 1 ? 0 : GAP }} 
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
          activeOpacity={0.95}
          onPress={toggleWidget}
          className={`absolute bottom-6 left-4 right-4 bg-onyx rounded-2xl border border-white/10 shadow-2xl overflow-hidden shadow-black/50 ${isWidgetExpanded ? 'pb-5' : 'p-0'}`}
        >
          {/* Header Row (Always Visible) */}
          <View className="flex-row items-center justify-between p-4 bg-onyx z-20">
            <View className="flex-row items-center flex-1">
              {/* Pulsing Dot Indicator */}
              <View className="relative mr-4">
                 <View className="w-10 h-10 bg-gold-500/20 rounded-full items-center justify-center animate-pulse">
                     <View className="w-6 h-6 bg-gold-500 rounded-full items-center justify-center shadow-lg shadow-gold-500/50">
                        {['in_transit', 'picked_up'].includes(activeOrder.status) ? (
                            <Truck size={12} color="#1A1A1A" fill="#1A1A1A" />
                        ) : (
                            <ShoppingBag size={12} color="#1A1A1A" fill="#1A1A1A" />
                        )}
                     </View>
                 </View>
              </View>

              <View>
                {/* Store Name & Status Text */}
                <Text className="text-gold-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                  {activeOrder.store?.name || "Active Order"}
                </Text>
                <Text className="text-white font-bold text-sm">
                  {getStatusText(activeOrder.status)}
                </Text>
              </View>
            </View>

            {/* Expand Icon */}
            <View className="bg-white/10 p-2 rounded-full ml-4">
              <ChevronDown size={16} color="#D4AF37" style={{ transform: [{ rotate: isWidgetExpanded ? '0deg' : '-90deg' }]}} />
            </View>
          </View>

          {/* Expanded Content: Timeline */}
          {isWidgetExpanded && (
            <View className="px-5 pt-2">
              
              {/* Timeline Container */}
              <View className="flex-row items-center justify-between mt-2 mb-6 relative">
                 {/* Background Line */}
                 <View className="absolute top-[14px] left-4 right-4 h-[2px] bg-white/10 z-0" />
                 
                 {/* Progress Line (Gold) */}
                 <View 
                    className="absolute top-[14px] left-4 h-[2px] bg-gold-500 z-0" 
                    style={{ 
                        width: `${(getCurrentStepIndex(activeOrder.status) / (TIMELINE_STEPS.length - 1)) * 90}%` 
                    }} 
                 />

                 {/* Steps */}
                 {TIMELINE_STEPS.map((step, index) => {
                     const currentIndex = getCurrentStepIndex(activeOrder.status);
                     const isActive = index <= currentIndex;
                     const isCurrent = index === currentIndex;

                     return (
                         <View key={index} className="items-center z-10" style={{ width: 60 }}>
                             {/* Icon Circle */}
                             <View className={`w-8 h-8 rounded-full items-center justify-center border-2 mb-2 ${
                                 isActive 
                                    ? 'bg-onyx border-gold-500' 
                                    : 'bg-onyx border-gray-600'
                             }`}>
                                 {isActive ? (
                                     <step.icon size={12} color="#D4AF37" />
                                 ) : (
                                     <View className="w-2 h-2 rounded-full bg-gray-600" />
                                 )}
                             </View>
                             
                             {/* Label */}
                             <Text className={`text-[10px] font-bold ${
                                 isActive ? 'text-white' : 'text-gray-600'
                             }`}>
                                 {step.label}
                             </Text>
                         </View>
                     );
                 })}
              </View>

              {/* Action Button */}
              <TouchableOpacity 
                onPress={() => navigation.navigate('OrderDetails', { orderId: activeOrder.id })} 
                className="w-full bg-gold-500 py-3 rounded-xl items-center shadow-lg shadow-gold-500/20 active:opacity-90"
              >
                <Text className="text-onyx font-bold uppercase tracking-wider text-xs">View Order Details</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}