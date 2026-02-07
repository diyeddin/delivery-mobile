import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Star, X } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';

interface RateOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  storeName: string;
}

export default function RateOrderModal({ visible, onClose, onSubmit, storeName }: RateOrderModalProps) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    await onSubmit(rating, comment);
    setSubmitting(false);
    setRating(0);
    setComment('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="w-full">
          <View className="bg-white rounded-2xl p-6 shadow-2xl w-full">
            
            {/* Header */}
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-serif font-bold text-onyx">{t('rate_your_order')}</Text>
              <TouchableOpacity onPress={onClose} className="p-1">
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            <Text className="text-sm text-gray-500 mb-6">
              {t('how_was_experience')} <Text className="font-bold text-onyx">{storeName}</Text>?
            </Text>

            {/* Stars */}
            <View className="flex-row justify-center gap-3 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Star 
                    size={32} 
                    color="#D4AF37" 
                    fill={rating >= star ? "#D4AF37" : "transparent"} 
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Comment Box */}
            <View className="bg-gray-50 rounded-xl p-3 mb-6 border border-gray-100 h-24">
              <TextInput
                className="flex-1 text-sm text-onyx"
                placeholder={t('write_review_placeholder')}
                multiline
                textAlignVertical="top"
                value={comment}
                onChangeText={setComment}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              onPress={handleSubmit}
              disabled={rating === 0 || submitting}
              className={`w-full py-3.5 rounded-xl items-center ${rating > 0 ? 'bg-onyx' : 'bg-gray-200'}`}
            >
              {submitting ? (
                <ActivityIndicator color="#D4AF37" />
              ) : (
                <Text className={`font-bold uppercase tracking-wider text-xs ${rating > 0 ? 'text-gold-400' : 'text-gray-400'}`}>
                  {t('submit_review')}
                </Text>
              )}
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}