import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'mc', label: 'MC' },
];

export function LanguageSelector() {
  const { lang, switchLang } = useLanguage();

  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => switchLang(code)}
          style={{
            padding: '2px 6px',
            fontSize: 11,
            fontWeight: lang === code ? 'bold' : 'normal',
            cursor: 'pointer',
            borderRadius: 3,
            border: lang === code ? '1.5px solid #3498db' : '1px solid #ccc',
            background: lang === code ? '#3498db' : '#f8f9fa',
            color: lang === code ? 'white' : '#555',
            lineHeight: 1.4,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
