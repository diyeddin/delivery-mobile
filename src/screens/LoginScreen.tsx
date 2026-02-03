import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import client from '../api/client';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';
import Toast from 'react-native-toast-message';

type LoginScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  // Refs for jumping between fields
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: t('login_failed'),
        text2: t('login_enter_credentials'),
      });
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
        navigation.navigate('ProfileMain');
      }
      
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || t('server_connection_error');
      Toast.show({
        type: 'error',
        text1: t('login_failed'),
        text2: msg,
      });
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
          {t('mobile_concierge')}
        </Text>
      </View>

      <View className="space-y-6">
        <View className="mb-2">
          <Text className="text-gray-400 text-xs uppercase font-bold mb-1 ms-1">{t('email')}</Text>
          <View className="h-14 flex-row items-center bg-white/10 rounded-xl px-4 border border-white/5 focus:border-gold-500">
            <Mail color="#9CA3AF" size={20} />
            <TextInput 
              className="flex-1 p-4 text-white ms-2"
              placeholder={t('email_placeholder')}
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              // Strict Single Line Props
              multiline={false} 
              numberOfLines={1}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>
        </View>

        <View className="mb-2">
          <Text className="text-gray-400 text-xs uppercase font-bold mb-1 ms-1">{t('password')}</Text>
          <View className="h-14 flex-row items-center bg-white/10 rounded-xl px-4 border border-white/5 focus:border-gold-500">
            <Lock color="#9CA3AF" size={20} />
            <TextInput 
              ref={passwordRef}
              className="flex-1 p-4 text-white ms-2"
              placeholder={t('password_placeholder')}
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              // Strict Single Line Props
              multiline={false} 
              numberOfLines={1}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleLogin}
          disabled={isSubmitting}
          className="bg-gold-500 py-4 rounded-xl shadow-lg flex-row justify-center items-center mt-4"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#0F0F0F" />
          ) : (
            <>
              <Text className="text-onyx font-bold text-lg me-2">{t('sign_in')}</Text>
              <ArrowRight color="#0F0F0F" size={20} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} className="items-center mt-4">
          <Text className="text-gray-500 text-sm">{t('cancel')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}