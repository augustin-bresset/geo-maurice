import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';

export function SaveProfileModal({ isOpen, onClose, onSave, currentConfig, currentHeatmapSettings }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [includeAmenities, setIncludeAmenities] = useState(true);
    const [includeHeatmap, setIncludeHeatmap] = useState(true);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setName('');
            setDescription('');
            setIncludeAmenities(true);
            setIncludeHeatmap(true);
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!name.trim()) {
            alert("Veuillez entrer un nom pour le profil.");
            return;
        }

        const profileData = {
            name,
            description,
            amenities: includeAmenities ? currentConfig : null, // If null, base config will be used on load
            heatmapSettings: includeHeatmap ? currentHeatmapSettings : null,
            includeAmenities,
            includeHeatmap
        };

        onSave(profileData);
        onClose();
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
                borderRadius: 8,
                maxWidth: 450,
                width: '90%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#2ecc71',
                    color: 'white'
                }}>
                    <h2 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Save size={20} /> Sauvegarder le Profil
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
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold', fontSize: 14 }}>Nom du Profil :</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Ma configuration..."
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 4 }}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold', fontSize: 14 }}>Description (optionnel) :</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Petite note pour ce profil..."
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 4, minHeight: 60 }}
                        />
                    </div>

                    <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 6, border: '1px solid #eee' }}>
                        <span style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 'bold', color: '#555' }}>Options de sauvegarde :</span>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer', fontSize: 13 }}>
                            <input
                                type="checkbox"
                                checked={includeAmenities}
                                onChange={(e) => setIncludeAmenities(e.target.checked)}
                            />
                            Inclure la configuration des services (poids, visibilité)
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                            <input
                                type="checkbox"
                                checked={includeHeatmap}
                                onChange={(e) => setIncludeHeatmap(e.target.checked)}
                            />
                            Inclure les réglages de calcul (Tortuosité, Portée, etc.)
                        </label>
                    </div>

                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 20px',
                    borderTop: '1px solid #eee',
                    background: '#f9f9f9',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 10
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            background: 'white',
                            border: '1px solid #ddd',
                            borderRadius: 4,
                            cursor: 'pointer',
                            color: '#555'
                        }}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '8px 16px',
                            background: '#2ecc71',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            color: 'white',
                            fontWeight: 'bold'
                        }}
                    >
                        Sauvegarder
                    </button>
                </div>
            </div>
        </div>
    );
}
