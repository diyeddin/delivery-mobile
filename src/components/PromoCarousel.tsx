import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, Image, Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_PADDING = 12; // Matches your HomeScreen padding
// The card takes up the full width available inside the padding
const CARD_WIDTH = SCREEN_WIDTH - (CONTAINER_PADDING * 2); 
const GAP = 12; 
const SNAP_INTERVAL = CARD_WIDTH + GAP;

interface Promo {
  id: number;
  title: string;
  subtitle: string;
  image: string;
}

// Default Data (Move this here or pass as prop)
const PROMOS: Promo[] = [
  { id: 1, title: 'Summer Collection', subtitle: 'New Arrivals', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop' },
  { id: 2, title: 'Tech Week', subtitle: 'Up to 30% Off', image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=800&auto=format&fit=crop' },
  { id: 3, title: 'Food Court', subtitle: 'Free Delivery', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop' },
];

export default function PromoCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Auto-Scroll Logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (flatListRef.current && PROMOS.length > 0) {
        let nextIndex = activeSlide + 1;
        if (nextIndex >= PROMOS.length) nextIndex = 0;
        
        flatListRef.current.scrollToOffset({
          offset: nextIndex * SNAP_INTERVAL,
          animated: true
        });
        setActiveSlide(nextIndex);
      }
    }, 5000); // 5 seconds is better for readability
    return () => clearInterval(interval);
  }, [activeSlide]);

  return (
    <View className="mb-6">
      <FlatList
        ref={flatListRef}
        data={PROMOS}
        horizontal
        pagingEnabled={false} // We handle snapping manually for gaps
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        
        // Ensure the last item has space to be scrolled to if needed
        contentContainerStyle={{ paddingRight: GAP }} 
        
        onScroll={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          // Rounding ensures we pick the closest index
          const index = Math.round(offsetX / SNAP_INTERVAL);
          if (index !== activeSlide) setActiveSlide(index);
        }}
        scrollEventThrottle={16}
        
        renderItem={({ item, index }) => (
          <View 
            style={{ 
              width: CARD_WIDTH, 
              marginRight: GAP 
            }} 
            className="h-44 rounded-2xl overflow-hidden relative bg-gray-200"
          >
            <Image 
              source={{ uri: item.image }} 
              className="w-full h-full" 
              resizeMode="cover" 
            />
            {/* Dark Overlay for text readability */}
            <View className="absolute inset-0 bg-black/30 justify-center px-6">
              <Text className="text-gold-400 font-bold uppercase tracking-widest text-xs mb-1">
                {item.subtitle}
              </Text>
              <Text className="text-white font-serif text-3xl font-bold">
                {item.title}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Pagination Dots */}
      <View className="flex-row justify-center mt-3 space-x-2">
        {PROMOS.map((_, index) => (
          <View 
            key={index} 
            className={`h-1 rounded-full transition-all mx-0.5 ${
              index === activeSlide ? 'w-6 bg-gold-500' : 'w-2.5 bg-gray-600'
            }`} 
          />
        ))}
      </View>
    </View>
  );
}