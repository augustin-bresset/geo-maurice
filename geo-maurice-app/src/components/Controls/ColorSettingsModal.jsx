import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

const CATEGORY_KEYS = ['health', 'security', 'education', 'public', 'transport', 'hygiene', 'commercial', 'tourism'];

export const ColorSettingsModal = ({
  isOpen,
  onClose,
  categoryColors,
  onCategoryColorChange,
  gradientColors,
  onGradientColorChange,
  defaultCategoryColors,
  defaultGradientColors,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleResetAll = () => {
    CATEGORY_KEYS.forEach(key => onCategoryColorChange(key, defaultCategoryColors[key]));
    onGradientColorChange('low', defaultGradientColors.low);
    onGradientColorChange('high', defaultGradientColors.high);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', padding: 20, borderRadius: 8, maxWidth: 420, width: '90%',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>{t('colorSettings')}</h3>

        {/* Section 1: Category Colors */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#555', fontSize: 14 }}>{t('categoryColorsSection')}</h4>
          {CATEGORY_KEYS.map(key => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ flex: 1, fontSize: 13 }}>{t(`cat_${key}`)}</span>
              <input
                type="color"
                value={categoryColors[key]}
                onChange={(e) => onCategoryColorChange(key, e.target.value)}
                style={{ width: 36, height: 28, padding: 2, border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
              />
              <button
                onClick={() => onCategoryColorChange(key, defaultCategoryColors[key])}
                title="Reset"
                style={{
                  padding: '4px 8px', fontSize: 11, cursor: 'pointer', border: '1px solid #ccc',
                  borderRadius: 4, background: '#f5f5f5', color: '#555'
                }}
              >
                ↺
              </button>
            </div>
          ))}
        </div>

        {/* Section 2: Accessibility Gradient */}
        <div style={{ borderTop: '1px solid #eee', paddingTop: 14, marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#555', fontSize: 14 }}>{t('gradientSection')}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ flex: 1, fontSize: 13 }}>{t('gradientLow')}</span>
            <input
              type="color"
              value={gradientColors.low}
              onChange={(e) => onGradientColorChange('low', e.target.value)}
              style={{ width: 36, height: 28, padding: 2, border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ flex: 1, fontSize: 13 }}>{t('gradientHigh')}</span>
            <input
              type="color"
              value={gradientColors.high}
              onChange={(e) => onGradientColorChange('high', e.target.value)}
              style={{ width: 36, height: 28, padding: 2, border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
            />
          </div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{t('gradientPreview')}</div>
          <div style={{
            height: 16,
            background: `linear-gradient(to right, ${gradientColors.low}, ${gradientColors.high})`,
            borderRadius: 6,
            border: '1px solid #ddd'
          }} />
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <button
            onClick={handleResetAll}
            style={{
              padding: '8px 14px', background: '#e74c3c', color: 'white', border: 'none',
              borderRadius: 4, cursor: 'pointer', fontSize: 13
            }}
          >
            {t('resetAll')}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', background: '#3498db', color: 'white', border: 'none',
              borderRadius: 4, cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
