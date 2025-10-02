import { useLanguage } from "@/context/LanguageContext";
import hiTranslations from "@/translations/hi.json";
import enTranslations from "@/translations/en.json";

const translations = {
  hi: hiTranslations,
  en: enTranslations,
};

export const useTranslation = () => {
  const { currentLang } = useLanguage();

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[currentLang];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return value || key;
  };

  return { t, currentLang };
};
