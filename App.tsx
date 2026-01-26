import './global.css';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CartScreen from './src/screens/CartScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import StoreDetailsScreen from './src/screens/StoreDetailsScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';

import { HomeStackParamList, ProfileStackParamList } from './src/types';
import { useFonts, PlayfairDisplay_400Regular, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Home, ShoppingBag, User } from 'lucide-react-native';
import { CartProvider, useCart } from './src/context/CartContext';
import CheckoutScreen from './src/screens/CheckoutScreen';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import OrdersScreen from './src/screens/OrdersScreen';
import AddressesScreen from './src/screens/AddressesScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import AddAddressScreen from './src/screens/AddAddressScreen';

// 1. Create the Stack Navigators
const RootStack = createNativeStackNavigator<HomeStackParamList>();
const Stack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator();

// 2. Define the Home Stack (Home -> Store -> Product)
function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="StoreDetails" component={StoreDetailsScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
    </Stack.Navigator>
  );
}

// 3. Define the Profile Stack (Profile Menu -> Orders, Addresses, etc.)
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {/* The Menu Screen */}
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      
      {/* The Detail Screens */}
      <ProfileStack.Screen name="Orders" component={OrdersScreen} />
      <ProfileStack.Screen name="Addresses" component={AddressesScreen} />
      <ProfileStack.Screen name="AddAddress" component={AddAddressScreen} />
      <ProfileStack.Screen name="Privacy" component={PrivacyScreen} />
      {/* Add Payments/Notifications here when ready */}
      <ProfileStack.Screen name="Payments" component={PaymentsScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
    </ProfileStack.Navigator>
  );
}

// 4. Define the Main Tabs
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
        options={{
          tabBarIcon: ({ color }) => <Home color={color} size={24} />
        }}
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
        name="ProfileTab" // Use the name from MainTabParamList
        component={ProfileStackNavigator} // Point to the Stack, not the Screen
        options={{
          tabBarIcon: ({ color }) => <User color={color} size={24} />
        }}
      />
    </Tab.Navigator>
  );
}

const LuxuryTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F5F5F0',
  },
};

// 4. The Root Navigator (Handles Guest Mode & Modals)
function RootNavigator() {
  const { isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <NavigationContainer theme={LuxuryTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {/* The Main App is ALWAYS accessible, even for guests */}
        <RootStack.Screen name="MainTabs" component={AppTabs} />

        {/* Login is a modal screen you can navigate TO */}
        <RootStack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            presentation: 'modal', // Slides up from bottom
            animation: 'fade'
          }}
        />
        <RootStack.Screen // move to cartStack later
          name="Checkout"
          component={CheckoutScreen}
          options={{
            presentation: 'modal',
            animation: 'fade',
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// DEFINE TOAST THEME (Onyx & Gold)
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#D4AF37', backgroundColor: '#0F0F0F' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: '#D4AF37' // Gold Title
      }}
      text2Style={{
        fontSize: 14,
        color: '#F5F5F0' // Creme Text
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#EF4444', backgroundColor: '#0F0F0F' }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: '#EF4444' // Red Title
      }}
      text2Style={{
        fontSize: 14,
        color: '#F5F5F0'
      }}
    />
  )
};

export default function App() {
  let [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <RootNavigator />
        <Toast config={toastConfig} />
      </CartProvider>
    </AuthProvider>
  );
}