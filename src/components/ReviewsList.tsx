import React from 'react';
import { View, Text, Animated, ActivityIndicator } from 'react-native';
import { User, Star } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { Review } from '../types';

interface ReviewsListProps {
  reviews: Review[];
  ListHeaderComponent?: React.ReactElement;
  onScroll?: (...args: unknown[]) => void;
  isLoading?: boolean;
}

const SHEET_BG_COLOR = '#F5F5F0';

export default function ReviewsList({ 
  reviews, 
  ListHeaderComponent, 
  onScroll,
  isLoading 
}: ReviewsListProps) {
  const { t, language } = useLanguage();

  const formatDate = (dateString: string) => {
    const locale = language === 'ar' ? 'ar-SA' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale);
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    // 👇 WRAPPER: Matches sheet color to fill gaps, but doesn't cover the banner
    <View style={{ backgroundColor: SHEET_BG_COLOR, paddingHorizontal: 16, paddingBottom: 12 }}>
      <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-row items-center">
            <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-2">
               <User size={14} color="#6B7280" />
            </View>
            <Text className="font-bold text-onyx text-sm">{item.user_name}</Text>
          </View>
          <Text className="text-xs text-gray-400">
            {formatDate(item.created_at)}
          </Text>
        </View>
        
        <View className="flex-row mb-2">
           {[1,2,3,4,5].map(star => (
             <Star 
               key={star} 
               size={12} 
               color="#D4AF37" 
               fill={star <= item.rating ? "#D4AF37" : "transparent"} 
             />
           ))}
        </View>
        
        {item.comment && (
          <Text className="text-gray-600 text-sm leading-5">{item.comment}</Text>
        )}
      </View>
    </View>
  );

  const EmptyComponent = () => (
    <View className="items-center py-12 px-4" style={{ backgroundColor: SHEET_BG_COLOR }}>
       <Text className="text-gray-400 font-serif text-center">
         {isLoading ? t('loading') : t('no_reviews_yet')}
       </Text>
    </View>
  );

  return (
    <Animated.FlatList
      data={reviews}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderReviewItem}
      
      ListHeaderComponent={ListHeaderComponent}
      
      onScroll={onScroll}
      scrollEventThrottle={16}
      
      // 👇 FIXED: Transparent so the banner shows through the top gap
      style={{ backgroundColor: 'transparent' }}
      
      contentContainerStyle={{ 
        paddingBottom: 0,
        backgroundColor: 'transparent', // Transparent container
        flexGrow: 1
      }}
      
      ListEmptyComponent={isLoading ? (
        <View style={{ backgroundColor: SHEET_BG_COLOR, padding: 20 }}>
            <ActivityIndicator color="#D4AF37" />
        </View>
      ) : <EmptyComponent />}
      
      // 👇 FOOTER: Keeps the bottom solid color
      ListFooterComponent={<View style={{ height: 250, backgroundColor: SHEET_BG_COLOR }} />}
    />
  );
}