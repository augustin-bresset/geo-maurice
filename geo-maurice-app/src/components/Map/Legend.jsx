import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

export const Legend = ({ gradientColors }) => {
    const { t } = useLanguage();
    const low = (gradientColors && gradientColors.low) || '#0000ff';
    const high = (gradientColors && gradientColors.high) || '#ff0000';
    return (
        <div style={{
            position: 'absolute',
            bottom: 30,
            right: 10,
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            fontSize: '12px',
            fontFamily: 'sans-serif',
            color: '#333'
        }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>
                {t('accessibility')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: low, fontWeight: 500 }}>{t('far')}</span>
                <div style={{
                    width: '120px',
                    height: '12px',
                    background: `linear-gradient(to right, ${low}, ${high})`,
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                }} />
                <span style={{ color: high, fontWeight: 500 }}>{t('near')}</span>
            </div>
            <div style={{ marginTop: '5px', fontSize: '10px', color: '#666', textAlign: 'center', fontStyle: 'italic' }}>
                {t('timeEstimate')}
            </div>
        </div>
    );
};
