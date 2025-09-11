import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import language files
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';
import pt from './locales/pt.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import it from './locales/it.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  zh: { translation: zh },
  ar: { translation: ar },
  pt: { translation: pt },
  ja: { translation: ja },
  ko: { translation: ko },
  it: { translation: it },
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // This prevents suspense mode which can cause issues with RN
    },
    // ✅ ENHANCED: Add missing key handler
    saveMissing: false,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.warn(`🌐 Missing translation key: ${key} (${lng})`);
      return fallbackValue || key;
    },
  })
  .then(() => {
    // ✅ ENHANCED: Override translation function with ultra-safe wrapper
    const originalT = i18n.t.bind(i18n);
    i18n.t = function(key, options) {
      try {
        if (!key || typeof key !== 'string') {
          console.warn(`Invalid translation key:`, key);
          return String(key || '');
        }
        
        // Handle the problematic 'th' key specifically
        if (key === 'th' || key.endsWith('.th')) {
          console.warn(`Intercepted problematic 'th' key: ${key}`);
          return 'th'; // Safe fallback
        }
        
        const result = originalT(key, options);
        return result || key;
      } catch (error) {
        console.error(`🚨 Translation function error for "${key}":`, error);
        return String(key || '');
      }
    };
    
    console.log('✅ i18n initialized with enhanced safety');
  })
  .catch(error => {
    console.error('❌ i18n initialization failed:', error);
  });

// Export a function to change language dynamically
export const changeLanguage = (languageCode) => {
  return i18n.changeLanguage(languageCode);
};

// Export available languages
export const availableLanguages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
];

// ✅ ENHANCED: Safe translation wrapper to prevent property errors
export const safeTranslate = (key, fallback = key) => {
  try {
    if (!i18n || typeof i18n.t !== 'function') {
      console.warn(`Translation function not available for key: ${key}`);
      return fallback;
    }
    
    const result = i18n.t(key);
    
    // If translation key doesn't exist, i18n returns the key itself
    if (result === key && !fallback.includes(key)) {
      console.warn(`Translation key not found: ${key}`);
      return fallback;
    }
    
    return result || fallback;
  } catch (error) {
    console.error(`Translation error for key "${key}":`, error);
    return fallback;
  }
};

export default i18n;
