import React, { useState } from 'react';
import './ControlPanel.css';
import { Settings, RefreshCw, Eye, EyeOff, BarChart2, Layers, Save, Trash2 } from 'lucide-react';

export function ControlPanel({
    groups,
    config,
    setConfig,
    onRecalculate,
    loading,
    progress,
    // New props for profiles
    profiles = [],
    activeProfileId,
    onLoadProfile,
    onSaveProfile,
    onOpenSaveModal,
    onDeleteProfile,
    viewMode,
    setViewMode,
    heatmapSettings,
    setHeatmapSettings,
    // Advanced Settings
    sliderLimits,
    setSliderLimits,
    setShowAdvancedModal,
    applicationMode,
    setApplicationMode,
    floodLevel,
    setFloodLevel,
    riskMode,
    setRiskMode,
    populationWeighting,
    setPopulationWeighting
}) {
    // DEBUG: console log to inspect props
    if (!groups) {
        console.error("ControlPanel: groups prop is missing!", { groups, config });
    }

    // Toggle state for internal UI sections
    // Ensure groups is an object before using Object.keys
    const initialExpanded = groups ? Object.keys(groups).reduce((acc, k) => ({ ...acc, [k]: true }), {}) : {};
    const [expandedCats, setExpandedCats] = useState(initialExpanded);
    const [showSettings, setShowSettings] = useState(false);

    const toggleCat = (cat) => setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));

    const updateConfig = (label, field, val) => {
        setConfig(prev => ({
            ...prev,
            [label]: {
                ...prev[label],
                [field]: val
            }
        }));
    };

    const toggleCategoryAll = (cat, field) => {
        // Toggle based on first item's state or just force true/false?
        // Let's check if all are true, then set false, else set true
        const labels = groups[cat];
        const allTrue = labels.every(l => config[l]?.[field]);
        const newVal = !allTrue;

        setConfig(prev => {
            const next = { ...prev };
            labels.forEach(l => {
                if (!next[l]) next[l] = { visible: true, score: true, weight: 1 };
                next[l] = { ...next[l], [field]: newVal };
            });
            return next;
        });
    };

    const handleSaveClick = () => {
        if (onOpenSaveModal) {
            onOpenSaveModal();
        }
    };

    const toggleAllVisibility = () => {
        const allLabels = Object.values(groups).flat();
        const allVisible = allLabels.every(l => config[l]?.visible);
        const newVal = !allVisible;

        setConfig(prev => {
            const next = { ...prev };
            allLabels.forEach(l => {
                if (!next[l]) next[l] = { visible: true, score: true, weight: 1 };
                next[l] = { ...next[l], visible: newVal };
            });
            return next;
        });
    };

    return (
        <div className="control-panel">
            <div className="panel-header">
                <h2>Maurice Map</h2>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button
                        onClick={toggleAllVisibility}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        title="Tout afficher / Tout masquer"
                    >
                        <Eye size={18} color="#555" />
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        title="Paramètres de calcul"
                    >
                        <Settings size={18} color={showSettings ? "#3498db" : "#666"} />
                    </button>
                </div>
            </div>

            {/* Settings Modal / Popover */}
            {showSettings && (
                <div style={{ padding: '10px 16px', borderBottom: '1px solid #eee', background: '#f0f8ff' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: 8, color: '#0056b3' }}>Paramètres de la Heatmap</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, minWidth: 60 }}>Fonction:</span>
                            <select
                                value={heatmapSettings?.type || 'linear'}
                                onChange={(e) => setHeatmapSettings(prev => ({ ...prev, type: e.target.value }))}
                                style={{ flex: 1, padding: 4, borderRadius: 4, border: '1px solid #ccc' }}
                            >
                                <option value="linear">Linéaire (Défaut)</option>
                                <option value="constant">Constante</option>
                                <option value="exponential">Exponentielle</option>
                            </select>
                        </div>

                    </div>

                    {/* Advanced Settings Button */}
                    <div style={{ marginTop: 8, borderTop: '1px solid #ddd', paddingTop: 8 }}>
                        <button
                            onClick={() => setShowAdvancedModal(true)}
                            style={{ width: '100%', padding: '6px', cursor: 'pointer', background: '#e0efff', border: '1px solid #3498db', borderRadius: 4, color: '#0056b3', fontSize: 11, fontWeight: 'bold' }}
                        >
                            Ouvrir les paramètres avancés
                        </button>
                    </div>

                    <div style={{ marginTop: 8, borderTop: '1px solid #ddd', paddingTop: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 'bold', color: '#555', marginBottom: 4 }}>Mode Hybride</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, minWidth: 60 }}>Opacité:</span>
                            <input
                                type="range"
                                min={sliderLimits?.opacity?.min || 0.2}
                                max={sliderLimits?.opacity?.max || 3.0}
                                step={sliderLimits?.opacity?.step || 0.1}
                                value={heatmapSettings.params.densityInfluence || 1.0}
                                onChange={(e) => setHeatmapSettings(prev => ({ ...prev, params: { ...prev.params, densityInfluence: parseFloat(e.target.value) } }))}
                                style={{ flex: 1 }}
                                title={`Influence de la densité: ${heatmapSettings.params.densityInfluence || 1.0}`}
                            />
                            <span style={{ fontSize: 10 }}>{heatmapSettings.params.densityInfluence || 1.0}x</span>
                        </div>
                    </div>

                    <div style={{ marginTop: 8, borderTop: '1px solid #ddd', paddingTop: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 'bold', color: '#555', marginBottom: 4 }}>Estimation Routière</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, minWidth: 60 }}>Tortuosité:</span>
                            <input
                                type="range"
                                min={sliderLimits?.tortuosity?.min || 1.0}
                                max={sliderLimits?.tortuosity?.max || 20.0}
                                step={sliderLimits?.tortuosity?.step || 0.1}
                                value={heatmapSettings.params.roadFactor || 1.0}
                                onChange={(e) => setHeatmapSettings(prev => ({ ...prev, params: { ...prev.params, roadFactor: parseFloat(e.target.value) } }))}
                                style={{ flex: 1 }}
                                title={`Facteur distance: ${heatmapSettings.params.roadFactor || 1.0}x`}
                            />
                            <span style={{ fontSize: 10 }}>{heatmapSettings.params.roadFactor || 1.0}x</span>
                        </div>
                        <div style={{ fontSize: 9, color: '#888', fontStyle: 'italic', marginTop: 2 }}>
                            1.0 = Vol d'oiseau. &gt;1.0 = Sinueux.
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Section */}
            <div className="profile-section" style={{ padding: '10px 16px', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select
                        value={activeProfileId}
                        onChange={(e) => onLoadProfile(e.target.value)}
                        style={{ flex: 1, padding: '4px', borderRadius: 4, border: '1px solid #ccc' }}
                    >
                        {profiles.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} {p.isCustom ? '(Custom)' : ''}
                            </option>
                        ))}
                        {activeProfileId === 'custom_unsaved' && <option value="custom_unsaved" disabled>-- Modifié --</option>}
                    </select>

                    <button
                        onClick={handleSaveClick}
                        title="Sauvegarder comme nouveau profil"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    >
                        <Save size={16} color="#333" />
                    </button>

                    {profiles.find(p => p.id === activeProfileId)?.isCustom && (
                        <button
                            onClick={() => {
                                if (confirm('Supprimer ce profil ?')) onDeleteProfile(activeProfileId);
                            }}
                            title="Supprimer ce profil"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        >
                            <Trash2 size={16} color="#e41a1c" />
                        </button>
                    )}
                </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ddd' }}>
                <button
                    onClick={() => setApplicationMode('services')}
                    style={{
                        flex: 1, padding: '10px', cursor: 'pointer',
                        background: applicationMode === 'services' ? 'white' : '#f8f9fa',
                        border: 'none',
                        borderBottom: applicationMode === 'services' ? '2px solid #3498db' : 'none',
                        fontWeight: applicationMode === 'services' ? 'bold' : 'normal',
                        color: applicationMode === 'services' ? '#2c3e50' : '#7f8c8d'
                    }}
                >
                    Services
                </button>
                <button
                    onClick={() => setApplicationMode('risks')}
                    style={{
                        flex: 1, padding: '10px', cursor: 'pointer',
                        background: applicationMode === 'risks' ? 'white' : '#f8f9fa',
                        border: 'none',
                        borderBottom: applicationMode === 'risks' ? '2px solid #e74c3c' : 'none',
                        fontWeight: applicationMode === 'risks' ? 'bold' : 'normal',
                        color: applicationMode === 'risks' ? '#c0392b' : '#7f8c8d'
                    }}
                >
                    Risques
                </button>
            </div>

            {applicationMode === 'services' ? (
                <>
                    {/* View Mode Switcher */}
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid #eee', background: '#fff' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: 8, color: '#555' }}>Mode d'affichage</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={() => setViewMode('accessibility')}
                                style={{
                                    flex: 1, padding: '6px', cursor: 'pointer',
                                    borderRadius: 4, border: '1px solid #ccc',
                                    background: viewMode === 'accessibility' ? '#3498db' : '#f8f9fa',
                                    color: viewMode === 'accessibility' ? 'white' : '#333',
                                    fontWeight: viewMode === 'accessibility' ? 'bold' : 'normal'
                                }}
                            >
                                Accessibilité
                            </button>
                            <button
                                onClick={() => setViewMode('population')}
                                style={{
                                    flex: 1, padding: '6px', cursor: 'pointer',
                                    borderRadius: 4, border: '1px solid #ccc',
                                    background: viewMode === 'population' ? '#e67e22' : '#f8f9fa',
                                    color: viewMode === 'population' ? 'white' : '#333',
                                    fontWeight: viewMode === 'population' ? 'bold' : 'normal'
                                }}
                            >
                                Population
                            </button>
                            <button
                                onClick={() => setViewMode('hybrid')}
                                style={{
                                    flex: 1, padding: '6px', cursor: 'pointer',
                                    borderRadius: 4, border: '1px solid #ccc',
                                    background: viewMode === 'hybrid' ? '#8e44ad' : '#f8f9fa',
                                    color: viewMode === 'hybrid' ? 'white' : '#333',
                                    fontWeight: viewMode === 'hybrid' ? 'bold' : 'normal'
                                }}
                            >
                                Combinaison
                            </button>
                        </div>
                    </div>

                    {
                        loading && (
                            <div style={{ padding: '10px 16px', background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                                    <span>Chargement des données...</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div style={{ width: '100%', height: 4, background: '#eee', borderRadius: 2 }}>
                                    <div style={{ width: `${progress}%`, height: '100%', background: '#4ada4a', borderRadius: 2, transition: 'width 0.2s' }}></div>
                                </div>
                            </div>
                        )
                    }

                    <div className="panel-content">
                        {Object.keys(groups).map(cat => (
                            <div key={cat} className="category-block">
                                <div className="category-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => toggleCat(cat)}>
                                        <span className="category-title">{cat}</span>
                                    </div>
                                    <div className="control-group">
                                        <button title="Toggle Visibility" onClick={() => toggleCategoryAll(cat, 'visible')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <Eye size={14} />
                                        </button>
                                        <button title="Toggle Score" onClick={() => toggleCategoryAll(cat, 'score')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <BarChart2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {expandedCats[cat] && groups[cat].map(label => {
                                    const c = config[label] || { visible: true, score: true, weight: 1 };
                                    return (
                                        <div key={label} className="amenity-row">
                                            <div className="amenity-header">
                                                <span className="amenity-name">{label.replace(/_/g, ' ')}</span>
                                                <div className="amenity-controls">
                                                    <label className="control-group" title="Afficher sur la carte">
                                                        <input
                                                            type="checkbox"
                                                            checked={c.visible}
                                                            onChange={e => updateConfig(label, 'visible', e.target.checked)}
                                                        />
                                                        <Eye size={14} />
                                                    </label>
                                                    <label className="control-group" title="Inclure dans le score">
                                                        <input
                                                            type="checkbox"
                                                            checked={c.score}
                                                            onChange={e => updateConfig(label, 'score', e.target.checked)}
                                                        />
                                                        <BarChart2 size={14} />
                                                    </label>
                                                </div>
                                            </div>

                                            {c.score && (
                                                <div className="weight-slider-container">
                                                    <span style={{ fontSize: 10, minWidth: 60 }}>Portée: {c.weight} km</span>
                                                    <input
                                                        type="range"
                                                        className="weight-slider"
                                                        min={sliderLimits?.range?.min || 0}
                                                        max={sliderLimits?.range?.max || 100}
                                                        step={sliderLimits?.range?.step || 1}
                                                        value={c.weight}
                                                        onChange={e => updateConfig(label, 'weight', parseFloat(e.target.value))}
                                                        title={`Portée d'influence: ${c.weight} km`}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                // RISK MODE PANEl
                <div style={{ padding: 20 }}>
                    <h3 style={{ marginTop: 0, color: '#e74c3c' }}>Cartes des Risques</h3>
                    <p style={{ fontSize: 13, color: '#666' }}>
                        Visualisez les zones à risques naturels. L'accès aux commodités est désactivé dans ce mode pour plus de clarté.
                    </p>

                    <div style={{ marginTop: 20, background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <strong style={{ color: '#2c3e50' }}>Type de Risque</strong>
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <button
                                onClick={() => setRiskMode('river')}
                                style={{
                                    flex: 1, padding: '8px', cursor: 'pointer', borderRadius: 4,
                                    border: riskMode === 'river' ? '1px solid #3498db' : '1px solid #eee',
                                    background: riskMode === 'river' ? '#eaf4fc' : '#fff',
                                    color: riskMode === 'river' ? '#2980b9' : '#555',
                                    fontWeight: riskMode === 'river' ? 'bold' : 'normal',
                                    fontSize: 12
                                }}
                            >
                                Crue Rivière (HAND)
                            </button>
                            <button
                                onClick={() => setRiskMode('sea')}
                                style={{
                                    flex: 1, padding: '8px', cursor: 'pointer', borderRadius: 4,
                                    border: riskMode === 'sea' ? '1px solid #27ae60' : '1px solid #eee',
                                    background: riskMode === 'sea' ? '#e9f7ef' : '#fff',
                                    color: riskMode === 'sea' ? '#27ae60' : '#555',
                                    fontWeight: riskMode === 'sea' ? 'bold' : 'normal',
                                    fontSize: 12
                                }}
                            >
                                Montée Océan
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <strong style={{ color: '#2c3e50' }}>Niveau: {riskMode === 'river' ? "Crue" : "Mer"} (+{floodLevel}m)</strong>
                        </div>

                        <input
                            type="range"
                            min={0}
                            max={riskMode === 'river' ? 20 : 800}
                            step={riskMode === 'river' ? 0.2 : 5}
                            value={floodLevel}
                            onChange={(e) => setFloodLevel(parseFloat(e.target.value))}
                            style={{ width: '100%', cursor: 'pointer', accentColor: riskMode === 'sea' ? '#27ae60' : '#3498db' }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#888' }}>
                            <span>0m</span>
                            <span>{riskMode === 'river' ? '20m (Crue Extrême)' : '800m (Sommet)'}</span>
                        </div>

                        <p style={{ fontSize: 11, color: '#666', marginTop: 8, lineHeight: 1.4 }}>
                            {riskMode === 'river'
                                ? "Simule la crue des rivières et lacs (modèle HAND)."
                                : "Simule la montée absolue du niveau de la mer (Tsunami/Fonte glaces)."}
                        </p>
                    </div>

                    <div style={{ marginTop: 10, background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={populationWeighting}
                                onChange={(e) => setPopulationWeighting(e.target.checked)}
                            />
                            <div>
                                <strong style={{ display: 'block', color: '#e74c3c' }}>Impact Humain (Densité)</strong>
                                <span style={{ fontSize: 11, color: '#888' }}>
                                    Met en évidence les zones habitées inondées.
                                </span>
                            </div>
                        </label>
                    </div>

                </div>
            )}

            <div className="action-bar">
                <button className="btn-primary" onClick={onRecalculate} disabled={loading}>
                    {loading ? 'Chargement...' : 'Recalculer la Heatmap'}
                </button>
            </div>
        </div >
    );
}
