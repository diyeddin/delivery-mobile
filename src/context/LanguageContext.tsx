import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nManager, NativeModules, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import * as Localization from 'expo-localization';
import { translations, Language, LanguagePreference } from '../i18n/translations';

type LanguageContextType = {
  language: Language;
  preference: LanguagePreference;
  deviceLanguage: Language;
  t: (key: keyof typeof translations['en']) => string;
  changeLanguage: (pref: LanguagePreference) => Promise<void>;
  isRTL: boolean;
  isAutoMode: boolean;
};

const LanguageContext = createContext<LanguageContextType>({} as any);

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [preference, setPreference] = useState<LanguagePreference>('auto');
  const [deviceLanguage, setDeviceLanguage] = useState<Language>('en');

  // Detect device language
  const detectDeviceLanguage = (): Language => {
    const locales = Localization.getLocales();
    const primaryLocale = locales[0];
    const langCode = primaryLocale?.languageCode;

    // Check if it's Arabic
    if (langCode === 'ar') {
      return 'ar';
    }

    // Default to English for all other languages
    return 'en';
  };

  // 1. Define Reload Function FIRST so it can be used by loadLanguage
  const reloadApp = async () => {
    try {
      // Try Expo Updates (Production)
      await Updates.reloadAsync();
    } catch (error) {
      console.log("Expo Updates reload failed, trying DevSettings...");
      // Try Native DevSettings (Development)
      if (NativeModules.DevSettings) {
        NativeModules.DevSettings.reload();
      } else {
        Alert.alert(
          "Restart Required", 
          "Please close and reopen the app to apply the language change."
        );
      }
    }
  };

  // 2. Load Language with SYNC CHECK and MIGRATION
  const loadLanguage = async () => {
    try {
      // Step 1: Detect device language
      const deviceLang = detectDeviceLanguage();
      setDeviceLanguage(deviceLang);

      // Step 2: Migration - Check old key first
      const oldSavedLang = await SecureStore.getItemAsync('user_language');
      let savedPreference = await SecureStore.getItemAsync('user_language_preference');

      if (!savedPreference && oldSavedLang) {
        // Migrate: old 'en'/'ar' becomes manual preference
        savedPreference = oldSavedLang as LanguagePreference;
        await SecureStore.setItemAsync('user_language_preference', savedPreference);
        await SecureStore.deleteItemAsync('user_language');
      }

      // Step 3: Determine preference
      let finalPreference: LanguagePreference;
      if (!savedPreference) {
        // First launch: Default to 'auto'
        finalPreference = 'auto';
        await SecureStore.setItemAsync('user_language_preference', 'auto');
      } else {
        finalPreference = savedPreference as LanguagePreference;
      }

      // Step 4: Resolve active language
      const activeLang = finalPreference === 'auto' ? deviceLang : finalPreference as Language;

      // Step 5: Sync RTL/LTR with I18nManager
      const currentIsRTL = I18nManager.isRTL;
      const shouldBeRTL = activeLang === 'ar';

      if (shouldBeRTL !== currentIsRTL) {
        I18nManager.allowRTL(shouldBeRTL);
        I18nManager.forceRTL(shouldBeRTL);
        await reloadApp();
        return;
      }

      // Step 6: Set state
      setPreference(finalPreference);
      setLanguage(activeLang);

    } catch (error) {
      console.error("Failed to load language:", error);
      setDeviceLanguage('en');
      setLanguage('en');
      setPreference('en');
    }
  };

  // 3. Run on Mount
  useEffect(() => {
    loadLanguage();
  }, []);

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || key;
  };

  const changeLanguage = async (newPref: LanguagePreference) => {
    if (newPref === preference) return;

    // Resolve what language we'll actually use
    const newActiveLang = newPref === 'auto' ? deviceLanguage : newPref as Language;

    // Save preference
    await SecureStore.setItemAsync('user_language_preference', newPref);
    setPreference(newPref);
    setLanguage(newActiveLang);

    // Update RTL layout if needed
    const shouldBeRTL = newActiveLang === 'ar';
    if (shouldBeRTL !== I18nManager.isRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
      await reloadApp();
    }
  };

  return (
    <LanguageContext.Provider value={{
      language,
      preference,
      deviceLanguage,
      t,
      changeLanguage,
      isRTL: language === 'ar',
      isAutoMode: preference === 'auto'
    }}>
      {children}
    </LanguageContext.Provider>
  );
};