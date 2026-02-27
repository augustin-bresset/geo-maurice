import React, { createContext, useContext, useState } from 'react';
import translations from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('geo_maurice_lang') || 'en';
  });

  const switchLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('geo_maurice_lang', newLang);
  };

  const t = (key) => {
    const val = translations[lang]?.[key] ?? translations['en']?.[key] ?? key;
    return val;
  };

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
