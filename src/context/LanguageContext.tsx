import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nManager, NativeModules, Alert } from 'react-native'; 
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

  // 2. Load Language with SYNC CHECK
  const loadLanguage = async () => {
    try {
      const savedLang = await SecureStore.getItemAsync('user_language');
      const currentIsRTL = I18nManager.isRTL;

      // Check A: User wants Arabic ('ar'), but App is LTR -> FIX IT
      if (savedLang === 'ar' && !currentIsRTL) {
        console.log("Syncing Layout: Forcing RTL...");
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
        await reloadApp(); // Restart immediately
        return;
      }

      // Check B: User wants English ('en'), but App is RTL -> FIX IT
      if (savedLang === 'en' && currentIsRTL) {
        console.log("Syncing Layout: Forcing LTR...");
        I18nManager.allowRTL(false);
        I18nManager.forceRTL(false);
        await reloadApp(); // Restart immediately
        return;
      }

      // Check C: All good, just set the state
      if (savedLang === 'ar' || savedLang === 'en') {
        setLanguage(savedLang);
      } else {
        // First time launch? Match device setting
        const deviceIsRTL = I18nManager.isRTL;
        setLanguage(deviceIsRTL ? 'ar' : 'en');
      }
    } catch (error) {
      console.error("Failed to load language:", error);
    }
  };

  // 3. Run on Mount
  useEffect(() => {
    loadLanguage();
  }, []);

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || key;
  };

  const changeLanguage = async (newLang: Language) => {
    if (newLang === language) return;

    const isArabic = newLang === 'ar';
    
    // Save preference
    await SecureStore.setItemAsync('user_language', newLang);
    setLanguage(newLang);

    // Update Layout Manager
    if (isArabic !== I18nManager.isRTL) {
      I18nManager.allowRTL(isArabic);
      I18nManager.forceRTL(isArabic);
      
      // Reload to apply
      await reloadApp();
    }
  };

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage, isRTL: language === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  );
};