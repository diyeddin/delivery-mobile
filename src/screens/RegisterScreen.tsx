import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { authApi } from '../api/auth';
import { User, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types'; // Adjust if using ProfileStackParamList
import Toast from 'react-native-toast-message';

// Make sure 'Register' and 'Login' are in your ParamList in types.ts
type RegisterScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export default function RegisterScreen({ navigation }: Props) {
  const { t, isRTL } = useLanguage();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleRegister = async () => {
    // 1. Validation
    if (!name || !email || !password) {
      Toast.show({
        type: 'error',
        text1: t('error_missing_fields'), // Ensure this key exists in translations
        // text2: t('please_fill_all'),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 2. API Call
      // Adjust payload based on your backend (e.g., snake_case vs camelCase)
      const payload = {
        name: name,
        email: email,
        password: password
      };

      await authApi.signup(payload);

      // 3. Success Feedback
      Toast.show({
        type: 'success',
        text1: t('account_created'),
        text2: t('login_to_continue'),
      });

      // 4. Navigate to Login
      // Replace removes Register from stack so they can't go back
      navigation.replace('Login');

    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || t('error');
      Toast.show({
        type: 'error',
        text1: t('registration_failed'),
        text2: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-onyx">
      {/* Background Decor (Matching Login) */}
      <View className="absolute top-0 left-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="p-8">
          
          {/* Header Section */}
          <View className="mb-10">
            {/* Back Button */}
            <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                className="w-10 h-10 bg-white/10 rounded-full items-center justify-center mb-6"
            >
                <ArrowLeft size={20} color="white" style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
            </TouchableOpacity>

            <Text className="text-4xl text-white font-serif mb-2">{t('create_account')}</Text>
            <Text className="text-gold-500 text-xs font-bold uppercase tracking-[2px]">
              {t('signup_subtitle')}
            </Text>
          </View>

          {/* Form Section */}
          <View className="space-y-6">
            
            {/* 1. Name Input */}
            <View className="mb-2">
              <Text className="text-gray-400 text-xs uppercase font-bold mb-1 ms-1 text-start">
                  {t('full_name')}
              </Text>
              <View className="h-14 flex-row items-center bg-white/10 rounded-xl px-4 border border-white/5 focus:border-gold-500">
                <User color="#9CA3AF" size={20} />
                <TextInput 
                  className="flex-1 p-4 text-white ms-2 text-start"
                  placeholder={t('full_name')}
                  placeholderTextColor="#6B7280"
                  value={name}
                  onChangeText={setName}
                  style={{ writingDirection: isRTL ? 'rtl' : 'ltr' }}
                  // Strict Single Line Props
                  multiline={false}
                  numberOfLines={1}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              </View>
            </View>

            {/* 2. Email Input */}
            <View className="mb-2">
              <Text className="text-gray-400 text-xs uppercase font-bold mb-1 ms-1 text-start">
                  {t('email_label')}
              </Text>
              <View className="h-14 flex-row items-center bg-white/10 rounded-xl px-4 border border-white/5 focus:border-gold-500">
                <Mail color="#9CA3AF" size={20} />
                <TextInput 
                  ref={emailRef}
                  className="flex-1 p-4 text-white ms-2 text-start"
                  placeholder={t('email_label')}
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={{ textAlign: isRTL ? 'right' : 'left' }}
                  // Strict Single Line
                  multiline={false}
                  numberOfLines={1}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
            </View>

            {/* 3. Password Input */}
            <View className="mb-2">
              <Text className="text-gray-400 text-xs uppercase font-bold mb-1 ms-1 text-start">
                  {t('password_label')}
              </Text>
              <View className="h-14 flex-row items-center bg-white/10 rounded-xl px-4 border border-white/5 focus:border-gold-500">
                <Lock color="#9CA3AF" size={20} />
                <TextInput 
                  ref={passwordRef}
                  className="flex-1 p-4 text-white ms-2 text-start"
                  placeholder={t('password_label')}
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={{ textAlign: isRTL ? 'right' : 'left' }}
                  // Strict Single Line
                  multiline={false}
                  numberOfLines={1}
                  returnKeyType="go"
                  onSubmitEditing={handleRegister}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              onPress={handleRegister}
              disabled={isSubmitting}
              className="bg-gold-500 py-4 rounded-xl shadow-lg flex-row justify-center items-center mt-6"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#0F0F0F" />
              ) : (
                <>
                  <Text className="text-onyx font-bold text-lg me-2">{t('sign_up_btn')}</Text>
                  <ArrowRight color="#0F0F0F" size={20} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
                </>
              )}
            </TouchableOpacity>

            {/* Login Link Footer */}
            <View className="flex-row justify-center mt-4">
              <Text className="text-gray-500">{t('already_have_account')} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text className="text-gold-500 font-bold ms-1">{t('login')}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}