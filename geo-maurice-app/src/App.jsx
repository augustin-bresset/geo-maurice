import React, { useState, useEffect } from 'react';
import AccessibilityMap from './components/Map/AccessibilityMap';
import { Legend } from './components/Map/Legend';
import { ControlPanel } from './components/Controls/ControlPanel';
import { HelpModal, HelpButton } from './components/Controls/HelpModal';
import { SaveProfileModal } from './components/Controls/SaveProfileModal';
import { useAmenityData } from './hooks/useAmenityData';
import { useProfiles } from './hooks/useProfiles';
import { calculateHeatmap } from './utils/heatmap';
import { GROUPS, CATEGORY_COLORS } from './config/amenities';

function App() {
  const { data, spatialIndices, populationData, roadsFrictionData, loading, progress } = useAmenityData();
  const { profiles: jsonProfiles, loading: profilesLoading } = useProfiles();

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
      frictionSource: 'population', // 'population' or 'roads'
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

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [applicationMode, setApplicationMode] = useState('services'); // 'services' | 'risks'
  const [floodLevel, setFloodLevel] = useState(0); // 0 to 50 meters
  const [riskMode, setRiskMode] = useState('river'); // 'river' | 'sea'
  const [populationWeighting, setPopulationWeighting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    localStorage.setItem('geo_maurice_profiles', JSON.stringify(customProfiles));
  }, [customProfiles]);

  const loadProfile = (profileId) => {
    setActiveProfileId(profileId);

    // Check if it's a JSON profile
    const jsonProfile = jsonProfiles.find(p => p.id === profileId);
    if (jsonProfile) {
      const base = getBaseConfig();
      // Reset all amenities to Weight 0 (but keep them visible/scored so UI bars remain)
      Object.keys(base).forEach(k => { base[k].weight = 0; base[k].score = true; base[k].visible = true; });
      // Apply profile amenities
      if (jsonProfile.amenities) {
        Object.entries(jsonProfile.amenities).forEach(([key, val]) => {
          if (base[key]) {
            // Intelligent Merge: If weight is defined but score/visible are not, assume True
            const autoEnable = (val.weight && val.weight > 0);
            base[key] = {
              ...base[key],
              visible: val.visible ?? (autoEnable ? true : base[key].visible),
              score: val.score ?? (autoEnable ? true : base[key].score),
              weight: val.weight ?? base[key].weight
            };
          }
        });
      }
      setConfig(base);
      // Apply heatmap settings
      if (jsonProfile.heatmapSettings) {
        setHeatmapSettings(prev => ({
          ...prev,
          type: jsonProfile.heatmapSettings.type || prev.type,
          params: {
            ...prev.params,
            roadFactor: jsonProfile.heatmapSettings.roadFactor ?? prev.params.roadFactor,
            densityInfluence: jsonProfile.heatmapSettings.densityInfluence ?? prev.params.densityInfluence
          }
        }));
      }
      return;
    }

    // Check if it's a custom (localStorage) profile
    const custom = customProfiles.find(p => p.id === profileId);
    if (custom) {
      const base = getBaseConfig();
      // Reset all first just like JSON profiles to ensure clean state
      // (User reported previously saved profiles not working well, possibly due to mixed state)
      // Actually for custom profiles, we usually save the FULL config, so simple merge is fine.
      // But if the saved config was "sparse" (only diffs), we need the reset logic. 
      // Assuming custom profiles save the FULL state (currentConfig), simple merge is safest.

      // However, to be consistent with "Profile" concept (exclusive), we should check if 'custom.config' is full or sparse.
      // 'handleSaveProfile' saves 'currentConfig' which is FULL.
      // So no reset needed usually. 

      const merged = { ...base, ...custom.config };
      setConfig(merged);
      if (custom.heatmapSettings) {
        setHeatmapSettings(prev => ({
          ...prev,
          params: {
            ...prev.params,
            roadFactor: custom.heatmapSettings.roadFactor ?? prev.params.roadFactor,
            densityInfluence: custom.heatmapSettings.densityInfluence ?? prev.params.densityInfluence
          }
        }));
      }
    }
  };

  const handleSaveProfile = (profileData) => {
    const newProfile = {
      id: `custom_${Date.now()}`,
      ...profileData,
      isCustom: true
    };
    const updatedProfiles = [...customProfiles, newProfile];
    setCustomProfiles(updatedProfiles);
    setActiveProfileId(newProfile.id);
    // Force immediate save to storage to be safe
    localStorage.setItem('geo_maurice_profiles', JSON.stringify(updatedProfiles));

    // DOWNLOAD JSON as requested
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(newProfile, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${newProfile.name.replace(/\s+/g, '_').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
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
        const points = calculateHeatmap(spatialIndices, config, GROUPS, heatmapSettings, populationData, roadsFrictionData);
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
          // Only mark as unsaved if we are not already on a custom profile that is saved
          // But actually any change creates a divergence from the "Saved" state.
          // Simplest: Always go to 'custom_unsaved' unless we are just loading?
          // No, if I am editing "My Profile 1", I stay on "My Profile 1" until I save? 
          // usually: editing a saved profile makes it "Dirty".
          // For now, let's keep the user's request: "I cannot modify a default profile".
          // When modifying a default profile, we must detach from it.
          if (!activeProfileId.startsWith('custom_')) {
            setActiveProfileId('custom_unsaved');
          }
        }}
        onRecalculate={handleRecalculate}
        loading={loading || calculating}
        progress={progress}

        // Heatmap Settings
        heatmapSettings={heatmapSettings}
        setHeatmapSettings={setHeatmapSettings}

        // Profile props
        profiles={[...jsonProfiles, ...customProfiles]}
        activeProfileId={activeProfileId}
        onLoadProfile={loadProfile}
        onSaveProfile={handleSaveProfile} // Kept for prop consistency
        onOpenSaveModal={() => setShowSaveModal(true)}
        onDeleteProfile={deleteProfile}

        // View Mode
        viewMode={viewMode}
        setViewMode={setViewMode}

        // Advanced Settings
        sliderLimits={sliderLimits}
        setSliderLimits={setSliderLimits}
        setShowAdvancedModal={setShowAdvancedModal}

        // Mode 'Services' vs 'Risks'
        applicationMode={applicationMode}
        setApplicationMode={setApplicationMode}

        // Flood Control
        floodLevel={floodLevel}
        setFloodLevel={setFloodLevel}
        riskMode={riskMode}
        setRiskMode={setRiskMode}
        populationWeighting={populationWeighting}
        setPopulationWeighting={setPopulationWeighting}
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
        applicationMode={applicationMode}
        floodLevel={floodLevel}
        riskMode={riskMode}
        populationWeighting={populationWeighting}
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



              {/* Friction Source Toggle */}
              <div style={{ padding: '8px 0', borderTop: '1px solid #eee' }}>
                <span style={{ fontSize: 14, fontWeight: 'bold' }}>Source de friction:</span>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button
                    onClick={() => setHeatmapSettings(prev => ({ ...prev, params: { ...prev.params, frictionSource: 'population' } }))}
                    style={{
                      flex: 1, padding: '8px', cursor: 'pointer', borderRadius: 4,
                      border: '1px solid #ccc',
                      background: heatmapSettings.params.frictionSource === 'population' ? '#27ae60' : '#f8f9fa',
                      color: heatmapSettings.params.frictionSource === 'population' ? 'white' : '#333',
                      fontWeight: heatmapSettings.params.frictionSource === 'population' ? 'bold' : 'normal'
                    }}
                  >
                    Population
                  </button>
                  <button
                    onClick={() => setHeatmapSettings(prev => ({ ...prev, params: { ...prev.params, frictionSource: 'roads' } }))}
                    style={{
                      flex: 1, padding: '8px', cursor: 'pointer', borderRadius: 4,
                      border: '1px solid #ccc',
                      background: heatmapSettings.params.frictionSource === 'roads' ? '#e74c3c' : '#f8f9fa',
                      color: heatmapSettings.params.frictionSource === 'roads' ? 'white' : '#333',
                      fontWeight: heatmapSettings.params.frictionSource === 'roads' ? 'bold' : 'normal'
                    }}
                  >
                    Routes OSM
                  </button>
                </div>
                <span style={{ fontSize: 10, color: '#888', marginTop: 4, display: 'block' }}>
                  {heatmapSettings.params.frictionSource === 'roads'
                    ? 'Utilise les routes réelles de la carte OpenStreetMap'
                    : 'Estime les routes à partir de la densité de population'}
                </span>
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

      {/* Save Profile Modal */}
      <SaveProfileModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveProfile}
        currentConfig={config}
        currentHeatmapSettings={heatmapSettings}
      />

      {/* Help Button & Modal */}
      <HelpButton onClick={() => setShowHelp(true)} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}

export default App;
