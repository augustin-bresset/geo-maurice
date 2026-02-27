import React, { useState } from 'react';
import { HelpCircle, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const getHelpSections = (t) => [
    {
        id: 'reading',
        title: t('helpReading_title'),
        content: t('helpReading_content'),
    },
    {
        id: 'modes',
        title: t('helpModes_title'),
        content: t('helpModes_content'),
    },
    {
        id: 'functions',
        title: t('helpFunctions_title'),
        content: t('helpFunctions_content'),
    },
    {
        id: 'range',
        title: t('helpRange_title'),
        content: t('helpRange_content'),
    },
    {
        id: 'tortuosity',
        title: t('helpTortuosity_title'),
        content: t('helpTortuosity_content'),
    },
    {
        id: 'profiles',
        title: t('helpProfiles_title'),
        content: t('helpProfiles_content'),
    },
];

const HelpSection = ({ section, isOpen, onToggle }) => (
    <div style={{ borderBottom: '1px solid #eee' }}>
        <button
            onClick={onToggle}
            style={{
                width: '100%',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: isOpen ? '#f0f8ff' : 'white',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 14,
                fontWeight: 600,
                color: '#333'
            }}
        >
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {section.title}
        </button>
        {isOpen && (
            <div style={{
                padding: '12px 16px 16px 40px',
                fontSize: 13,
                lineHeight: 1.6,
                color: '#444',
                whiteSpace: 'pre-line'
            }}>
                {section.content.split('\n').map((line, i) => {
                    // Simple markdown-like parsing for bold
                    const parts = line.split(/\*\*(.*?)\*\*/g);
                    return (
                        <p key={i} style={{ margin: '4px 0' }}>
                            {parts.map((part, j) =>
                                j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                            )}
                        </p>
                    );
                })}
            </div>
        )}
    </div>
);

export function HelpModal({ isOpen, onClose }) {
    const { t } = useLanguage();
    const [openSections, setOpenSections] = useState({ reading: true });

    const toggleSection = (id) => {
        setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (!isOpen) return null;

    const helpSections = getHelpSections(t);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                background: 'white',
                borderRadius: 12,
                maxWidth: 550,
                width: '95%',
                maxHeight: '80vh',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#3498db',
                    color: 'white'
                }}>
                    <h2 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <HelpCircle size={20} /> {t('helpTitle')}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 6,
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <X size={20} color="white" />
                    </button>
                </div>

                {/* Content */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {helpSections.map(section => (
                        <HelpSection
                            key={section.id}
                            section={section}
                            isOpen={!!openSections[section.id]}
                            onToggle={() => toggleSection(section.id)}
                        />
                    ))}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 20px',
                    borderTop: '1px solid #eee',
                    background: '#f9f9f9',
                    fontSize: 11,
                    color: '#888',
                    textAlign: 'center'
                }}>
                    {t('helpFooter')}
                </div>
            </div>
        </div>
    );
}

export function HelpButton({ onClick }) {
    const { t } = useLanguage();
    return (
        <button
            onClick={onClick}
            style={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 1000,
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
            }}
            title={t('help')}
        >
            <HelpCircle size={20} color="#3498db" />
        </button>
    );
}
