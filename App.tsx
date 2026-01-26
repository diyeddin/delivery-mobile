import './global.css';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import { useFonts, PlayfairDisplay_400Regular, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';

// 1. The Component that decides which screen to show
function RootNavigator() {
  const { user, logout } = useAuth();

  // A. Authenticated View (Temporary Home Screen)
  if (user) {
    return (
      <SafeAreaView className="flex-1 bg-creme items-center justify-center">
        <Text className="text-3xl font-serif text-onyx mb-4">Welcome Back,</Text>
        <Text className="text-xl text-gold-600 font-bold mb-8">{user.sub}</Text>
        
        <TouchableOpacity 
          onPress={logout}
          className="bg-onyx px-8 py-3 rounded-full"
        >
          <Text className="text-white font-bold">Log Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // B. Guest View
  return <LoginScreen />;
}

// 2. The Main App Entry
export default function App() {
  let [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    // Wrap the entire app in the Auth Provider
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}