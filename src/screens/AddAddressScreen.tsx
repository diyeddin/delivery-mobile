import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save, CheckCircle, MapPin, Crosshair } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';
import { addressesApi } from '../api/addresses';
import Toast from 'react-native-toast-message';
import { useLanguage } from '../context/LanguageContext';
import { handleApiError } from '../utils/handleApiError';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

type Props = NativeStackScreenProps<ProfileStackParamList, 'AddAddress'>;

const DEFAULT_COORDS = { latitude: 33.5138, longitude: 36.2765 }; // Damascus fallback

export default function AddAddressScreen({ navigation, route }: Props) {
  const { t, isRTL } = useLanguage();
  // 1. Check for incoming address to edit
  const addressToEdit = route.params?.addressToEdit;
  const isEditing = !!addressToEdit;

  // 2. Initialize State (Pre-fill if editing, else defaults)
  const [label, setLabel] = useState(addressToEdit?.label || t('home'));
  const [addressLine, setAddressLine] = useState(addressToEdit?.address_line || '');
  const [instructions, setInstructions] = useState(addressToEdit?.instructions || '');
  const [isDefault, setIsDefault] = useState(addressToEdit?.is_default || false);
  const [latitude, setLatitude] = useState<number | undefined>(addressToEdit?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(addressToEdit?.longitude);

  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [customLabel, setCustomLabel] = useState(''); // Handle custom typing for label
  const mapRef = useRef<MapView>(null);

  // Sync custom label if the initial label isn't one of the presets
  useEffect(() => {
    if (isEditing && !['Home', 'Work', 'Other'].includes(addressToEdit.label)) {
        setLabel('Other');
        setCustomLabel(addressToEdit.label);
    }
  }, [isEditing]);

  // Get user's current location on mount (if not editing with existing coords)
  useEffect(() => {
    if (latitude && longitude) return;
    (async () => {
      setLocLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLatitude(DEFAULT_COORDS.latitude);
          setLongitude(DEFAULT_COORDS.longitude);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLatitude(loc.coords.latitude);
        setLongitude(loc.coords.longitude);
        mapRef.current?.animateToRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 500);
      } catch {
        setLatitude(DEFAULT_COORDS.latitude);
        setLongitude(DEFAULT_COORDS.longitude);
      } finally {
        setLocLoading(false);
      }
    })();
  }, []);

  const handleRecenter = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 500);
    } catch {
      // ignore
    } finally {
      setLocLoading(false);
    }
  };

  const handleMapPress = (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleSave = async () => {
    if (!addressLine.trim()) {
      Toast.show({ type: 'error', text1: t('address_required'), text2: t('enter_valid_address') });
      return;
    }

    setLoading(true);
    try {
      // Determine final label (Preset vs Custom)
      const finalLabel = (label === 'Other' && customLabel.trim()) ? customLabel : label;

      const payload = {
        label: finalLabel,
        address_line: addressLine,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        instructions: instructions || null,
        is_default: isDefault,
      };

      if (isEditing) {
        // --- EDIT MODE (PATCH) ---
        await addressesApi.update(addressToEdit.id, payload);
        Toast.show({ type: 'success', text1: t('address_updated') });
      } else {
        // --- CREATE MODE (POST) ---
        await addressesApi.create(payload);
        Toast.show({ type: 'success', text1: t('address_saved') });
      }

      navigation.goBack();

    } catch (error: unknown) {
      const msg = handleApiError(error, { fallbackTitle: t('error'), fallbackMessage: t('failed_to_save_address'), showToast: false });
      Toast.show({ type: 'error', text1: t('error'), text2: msg });
    } finally {
      setLoading(false);
    }
  };

  const markerCoord = latitude && longitude ? { latitude, longitude } : null;

  return (
    <SafeAreaView className="flex-1 bg-creme" edges={['top']}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-onyx/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-onyx/5 rounded-full me-4">
          <ArrowLeft color="#0F0F0F" size={20} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>
        <Text className="text-xl text-onyx font-serif">
          {isEditing ? t('edit_address') : t('add_new_address')}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="p-6">

          {/* Map Picker */}
          <View className="mb-6">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">{t('pin_location' as any) || 'Pin Location'}</Text>
            <View className="h-52 rounded-xl overflow-hidden border border-gray-200 relative">
              {locLoading && !markerCoord ? (
                <View className="flex-1 items-center justify-center bg-gray-100">
                  <ActivityIndicator size="small" color="#D4AF37" />
                </View>
              ) : (
                <MapView
                  ref={mapRef}
                  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                  style={{ width: '100%', height: '100%' }}
                  initialRegion={{
                    latitude: latitude || DEFAULT_COORDS.latitude,
                    longitude: longitude || DEFAULT_COORDS.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  onPress={handleMapPress}
                >
                  {markerCoord && (
                    <Marker
                      coordinate={markerCoord}
                      draggable
                      onDragEnd={(e) => handleMapPress(e)}
                    >
                      <View className="bg-onyx p-2 rounded-full border-2 border-white shadow-sm">
                        <MapPin size={16} color="#D4AF37" />
                      </View>
                    </Marker>
                  )}
                </MapView>
              )}

              {/* Recenter Button */}
              <TouchableOpacity
                onPress={handleRecenter}
                className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md border border-gray-100"
              >
                {locLoading ? (
                  <ActivityIndicator size={16} color="#0F0F0F" />
                ) : (
                  <Crosshair size={16} color="#0F0F0F" />
                )}
              </TouchableOpacity>
            </View>
            <Text className="text-gray-400 text-xs mt-1">{t('tap_map_hint' as any) || 'Tap or drag pin to set delivery location'}</Text>
          </View>

          {/* Label Field */}
          <View className="mb-6">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">{t('label')}</Text>
            <View className="flex-row gap-3 mb-3">
              {['Home', 'Work', 'Other'].map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => setLabel(tag)}
                  className={`px-4 py-2 rounded-full border ${
                    label === tag ? 'bg-onyx border-onyx' : 'bg-white border-gray-200'
                  }`}
                >
                  <Text className={label === tag ? 'text-white font-bold' : 'text-gray-500'}>{t(tag.toLowerCase() as any)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Label Input (Only shows if 'Other' is selected) */}
            {label === 'Other' && (
               <TextInput
                 className="bg-white p-4 rounded-xl border border-gray-200 text-onyx text-base"
                 placeholder={t('custom_label_placeholder')}
                 value={customLabel}
                 onChangeText={setCustomLabel}
               />
            )}
          </View>

          {/* Address Input */}
          <View className="mb-6">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">{t('full_address')}</Text>
            <TextInput
              className="bg-white p-4 rounded-xl border border-gray-100 text-onyx h-24 text-base"
              placeholder={t('address_placeholder')}
              multiline
              textAlignVertical="top"
              value={addressLine}
              onChangeText={setAddressLine}
            />
          </View>

          {/* Instructions Input */}
          <View className="mb-6">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">{t('delivery_instructions_optional')}</Text>
            <TextInput
              className="bg-white p-4 rounded-xl border border-gray-100 text-onyx text-base h-20"
              placeholder={t('delivery_instructions_example')}
              multiline
              textAlignVertical="top"
              value={instructions}
              onChangeText={setInstructions}
            />
          </View>

          {/* Default Switch */}
          <View className="flex-row items-center justify-between bg-white p-4 rounded-xl border border-gray-100 mb-8">
            <Text className="text-onyx font-bold text-base">{t('set_as_default')}</Text>
            <Switch
              trackColor={{ false: "#E5E7EB", true: "#D4AF37" }}
              thumbColor={isDefault ? "#FFFFFF" : "#f4f3f4"}
              onValueChange={setIsDefault}
              value={isDefault}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className="bg-onyx py-4 rounded-xl flex-row items-center justify-center shadow-lg mb-10"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                {isEditing ? (
                    <CheckCircle color="white" size={20} className="me-2" />
                ) : (
                    <Save color="white" size={20} className="me-2" />
                )}
                <Text className="text-white font-bold text-lg ms-2">
                    {isEditing ? t('update_address') : t('save_address')}
                </Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
