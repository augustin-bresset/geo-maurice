import React, { useState, useEffect } from 'react';
import AccessibilityMap from './components/Map/AccessibilityMap';
import { Legend } from './components/Map/Legend';
import { ControlPanel } from './components/Controls/ControlPanel';
import { HelpModal, HelpButton } from './components/Controls/HelpModal';
import { useAmenityData } from './hooks/useAmenityData';
import { calculateHeatmap } from './utils/heatmap';
import { GROUPS, CATEGORY_COLORS } from './config/amenities';
import { DEFAULT_PROFILES } from './config/profiles';

function App() {
  const { data, spatialIndices, populationData, loading, progress } = useAmenityData();

  // Helper to get a clean base config
  const getBaseConfig = () => {
    const initial = {};
    Object.values(GROUPS).flat().forEach(label => {
      initial[label] = { visible: true, score: true, weight: 1.0 };
    });
    return initial;
  };

  // Initialize config
  const [config, setConfig] = useState(getBaseConfig);

  // Profile Management
  const [customProfiles, setCustomProfiles] = useState(() => {
    const saved = localStorage.getItem('geo_maurice_profiles');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeProfileId, setActiveProfileId] = useState('default');
  const [viewMode, setViewMode] = useState('accessibility'); // 'accessibility' | 'population'

  // Global Heatmap Settings
  // type: 'linear' | 'constant' | 'inverse_square' | 'exponential'
  const [heatmapSettings, setHeatmapSettings] = useState({
    type: 'linear',
    params: {
      distanceRef: 5, // Distance (km) à laquelle le score = 0.5 (passage rouge → vert)
      densityInfluence: 1.0, // Multiplier for population opacity effect
      roadFactor: 1.0, // Tortuosity factor (1.0 = bird, >1.0 = road approx)
      allowedRoads: {
        motorway: true,
        primary: true,
        secondary: true,
        local: true
      }
    }
  });

  // Advanced Settings: Slider Limits
  const [sliderLimits, setSliderLimits] = useState({
    range: { min: 0, max: 100, step: 1 },
    tortuosity: { min: 1.0, max: 20.0, step: 0.1 },
    opacity: { min: 0.0, max: 3.0, step: 0.1 }
  });

  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    localStorage.setItem('geo_maurice_profiles', JSON.stringify(customProfiles));
  }, [customProfiles]);

  const loadProfile = (profileId) => {
    setActiveProfileId(profileId);

    // Check if it's a default profile
    const defaultProfile = DEFAULT_PROFILES.find(p => p.id === profileId);
    if (defaultProfile) {
      setConfig(defaultProfile.config(getBaseConfig()));
      return;
    }

    // Check if it's a custom profile
    const custom = customProfiles.find(p => p.id === profileId);
    if (custom) {
      // Merge with base config to ensure all keys exist (if new amenities added)
      const base = getBaseConfig();
      const merged = { ...base, ...custom.config };
      setConfig(merged);
    }
  };

  const saveProfile = (name) => {
    const newProfile = {
      id: `custom_${Date.now()}`,
      name: name,
      description: 'Profil personnalisé',
      config: config,
      isCustom: true
    };
    setCustomProfiles([...customProfiles, newProfile]);
    setActiveProfileId(newProfile.id);
  };

  const deleteProfile = (id) => {
    setCustomProfiles(customProfiles.filter(p => p.id !== id));
    if (activeProfileId === id) {
      loadProfile('default');
    }
  };

  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [calculating, setCalculating] = useState(false);
  const [initialCalcDone, setInitialCalcDone] = useState(false);

  // Recalculate function
  const handleRecalculate = () => {
    if (loading) return;

    setCalculating(true);
    // Use setTimeout to allow UI to render spinner before heavy calc locks thread
    setTimeout(() => {
      try {
        const points = calculateHeatmap(spatialIndices, config, GROUPS, heatmapSettings, populationData);
        setHeatmapPoints(points);
      } catch (e) {
        console.error("Heatmap calc error", e);
      } finally {
        setCalculating(false);
      }
    }, 100);
  };

  // Auto calculate when data is fully loaded
  useEffect(() => {
    if (!loading && !initialCalcDone && Object.keys(spatialIndices).length > 0) {
      setInitialCalcDone(true);
      handleRecalculate();
    }
  }, [loading, spatialIndices, initialCalcDone]);

  return (
    <div className="app-container" style={{ position: 'relative', height: '100vh', width: '100vw' }}>
      <ControlPanel
        groups={GROUPS}
        config={config}
        setConfig={(newConfig) => {
          setConfig(newConfig);
          setActiveProfileId('custom_unsaved'); // Indicate modification
        }}
        onRecalculate={handleRecalculate}
        loading={loading || calculating}
        progress={progress}

        // Heatmap Settings
        heatmapSettings={heatmapSettings}
        setHeatmapSettings={setHeatmapSettings}

        // Profile props
        profiles={[...DEFAULT_PROFILES, ...customProfiles]}
        activeProfileId={activeProfileId}
        onLoadProfile={loadProfile}
        onSaveProfile={saveProfile}
        onDeleteProfile={deleteProfile}

        // View Mode
        viewMode={viewMode}
        setViewMode={setViewMode}

        // Advanced Settings
        sliderLimits={sliderLimits}
        setSliderLimits={setSliderLimits}
        setShowAdvancedModal={setShowAdvancedModal}
      />
      <AccessibilityMap
        heatmapPoints={heatmapPoints}
        populationData={populationData}
        viewMode={viewMode}
        geoData={data}
        config={config}
        groups={GROUPS}
        categoryColors={CATEGORY_COLORS}
        heatmapSettings={heatmapSettings}
      />
      <Legend />

      {/* Advanced Settings Modal - Rendered here to avoid stacking context issues */}
      {showAdvancedModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 8, maxWidth: 400, width: '90%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#333' }}>Paramètres Avancés (Intervalle)</h3>
            <p style={{ fontSize: 12, color: '#666' }}>Ajustez les valeurs maximales des curseurs de réglage.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
                Portée Max (Range) [km]:
                <input
                  type="number"
                  value={sliderLimits?.range?.max || 100}
                  onChange={(e) => setSliderLimits(prev => ({ ...prev, range: { ...prev.range, max: parseFloat(e.target.value) } }))}
                  style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
                Tortuosité Max:
                <input
                  type="number"
                  value={sliderLimits?.tortuosity?.max || 20}
                  onChange={(e) => setSliderLimits(prev => ({ ...prev, tortuosity: { ...prev.tortuosity, max: parseFloat(e.target.value) } }))}
                  style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
                Opacité Max:
                <input
                  type="number"
                  value={sliderLimits?.opacity?.max || 3.0}
                  onChange={(e) => setSliderLimits(prev => ({ ...prev, opacity: { ...prev.opacity, max: parseFloat(e.target.value) } }))}
                />
              </label>

              <div style={{ padding: '8px 0', borderTop: '1px solid #eee' }}>
                <span style={{ fontSize: 14, fontWeight: 'bold' }}>Types de routes:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                  {['motorway', 'primary', 'secondary', 'local'].map(type => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, textTransform: 'capitalize' }}>
                      <input
                        type="checkbox"
                        checked={heatmapSettings.params.allowedRoads?.[type] ?? true}
                        onChange={(e) => {
                          setHeatmapSettings(prev => ({
                            ...prev,
                            params: {
                              ...prev.params,
                              allowedRoads: {
                                ...prev.params.allowedRoads,
                                [type]: e.target.checked
                              }
                            }
                          }));
                        }}
                      />
                      {type === 'motorway' && 'Autoroutes (Rapide)'}
                      {type === 'primary' && 'Routes Principales'}
                      {type === 'secondary' && 'Routes Secondaires'}
                      {type === 'local' && 'Routes Locales (Lent)'}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAdvancedModal(false)}
                style={{ padding: '8px 16px', background: '#3498db', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Button & Modal */}
      <HelpButton onClick={() => setShowHelp(true)} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}

export default App;
