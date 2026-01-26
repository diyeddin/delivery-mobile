import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';

type LoginScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Prepare Form Data
      const body = `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;

      // 2. Send Request
      const res = await client.post('/auth/login', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      // 3. Login using Context
      await login(res.data.access_token);

      // 4. Close Modal on Success
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('MainTabs'); 
      }
      
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || "Could not connect to server.";
      Alert.alert("Login Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-onyx justify-center p-8">
      <View className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl" />
      
      <View className="mb-12">
        <Text className="text-4xl text-white font-serif mb-2">Golden Rose</Text>
        <Text className="text-gold-500 text-xs font-bold uppercase tracking-[4px]">
          Mobile Concierge
        </Text>
      </View>

      <View className="space-y-6">
        <View>
          <Text className="text-gray-400 text-xs uppercase font-bold mb-2 ml-1">Email</Text>
          <View className="flex-row items-center bg-white/10 rounded-xl px-4 border border-white/5 focus:border-gold-500">
            <Mail color="#9CA3AF" size={20} />
            <TextInput 
              className="flex-1 p-4 text-white ml-2"
              placeholder="you@example.com"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View>
          <Text className="text-gray-400 text-xs uppercase font-bold mb-2 ml-1">Password</Text>
          <View className="flex-row items-center bg-white/10 rounded-xl px-4 border border-white/5 focus:border-gold-500">
            <Lock color="#9CA3AF" size={20} />
            <TextInput 
              className="flex-1 p-4 text-white ml-2"
              placeholder="••••••••"
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleLogin}
          disabled={isSubmitting}
          className="bg-gold-500 py-4 rounded-xl shadow-lg shadow-gold-500/20 flex-row justify-center items-center mt-4"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#0F0F0F" />
          ) : (
            <>
              <Text className="text-onyx font-bold text-lg mr-2">Sign In</Text>
              <ArrowRight color="#0F0F0F" size={20} />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} className="items-center mt-4">
          <Text className="text-gray-500 text-sm">Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}