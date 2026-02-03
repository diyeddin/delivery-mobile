import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext'; // <--- 1. Import Hook
import {
  LogOut,
  ChevronRight,
  Package,
  MapPin,
  CreditCard,
  Bell,
  Shield,
  User as UserIcon,
  Globe // <--- 2. Import Globe Icon
} from 'lucide-react-native';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { HomeStackParamList, ProfileStackParamList } from '../types';

type ProfileScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>,
  NativeStackNavigationProp<HomeStackParamList>
>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

// Helper Row Component
const MenuRow = ({ icon: Icon, label, onPress, isDestructive = false, isRTL }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center justify-between p-4 border-b border-gray-100 bg-white"
    activeOpacity={0.7}
  >
    <View className="flex-row items-center">
      <View className={`p-2 rounded-lg ${isDestructive ? 'bg-red-50' : 'bg-gray-50'} me-4`}>
        <Icon size={20} color={isDestructive ? '#EF4444' : '#0F0F0F'} />
      </View>
      <Text className={`text-base font-medium ${isDestructive ? 'text-red-500' : 'text-onyx'}`}>
        {label}
      </Text>
    </View>
    {!isDestructive && <ChevronRight size={18} color="#9CA3AF" style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />}
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { t, language, changeLanguage, isRTL } = useLanguage();

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('confirm_logout'),
      [
        { text: t('cancel'), style: "cancel" },
        { text: t('logout'), style: "destructive", onPress: logout }
      ]
    );
  };

  // 1. GUEST VIEW
  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
        
        {/* 1 NEW HEADER: Language Switcher Top Corner */}
        <View className="flex-row justify-end px-6 py-4">
          <TouchableOpacity 
            onPress={() => changeLanguage(language === 'en' ? 'ar' : 'en')}
            activeOpacity={0.8}
            className="flex-row items-center bg-white border border-gold-500/30 rounded-full px-4 py-2 shadow-sm"
          >
            <Globe size={16} color="#D4AF37" style={{ marginEnd: 8 }} />
            <Text className="text-xs font-bold text-onyx uppercase">
              {language === 'en' ? 'English' : 'العربية'}
            </Text>
            {/* Divider */}
            <View className="h-3 w-[1px] bg-gray-300 mx-2" />
            <Text className="text-xs font-bold text-gray-400 uppercase">
              {language === 'en' ? 'AR' : 'EN'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2 CENTERED CONTENT (Pushed down by flex-1) */}
        <View className="flex-1 items-center justify-center px-6 -mt-10">
          <View className="bg-onyx/5 p-6 rounded-full mb-6">
            <UserIcon size={48} color="#0F0F0F" />
          </View>
          
          <Text className="text-2xl font-serif text-onyx mb-2 px-3 text-center">
            {t('welcome')}
          </Text>
          
          <Text className="text-gray-500 text-center mb-8 px-4 leading-6">
            {t('guest_profile_message')}
          </Text>

          {/* LOGIN BUTTON */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            className="bg-onyx w-full py-4 rounded-xl shadow-lg mb-3"
          >
            <Text className="text-white text-center font-bold text-lg">{t('login')}</Text>
          </TouchableOpacity>

          {/* REGISTER BUTTON */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            className="bg-transparent border-2 border-gold-500 w-full py-4 rounded-xl"
          >
            <Text className="text-gold-600 text-center font-bold text-lg">{t('create_account')}</Text>
          </TouchableOpacity>
        </View>
        
      </SafeAreaView>
    );
  }

  // 2. LOGGED IN VIEW
  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      <ScrollView>
        {/* Header */}
        <View className="p-6 items-center border-b border-onyx/5 mb-6">
          <View className="w-24 h-24 bg-onyx rounded-full items-center justify-center mb-4 shadow-xl border-4 border-white">
            <Text className="text-gold-500 text-3xl font-serif font-bold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <Text className="text-2xl font-serif text-onyx mb-1">{user?.name}</Text>
          <Text className="text-gray-500 text-sm">{user?.sub}</Text>
        </View>

        {/* My Account */}
        <View className="px-6 mb-2">
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 text-start">
            {t('profile')}
          </Text>
        </View>
        <View className="bg-white mx-4 rounded-xl overflow-hidden shadow-sm mb-6">
          <MenuRow 
            icon={Package} 
            label={t('orders')} 
            onPress={() => navigation.navigate('Orders')}
            isRTL={isRTL}
          />
          <MenuRow 
            icon={MapPin} 
            label={t('addresses')} 
            onPress={() => navigation.navigate('Addresses')}
            isRTL={isRTL}
          />
          <MenuRow 
            icon={CreditCard} 
            label={t('paymentMethods')} 
            onPress={() => navigation.navigate('Payments')}
            isRTL={isRTL}
          />
        </View>

        {/* Preferences */}
        <View className="px-6 mb-2">
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 text-start">
             {t('preferences')}
          </Text>
        </View>
        <View className="bg-white mx-4 rounded-xl overflow-hidden shadow-sm mb-8">
          
          {/* 👇 LANGUAGE SWITCHER ROW */}
          <TouchableOpacity
            onPress={() => changeLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex-row items-center justify-between p-4 border-b border-gray-100 bg-white"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
                <View className="bg-gray-50 p-2 rounded-lg me-4">
                    <Globe size={20} color="#0F0F0F" />
                </View>
                <Text className="text-base font-medium text-onyx">{t('changeLanguage')}</Text>
            </View>

            {/* Language Toggle UI */}
            <View className="flex-row items-center bg-gray-100 rounded-full px-3 py-1">
                <Text className={`text-xs font-bold ${language === 'en' ? 'text-onyx' : 'text-gray-400'}`}>EN</Text>
                <Text className="text-gray-300 mx-1">|</Text>
                <Text className={`text-xs font-bold ${language === 'ar' ? 'text-onyx' : 'text-gray-400'}`}>AR</Text>
            </View>
          </TouchableOpacity>

          <MenuRow 
            icon={Bell} 
            label={t('notifications')} 
            onPress={() => navigation.navigate('Notifications')}
            isRTL={isRTL}
          />
          <MenuRow 
            icon={Shield} 
            label={t('privacy')} 
            onPress={() => navigation.navigate('Privacy')}
            isRTL={isRTL}
          />
        </View>

        {/* Logout */}
        <View className="mx-4 mb-10">
          <TouchableOpacity onPress={handleLogout} className="flex-row items-center justify-center bg-white border border-red-100 p-4 rounded-xl shadow-sm">
            <LogOut size={20} color="#EF4444" className="me-2" />
            <Text className="text-red-500 font-bold ms-2">{t('logout')}</Text>
          </TouchableOpacity>
          <Text className="text-center text-gray-300 text-xs mt-4">{t('version_footer')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}