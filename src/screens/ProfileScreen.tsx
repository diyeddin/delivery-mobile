import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  ChevronRight,
  Package,
  MapPin,
  CreditCard,
  Bell,
  Shield,
  User as UserIcon
} from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';

type ProfileScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

const MenuRow = ({ icon: Icon, label, onPress, isDestructive = false }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center justify-between p-4 border-b border-gray-100 bg-white"
    activeOpacity={0.7}
  >
    <View className="flex-row items-center">
      <View className={`p-2 rounded-lg ${isDestructive ? 'bg-red-50' : 'bg-gray-50'} mr-4`}>
        <Icon size={20} color={isDestructive ? '#EF4444' : '#0F0F0F'} />
      </View>
      <Text className={`text-base font-medium ${isDestructive ? 'text-red-500' : 'text-onyx'}`}>
        {label}
      </Text>
    </View>
    {!isDestructive && <ChevronRight size={18} color="#9CA3AF" />}
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: logout }
      ]
    );
  };

  // 1. GUEST VIEW
  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-creme items-center justify-center p-6" edges={['top']}>
        <View className="bg-onyx/5 p-6 rounded-full mb-6">
          <UserIcon size={48} color="#0F0F0F" />
        </View>
        <Text className="text-2xl font-serif text-onyx mb-2">Welcome, Guest</Text>
        <Text className="text-gray-500 text-center mb-8">
          Log in to track your orders, save addresses, and access exclusive mall offers.
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          className="bg-onyx w-full py-4 rounded-xl shadow-lg mb-4"
        >
          <Text className="text-white text-center font-bold text-lg">Log In / Sign Up</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 2. LOGGED IN VIEW
  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      <ScrollView>
        <View className="p-6 items-center border-b border-onyx/5 mb-6">
          <View className="w-24 h-24 bg-onyx rounded-full items-center justify-center mb-4 shadow-xl border-4 border-white">
            <Text className="text-gold-500 text-3xl font-serif font-bold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <Text className="text-2xl font-serif text-onyx mb-1">{user?.name}</Text>
          <Text className="text-gray-500 text-sm">{user?.sub}</Text>
        </View>

        <View className="px-6 mb-2">
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">My Account</Text>
        </View>
        <View className="bg-white mx-4 rounded-xl overflow-hidden shadow-sm mb-6">
          <MenuRow icon={Package} label="My Orders" onPress={() => console.log("Orders")} />
          <MenuRow icon={MapPin} label="Shipping Addresses" onPress={() => console.log("Addresses")} />
          <MenuRow icon={CreditCard} label="Payment Methods" onPress={() => console.log("Payments")} />
        </View>

        <View className="px-6 mb-2">
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Preferences</Text>
        </View>
        <View className="bg-white mx-4 rounded-xl overflow-hidden shadow-sm mb-8">
          <MenuRow icon={Bell} label="Notifications" onPress={() => console.log("Notifs")} />
          <MenuRow icon={Shield} label="Privacy & Security" onPress={() => console.log("Privacy")} />
        </View>

        <View className="mx-4 mb-10">
          <TouchableOpacity onPress={handleLogout} className="flex-row items-center justify-center bg-white border border-red-100 p-4 rounded-xl shadow-sm">
            <LogOut size={20} color="#EF4444" className="mr-2" />
            <Text className="text-red-500 font-bold ml-2">Log Out</Text>
          </TouchableOpacity>
          <Text className="text-center text-gray-300 text-xs mt-4">Version 1.0.0 • Golden Rose</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}