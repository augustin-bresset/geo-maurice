import React, { useState, useEffect } from 'react';
import AccessibilityMap from './components/Map/AccessibilityMap';
import { ControlPanel } from './components/Controls/ControlPanel';
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
        const points = calculateHeatmap(spatialIndices, config, GROUPS);
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

        // Profile props
        profiles={[...DEFAULT_PROFILES, ...customProfiles]}
        activeProfileId={activeProfileId}
        onLoadProfile={loadProfile}
        onSaveProfile={saveProfile}
        onDeleteProfile={deleteProfile}

        // View Mode
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      <AccessibilityMap
        heatmapPoints={heatmapPoints}
        populationData={populationData}
        viewMode={viewMode}
        geoData={data}
        config={config}
        groups={GROUPS}
        categoryColors={CATEGORY_COLORS}
      />
    </div>
  );
}

export default App;
