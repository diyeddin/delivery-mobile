import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';
import { LanguagePreference } from '../i18n/translations';

type LanguageSettingsScreenNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'LanguageSettings'
>;

interface Props {
  navigation: LanguageSettingsScreenNavigationProp;
}

export default function LanguageSettingsScreen({ navigation }: Props) {
  const { t, preference, deviceLanguage, changeLanguage, isRTL } = useLanguage();

  const options: Array<{
    key: LanguagePreference;
    label: string;
    sublabel?: string;
  }> = [
    {
      key: 'auto',
      label: t('auto_device_language'),
      sublabel: `${t('currently')}: ${deviceLanguage === 'en' ? 'English' : 'العربية'}`,
    },
    { key: 'en', label: 'English' },
    { key: 'ar', label: 'العربية' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      {/* Header (Matched exactly to Payment Screen) */}
      <View className="px-6 py-4 flex-row items-center border-b border-onyx/5">
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="p-2 bg-onyx/5 rounded-full me-4"
        >
          <ArrowLeft 
            color="#0F0F0F" 
            size={20} 
            style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} 
          />
        </TouchableOpacity>
        <Text className="text-xl text-onyx font-serif">
          {t('language_settings')}
        </Text>
      </View>

      <ScrollView className="flex-1">
        
        {/* Helper Title */}
        <View className="p-6 pb-2">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
            {t('select_language')}
            </Text>
        </View>

        {/* Language Options */}
        <View className="mx-6 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          {options.map((option, index) => (
            <TouchableOpacity
              key={option.key}
              onPress={() => changeLanguage(option.key)}
              className={`p-5 ${
                index < options.length - 1 ? 'border-b border-gray-50' : ''
              } ${preference === option.key ? 'bg-gold-50/50' : 'bg-white'}`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className={`text-base font-bold ${preference === option.key ? 'text-onyx' : 'text-gray-600'}`}>
                    {option.label}
                  </Text>
                  {option.sublabel && (
                    <Text className="text-xs text-gray-400 mt-1">
                      {option.sublabel}
                    </Text>
                  )}
                </View>

                {/* Selection Indicator (Matches Payment Logic style) */}
                <View
                  className={`w-6 h-6 rounded-full border-2 ${
                    preference === option.key
                      ? 'border-gold-500 bg-gold-500'
                      : 'border-gray-300'
                  } items-center justify-center`}
                >
                  {preference === option.key && (
                    <View className="w-2.5 h-2.5 rounded-full bg-white" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Helper Text */}
        <View className="px-6 py-6">
          <Text className="text-gray-400 text-xs text-center leading-relaxed">
            {preference === 'auto'
              ? t('auto_mode_active')
              : t('manual_mode_active')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}