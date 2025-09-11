import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { changeLanguage, availableLanguages } from '../i18n';
import { auth } from '../firebaseConfig';
import logger from '../utils/logger';


const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    const { i18n } = useTranslation();
    const [currentLanguage, setCurrentLanguage] = useState(availableLanguages[0]); // Default to English
    const [isLoading, setIsLoading] = useState(true);

    // Load saved language preference on app start
    useEffect(() => {
        loadSavedLanguage();
    }, []);

    // Load saved language from AsyncStorage
    const loadSavedLanguage = async () => {
        try {
            const user = auth.currentUser;
            let savedLanguageCode;

            if (user) {
                // Try to load user-specific language preference
                savedLanguageCode = await AsyncStorage.getItem(`selectedLanguage_${user.uid}`);
            }

            if (!savedLanguageCode) {
                // Fallback to global language preference
                savedLanguageCode = await AsyncStorage.getItem('selectedLanguage');
            }

            if (savedLanguageCode) {
                const savedLanguage = availableLanguages.find(lang => lang.code === savedLanguageCode);
                if (savedLanguage) {
                    await setLanguage(savedLanguage, false); // Don't save again to avoid loop
                    logger.info('📱 Loaded saved language:', savedLanguage.label);
                }
            }
        } catch (error) {
            logger.error('Error loading saved language:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Set language and save preference
    const setLanguage = async (language, shouldSave = true) => {
        try {
            setCurrentLanguage(language);
            await changeLanguage(language.code);
            
            if (shouldSave) {
                await saveLanguagePreference(language);
            }
            
            logger.info('🌍 Language changed to:', language.label);
        } catch (error) {
            logger.error('Error changing language:', error);
        }
    };

    // Save language preference to AsyncStorage
    const saveLanguagePreference = async (language) => {
        try {
            const user = auth.currentUser;
            
            if (user) {
                // Save user-specific language preference
                await AsyncStorage.setItem(`selectedLanguage_${user.uid}`, language.code);
            }
            
            // Also save global preference as fallback
            await AsyncStorage.setItem('selectedLanguage', language.code);
            
            logger.info('💾 Language preference saved:', language.label);
        } catch (error) {
            logger.error('Error saving language preference:', error);
        }
    };

    // Get language by code
    const getLanguageByCode = (code) => {
        return availableLanguages.find(lang => lang.code === code) || availableLanguages[0];
    };

    // Get current language flag and label
    const getCurrentLanguageInfo = () => {
        return {
            code: currentLanguage.code,
            label: currentLanguage.label,
            flag: currentLanguage.flag,
            isRTL: currentLanguage.code === 'ar' // Add RTL support for Arabic
        };
    };

    // Check if language is RTL (Right-to-Left)
    const isRTL = currentLanguage.code === 'ar';

    const contextValue = {
        currentLanguage,
        availableLanguages,
        setLanguage,
        getLanguageByCode,
        getCurrentLanguageInfo,
        isLoading,
        isRTL,
        // Convenience methods
        t: (key, options) => { // Safe wrapper for translation function
            try {
                if (!i18n || typeof i18n.t !== 'function') {
                    logger.warn(`Translation not ready for key: ${key}`);
                    return key;
                }
                return i18n.t(key, options) || key;
            } catch (error) {
                logger.error(`Translation error for "${key}":`, error);
                return key;
            }
        },
        ready: i18n.isReady, // Check if i18n is ready
    };

    return (
        <LanguageContext.Provider value={contextValue}>
            {children}
        </LanguageContext.Provider>
    );
};