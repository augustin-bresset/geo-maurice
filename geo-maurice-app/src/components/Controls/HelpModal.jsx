import React, { useState } from 'react';
import { HelpCircle, X, ChevronDown, ChevronRight } from 'lucide-react';

const helpSections = [
    {
        id: 'reading',
        title: '🗺️ Lecture de la carte',
        content: `La carte affiche un score d'accessibilité pour chaque zone de l'île Maurice.

**Couleurs :**
- 🔴 **Rouge** = Zone très accessible (proche des services)
- 🟡 **Jaune/Vert** = Accessibilité moyenne
- 🔵 **Bleu** = Zone peu accessible (éloignée des services)

Plus une zone est rouge, plus elle est proche des commodités sélectionnées.`
    },
    {
        id: 'modes',
        title: '📊 Modes d\'affichage',
        content: `**Accessibilité** : Affiche le score basé sur la proximité aux commodités.

**Population** : Affiche la densité de population.

**Combinaison** : Combine accessibilité et densité. L'opacité varie selon la population (zones peuplées plus visibles).`
    },
    {
        id: 'functions',
        title: '📈 Fonctions de score',
        content: `**Linéaire** : Le score décroît uniformément de 1 (à distance 0) à 0 (à la portée définie).
Formule : Score = 1 - distance/portée

**Exponentielle** : Décroissance progressive. Le score est proche de 0 à la distance de référence.
Formule : Score = exp(-distance/distRef)

**Constante** : Score = 1 partout dans la portée (binaire).`
    },
    {
        id: 'range',
        title: '📏 Portée (km)',
        content: `La portée définit la distance maximale d'influence d'une commodité.

Exemple : Une école avec portée de 5 km contribuera au score de toutes les zones dans un rayon de 5 km.

Chaque type de commodité peut avoir sa propre portée, ajustable via les sliders.`
    },
    {
        id: 'tortuosity',
        title: '🛤️ Tortuosité',
        content: `Ce facteur simule le fait que les routes ne sont pas en ligne droite.

- **1.0** = Vol d'oiseau (distance euclidienne)
- **1.3** = Route typique (+30% de distance)
- **1.5+** = Terrain montagneux ou routes sinueuses

La tortuosité augmente artificiellement les distances calculées.`
    },
    {
        id: 'profiles',
        title: '👤 Profils',
        content: `Les profils sont des configurations pré-définies :

- **Standard** : Aucune sélection
- **Famille** : Focus sur écoles et santé
- **Tourisme** : Plages, restaurants, transports
- **Seniors** : Santé et services publics

Vous pouvez créer et sauvegarder vos propres profils.`
    }
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
    const [openSections, setOpenSections] = useState({ reading: true });

    const toggleSection = (id) => {
        setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (!isOpen) return null;

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
                        <HelpCircle size={20} /> Aide - Maurice Map
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
                    Projet RSE - Accessibilité à Maurice 🇲🇺
                </div>
            </div>
        </div>
    );
}

export function HelpButton({ onClick }) {
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
            title="Aide"
        >
            <HelpCircle size={20} color="#3498db" />
        </button>
    );
}
