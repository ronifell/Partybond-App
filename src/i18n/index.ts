import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import pt from './locales/pt.json';

const fallback = 'en';

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? fallback;
const initialLng = ['en', 'pt'].includes(deviceLocale) ? deviceLocale : fallback;

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pt: { translation: pt },
  },
  lng: initialLng,
  fallbackLng: fallback,
  compatibilityJSON: 'v3',
  interpolation: { escapeValue: false },
});

export default i18n;
