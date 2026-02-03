import './global.css';
import React, { useEffect, useState } from 'react'; 
import { View, Text } from 'react-native'; 
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NetInfo from '@react-native-community/netinfo'; 
import { WifiOff, Home, ShoppingBag, User, Store } from 'lucide-react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider, useCart } from './src/context/CartContext';
import { useFonts, PlayfairDisplay_400Regular, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import CartScreen from './src/screens/CartScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import StoreDetailsScreen from './src/screens/StoreDetailsScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import AddressesScreen from './src/screens/AddressesScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import AddAddressScreen from './src/screens/AddAddressScreen';
import OrderDetailsScreen from './src/screens/OrderDetailsScreen';

import { HomeStackParamList, ProfileStackParamList } from './src/types';

// ---------------------------------------------------------
// 1. COMPONENTS & CONFIG
// ---------------------------------------------------------

function OfflineBanner() {
  const [isConnected, setIsConnected] = useState(true);
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(!!state.isConnected);
    });
    return unsubscribe;
  }, []);
  if (isConnected) return null;
  return (
    <View className="absolute top-0 w-full bg-red-600 z-50 pt-12 pb-2 items-center justify-center shadow-md">
      <View className="flex-row items-center">
        <WifiOff color="white" size={16} className="mr-2" />
        <Text className="text-white font-bold text-xs uppercase tracking-widest">
          No Internet Connection
        </Text>
      </View>
    </View>
  );
}

const LuxuryTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F5F5F0',
  },
};

const toastConfig = {
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#7babf9', backgroundColor: '#0F0F0F' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: 'bold', color: '#7babf9' }}
      text2Style={{ fontSize: 14, color: '#F5F5F0' }}
    />
  ),
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#D4AF37', backgroundColor: '#0F0F0F' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: 'bold', color: '#D4AF37' }}
      text2Style={{ fontSize: 14, color: '#F5F5F0' }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#EF4444', backgroundColor: '#0F0F0F' }}
      text1Style={{ fontSize: 16, fontWeight: 'bold', color: '#EF4444' }}
      text2Style={{ fontSize: 14, color: '#F5F5F0' }}
    />
  )
};

// ---------------------------------------------------------
// 2. NAVIGATORS
// ---------------------------------------------------------
const RootStack = createNativeStackNavigator<HomeStackParamList>();
const Stack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const MarketplaceStack = createNativeStackNavigator<HomeStackParamList>();
const Tab = createBottomTabNavigator();

// --- HOME STACK ---
function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="StoreDetails" component={StoreDetailsScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} /> 
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="AddAddress" component={AddAddressScreen} />
    </Stack.Navigator>
  );
}

// --- MARKETPLACE STACK ---
function MarketplaceStackNavigator() {
  return (
    <MarketplaceStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <MarketplaceStack.Screen name="MarketplaceMain" component={MarketplaceScreen} />
      <MarketplaceStack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <MarketplaceStack.Screen name="StoreDetails" component={StoreDetailsScreen} />
      <MarketplaceStack.Screen name="Addresses" component={AddressesScreen} />
      <MarketplaceStack.Screen name="AddAddress" component={AddAddressScreen} />
    </MarketplaceStack.Navigator>
  );
}

// --- PROFILE STACK ---
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="Orders" component={OrdersScreen} />
      <ProfileStack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <ProfileStack.Screen name="Addresses" component={AddressesScreen} />
      <ProfileStack.Screen name="AddAddress" component={AddAddressScreen} />
      <ProfileStack.Screen name="Privacy" component={PrivacyScreen} />
      <ProfileStack.Screen name="Payments" component={PaymentsScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
    </ProfileStack.Navigator>
  );
}

// --- MAIN TABS ---
function AppTabs() {
  const { count } = useCart();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F0F0F',
          borderTopColor: '#333',
          paddingTop: 5,
        },
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#6B7280',
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ tabBarIcon: ({ color }) => <Home color={color} size={24} /> }}
      />
      <Tab.Screen
        name="MarketplaceTab"
        component={MarketplaceStackNavigator}
        options={{ tabBarIcon: ({ color }) => <Store color={color} size={24} /> }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ color }) => <ShoppingBag color={color} size={24} />,
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: '#D4AF37', color: 'black', fontSize: 10 }
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStackNavigator}
        options={{ tabBarIcon: ({ color }) => <User color={color} size={24} /> }}
      />
    </Tab.Navigator>
  );
}

// --- ROOT NAVIGATOR ---
// ⚠️ CHANGED: No longer wraps itself in NavigationContainer
function RootNavigator() {
  const { isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={AppTabs} />
      
      {/* Modals */}
      <RootStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ presentation: 'modal', animation: 'fade' }}
      />
      <RootStack.Screen 
        name="Checkout"
        component={CheckoutScreen}
        options={{ presentation: 'modal', animation: 'fade' }}
      />

      {/* Direct link for Checkout -> OrderDetails transition */}
      <RootStack.Screen 
        name="OrderDetails" 
        component={OrderDetailsScreen} 
        options={{ animation: 'slide_from_right' }}
      />
    </RootStack.Navigator>
  );
}

// ---------------------------------------------------------
// 3. MAIN APP EXPORT
// ---------------------------------------------------------
export default function App() {
  let [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
  });

  if (!fontsLoaded) return null;

  // 👇 STRUCTURE INVERTED HERE
  return (
    <NavigationContainer theme={LuxuryTheme}> 
      {/* 1. Nav Container is the parent */}
      <AuthProvider>
        {/* 2. AuthProvider is the child */}
        <CartProvider>
           {/* 3. CartProvider is the grandchild */}
          
          <StatusBar style="dark" />
          <OfflineBanner />
          
          <RootNavigator /> 
          {/* 4. Navigator is inside everything */}
          
          <Toast config={toastConfig} topOffset={75} />
        </CartProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}