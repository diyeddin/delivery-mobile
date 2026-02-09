import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext'; // <--- Import Context
import Toast from 'react-native-toast-message';
import { useLanguage } from '../context/LanguageContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';

export default function NotificationsScreen({ navigation }: { navigation: NativeStackNavigationProp<ProfileStackParamList> }) {
  const { t, isRTL } = useLanguage();
  const [isEnabled, setIsEnabled] = useState(false);
  const { registerPushToken } = useAuth(); // <--- Use the function we just made

  // Check initial permission status
  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setIsEnabled(status === 'granted');
  };

  const toggleSwitch = async () => {
    // If turning ON
    if (!isEnabled) {
      try {
        await registerPushToken();
        // Check again if it worked
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'granted') {
          setIsEnabled(true);
          Toast.show({ type: 'success', text1: t('notifications_enabled') });
        } else {
          // If user previously denied, we must send them to settings
          Alert.alert(
            t('permission_required'),
            t('enable_notifications_settings'),
            [
              { text: t('cancel'), style: "cancel" },
              { text: t('open_settings'), onPress: () => {
                 if (Platform.OS === 'ios') Linking.openURL('app-settings:');
                 else Linking.openSettings();
              }}
            ]
          );
        }
      } catch (e) {
        console.error(e);
      }
    } 
    // If turning OFF
    else {
      // Note: We cannot programmatically "revoke" permission in iOS/Android.
      // We can only stop sending tokens or tell user to go to settings.
      Alert.alert(
        t('disable_notifications'),
        t('disable_notifications_message'),
        [
          { text: t('cancel'), style: "cancel" },
          { text: t('open_settings'), onPress: () => {
             if (Platform.OS === 'ios') Linking.openURL('app-settings:');
             else Linking.openSettings();
          }}
        ]
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-onyx/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-onyx/5 rounded-full me-4">
          <ArrowLeft color="#0F0F0F" size={20} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>
        <Text className="text-xl text-onyx font-serif">{t('notifications')}</Text>
      </View>

      <View className="p-6">
        {/* Toggle Switch */}
        <View className="flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm mb-8">
          <View className="flex-1 me-4">
            <Text className="text-onyx font-bold text-base">{t('push_notifications')}</Text>
            <Text className="text-gray-500 text-xs">
              {t('push_notifications_desc')}
            </Text>
          </View>
          <Switch 
            trackColor={{ false: "#E5E7EB", true: "#D4AF37" }}
            thumbColor={isEnabled ? "#FFFFFF" : "#f4f3f4"}
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        </View>

        {/* Status Indicator */}
        <View className="items-center justify-center mt-10 opacity-50">
          <Bell size={64} color={isEnabled ? "#D4AF37" : "#9CA3AF"} />
          <Text className="text-gray-400 mt-4 text-center font-medium">
            {isEnabled ? t('notifications_all_set') : t('notifications_off')}
          </Text>
          <Text className="text-gray-400 text-center text-xs px-10 mt-2">
            {isEnabled 
              ? t('notifications_on_desc') 
              : t('notifications_off_desc')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}