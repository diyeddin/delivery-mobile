import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nManager, NativeModules, Platform, Alert } from 'react-native'; // <--- Import NativeModules & Alert
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import { translations, Language } from '../i18n/translations';

type LanguageContextType = {
  language: Language;
  t: (key: keyof typeof translations['en']) => string;
  changeLanguage: (lang: Language) => Promise<void>;
  isRTL: boolean;
};

const LanguageContext = createContext<LanguageContextType>({} as any);

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    const savedLang = await SecureStore.getItemAsync('user_language');
    if (savedLang === 'ar' || savedLang === 'en') {
      setLanguage(savedLang);
    } else {
      const isRTL = I18nManager.isRTL;
      setLanguage(isRTL ? 'ar' : 'en');
    }
  };

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || key;
  };

  // 👇 ROBUST RELOAD FUNCTION
  const reloadApp = async () => {
    try {
      // 1. Try Expo Updates (Works in Production builds)
      await Updates.reloadAsync();
    } catch (error) {
      console.log("Expo Updates reload failed, trying DevSettings...");
      
      // 2. Fallback: Try Native DevSettings (Works in Simulator/Development)
      if (NativeModules.DevSettings) {
        NativeModules.DevSettings.reload();
      } else {
        // 3. Last Resort: Tell user to restart
        Alert.alert(
          "Restart Required", 
          "Please close and reopen the app to apply the language change."
        );
      }
    }
  };

  const changeLanguage = async (newLang: Language) => {
    if (newLang === language) return;

    const isArabic = newLang === 'ar';
    
    // 1. Save Preference
    await SecureStore.setItemAsync('user_language', newLang);
    setLanguage(newLang);

    // 2. Handle RTL Layout
    if (isArabic !== I18nManager.isRTL) {
      I18nManager.allowRTL(isArabic);
      I18nManager.forceRTL(isArabic);
      
      // 3. Trigger Reload
      await reloadApp();
    }
  };

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage, isRTL: language === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  );
};