import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext'; // <--- Import Context
import Toast from 'react-native-toast-message';

export default function NotificationsScreen({ navigation }: any) {
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
          Toast.show({ type: 'success', text1: 'Notifications Enabled' });
        } else {
          // If user previously denied, we must send them to settings
          Alert.alert(
            "Permission Required",
            "Please enable notifications in your system settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => {
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
        "Disable Notifications",
        "To disable notifications completely, please turn them off in your device settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => {
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
          <ArrowLeft color="#0F0F0F" size={20} />
        </TouchableOpacity>
        <Text className="text-xl text-onyx font-serif">Notifications</Text>
      </View>

      <View className="p-6">
        {/* Toggle Switch */}
        <View className="flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm mb-8">
          <View className="flex-1 me-4">
            <Text className="text-onyx font-bold text-base">Push Notifications</Text>
            <Text className="text-gray-500 text-xs">
              Receive real-time updates when your order is shipped or delivered.
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
            {isEnabled ? "You are all set!" : "Notifications are off"}
          </Text>
          <Text className="text-gray-400 text-center text-xs px-10 mt-2">
            {isEnabled 
              ? "We will notify you when your order status changes." 
              : "Enable them above to track your deliveries."}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}