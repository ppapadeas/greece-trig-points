import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslations from './locales/en.json';
import elTranslations from './locales/el.json';

i18n
  // Detect user's browser language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    debug: true, // Set to false in production
    fallbackLng: 'el', // Use Greek if the detected language is not available
    interpolation: {
      escapeValue: false, // React already protects from XSS
    },
    resources: {
      en: {
        translation: enTranslations
      },
      el: {
        translation: elTranslations
      }
    }
  });

export default i18n;