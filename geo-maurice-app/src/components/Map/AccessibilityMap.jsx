import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, ImageOverlay, ScaleControl } from 'react-leaflet';
import FloodSimulatorLayer from './FloodSimulatorLayer';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Color ramp: Blue (low) -> Green -> Yellow -> Red (high)
function getColor(value) {
    // value is 0..1
    const h = (1.0 - value) * 240; // 240(blue) -> 0(red)
    return `hsla(${h}, 100%, 50%, 0.6)`;
}

// Helper to generate Data URL from grid
function generateHeatmapImage(gridData, secondaryGrid, mode, densityInfluence) {
    if (!gridData || !gridData.values) return null;

    const { values, width, height, maxScore, landMask } = gridData;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Create image data
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    // Pre-calculate blending factors if hybrid
    let popValues = null;
    let maxPop = 1;
    if (mode === 'hybrid' && secondaryGrid && secondaryGrid.values) {
        // Assume identical grid dimensions for now (based on verified setup)
        popValues = secondaryGrid.values;
        maxPop = secondaryGrid.maxScore || 1;
    }

    const influence = densityInfluence || 1.0;

    for (let y = 0; y < height; y++) {
        // Grid row index (0 is MinLat (South))
        // Canvas y (0 is Top)
        // We want Canvas y=0 to be MaxLat (Grid row = height-1)
        const gridRow = height - 1 - y;

        for (let x = 0; x < width; x++) {
            const i = gridRow * width + x;
            const score = values[i];

            const pixelIndex = (y * width + x) * 4;

            // Check land mask - only render on land
            const isLand = landMask ? landMask[i] : true;
            if (!isLand) {
                data[pixelIndex + 3] = 0; // Transparent for ocean
                continue;
            }

            // Decide if we should render this pixel
            const hasAccess = score > 0;
            const showBackground = mode === 'hybrid' && popValues && popValues[i] > 0;

            if (hasAccess || showBackground) {
                // Normalize score relative to MaxScore for coloring
                // If score is 0, norm is 0 -> Blue
                const norm = Math.min(1, score / (maxScore || 1));

                // Optimized color mapping: H from 240 (blue) down to 0 (red)
                const hue = (1.0 - norm) * 240;

                // Simple Hue to RGB conversion for canvas pixel manipulation
                // (Using HSL-to-RGB logic inline for speed and simplicity)
                const H = hue;
                const C = 1;
                const X = C * (1 - Math.abs(((H / 60) % 2) - 1));
                let r = 0, g = 0, b = 0;

                if (0 <= H && H < 60) { r = C; g = X; b = 0; }
                else if (60 <= H && H < 120) { r = X; g = C; b = 0; }
                else if (120 <= H && H < 180) { r = 0; g = C; b = X; }
                else if (180 <= H && H < 240) { r = 0; g = X; b = C; }
                else if (240 <= H && H < 300) { r = X; g = 0; b = C; }
                else { r = C; g = 0; b = X; }

                // Default Opacity
                let alpha = 150; // ~0.6

                // HYBRID LOGIC: Multiply opacity by population density
                if (mode === 'hybrid' && popValues) {
                    const pop = popValues[i] || 0;

                    // Ratio 0 to 1
                    let popRatio = Math.sqrt(pop) / Math.sqrt(maxPop);

                    // Apply user influence
                    // If influence > 1, small pops become visible faster? Or opacity is just boosted.
                    // Let's say opacity = Base + (Range * popRatio * influence)
                    // But we want to preserve transparency for empty areas (pop=0)

                    const dynamicAlpha = 60 + 195 * popRatio * influence;
                    alpha = Math.min(255, Math.floor(dynamicAlpha));

                    // If no access (score 0), maybe reduce opacity slightly more?
                    // User said "fond de faible valeur".
                    // Blue + Density opacity is fine.
                }

                data[pixelIndex] = r * 255;     // R
                data[pixelIndex + 1] = g * 255; // G
                data[pixelIndex + 2] = b * 255; // B
                data[pixelIndex + 3] = alpha;   // Alpha (0-255)
            } else {
                data[pixelIndex + 3] = 0; // Transparent
            }
        }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
}

const CustomHeatmapLayer = ({ gridData, secondaryGrid, mode, settings }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [bounds, setBounds] = useState(null);

    const densityInfluence = settings?.params?.densityInfluence;

    useEffect(() => {
        // console.log("CustomHeatmapLayer Update:", { mode, densityInfluence, hasGrid: !!gridData, hasPop: !!secondaryGrid });

        // Strict validation of gridData object
        if (!gridData || !gridData.values || !gridData.width || !gridData.height) {
            setImageUrl(null);
            setBounds(null);
            return;
        }

        try {
            const url = generateHeatmapImage(gridData, secondaryGrid, mode, densityInfluence);
            setImageUrl(url);

            const { minLat, maxLat, minLon, maxLon } = gridData;

            if (minLat === undefined || maxLat === undefined || minLon === undefined || maxLon === undefined) {
                console.error("Heatmap bounds missing", gridData);
                return;
            }

            setBounds([[minLat, minLon], [maxLat, maxLon]]);
        } catch (e) {
            console.error("Error generating heatmap image", e);
            setImageUrl(null);
        }

    }, [gridData, secondaryGrid, mode, densityInfluence]);

    if (!imageUrl || !bounds) return null;

    return <ImageOverlay url={imageUrl} bounds={bounds} opacity={0.8} />;
};

const FastGeoJSONLayer = ({ data, color, visible, label }) => {
    const map = useMap();
    const layerRef = React.useRef(null);

    useEffect(() => {
        if (!visible || !data) {
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
                layerRef.current = null;
            }
            return;
        }

        if (!layerRef.current) {
            layerRef.current = L.geoJSON(data, {
                pointToLayer: (feature, latlng) => {
                    return L.circleMarker(latlng, {
                        radius: 5,
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.7,
                        weight: 1,
                        opacity: 1
                    });
                },
                onEachFeature: (feature, layer) => {
                    const name = feature.properties.name || "Unknown";
                    layer.bindPopup(`<b>${name}</b><br><span style='color:${color}'>${label}</span>`);
                }
            }).addTo(map);
        } else {
            layerRef.current.setStyle({ color: color, fillColor: color });
        }

        return () => {
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
                layerRef.current = null;
            }
        };
    }, [map, data, visible, color, label]);

    return null;
};

const DistrictsLayer = ({ url = "/data/districts_mauritius.geojson", visible = true }) => {
    const map = useMap();
    const layerRef = React.useRef(null);

    useEffect(() => {
        if (!visible) {
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
                layerRef.current = null;
            }
            return;
        }

        let cancelled = false;

        const load = async () => {
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Failed to fetch districts: ${res.status}`);
                const data = await res.json();
                if (cancelled) return;

                // Remove old layer if exists
                if (layerRef.current) {
                    map.removeLayer(layerRef.current);
                    layerRef.current = null;
                }

                layerRef.current = L.geoJSON(data, {
                    style: () => ({
                        color: "#222",
                        weight: 2,
                        fillOpacity: 0, // transparent fill
                        opacity: 0.9
                    }),
                    onEachFeature: (feature, layer) => {
                        const props = feature?.properties || {};
                        const name =
                            props.shapeName ||
                            props.NAME_1 ||
                            props.name ||
                            props.district ||
                            "District";
                        layer.bindPopup(`<b>${name}</b>`);
                    }
                }).addTo(map);
            } catch (e) {
                console.error(e);
            }
        };

        load();

        return () => {
            cancelled = true;
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
                layerRef.current = null;
            }
        };
    }, [map, url, visible]);

    return null;
};

const RiskLayer = ({ visible }) => {
    const map = useMap();
    const layerRef = React.useRef(null);

    useEffect(() => {
        if (!visible) {
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
                layerRef.current = null;
            }
            return;
        }

        const load = async () => {
            try {
                const res = await fetch('/data/hazards/flood_model.geojson');
                if (!res.ok) return;
                const data = await res.json();

                if (layerRef.current) {
                    map.removeLayer(layerRef.current);
                }

                layerRef.current = L.geoJSON(data, {
                    style: (feature) => {
                        const risk = feature.properties.risk_level;
                        if (risk === 'High') {
                            return {
                                color: '#e74c3c', // Red
                                fillColor: '#e74c3c',
                                fillOpacity: 0.6,
                                weight: 0
                            };
                        } else {
                            return {
                                color: '#e67e22', // Orange
                                fillColor: '#e67e22',
                                fillOpacity: 0.4,
                                weight: 0
                            };
                        }
                    },
                    onEachFeature: (feature, layer) => {
                        const props = feature.properties || {};
                        const riskLabel = props.risk_level === 'High' ? 'Risque Élevé (Inondation)' : 'Risque Moyen (Crue)';
                        layer.bindPopup(`<b>Zone Inondable</b><br>${riskLabel}`);
                    }
                }).addTo(map);
            } catch (e) {
                console.error("Failed to load risk data", e);
            }
        };

        load();

        return () => {
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
                layerRef.current = null;
            }
        };
    }, [map, visible]);

    return null;
};

export default function AccessibilityMap({
    heatmapPoints,
    populationData,
    viewMode = 'accessibility',
    geoData,
    config,
    groups,
    categoryColors,
    heatmapSettings,
    applicationMode = 'services',
    floodLevel = 0, // New Prop
    riskMode = 'river',
    populationWeighting = false
}) {

    // Select which grid to show
    const activeGridData = viewMode === 'population' ? populationData : heatmapPoints;

    const layersToRender = [];
    if (applicationMode === 'services') {
        Object.keys(groups).forEach(cat => {
            const color = categoryColors[cat];
            groups[cat].forEach(label => {
                const cfg = config[label];
                if (cfg && cfg.visible && geoData[label]) {
                    layersToRender.push({
                        label,
                        data: geoData[label],
                        color,
                        visible: true
                    });
                }
            });
        });
    }

    return (
        <MapContainer
            center={[-20.2, 57.5]}
            zoom={11}
            style={{ height: "100%", width: "100%", background: "#cad2d3" }}
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <ScaleControl position="bottomleft" imperial={false} />

            {/* Distrcits always visible for context */}
            <DistrictsLayer visible={true} />

            {applicationMode === 'services' ? (
                <>
                    {/* Custom Heatmap Layer */}
                    <CustomHeatmapLayer
                        gridData={activeGridData}
                        secondaryGrid={viewMode === 'hybrid' ? populationData : null}
                        mode={viewMode}
                        settings={heatmapSettings}
                    />

                    {/* Point Layers */}
                    {layersToRender.map(l => (
                        <FastGeoJSONLayer
                            key={l.label}
                            label={l.label}
                            data={l.data}
                            color={l.color}
                            visible={l.visible}
                        />
                    ))}
                </>
            ) : (
                /* RISK MODE LAYERS */
                <>
                    {/* Dynamic Flood Simulator */}
                    <FloodSimulatorLayer
                        visible={true}
                        floodLevel={floodLevel}
                        riskMode={riskMode}
                        populationWeighting={populationWeighting}
                    />

                    {/* Keep RiskLayer (vector) hidden or optional? For now replacing it completely as requested */}
                    {/* <RiskLayer visible={false} /> */}
                </>
            )}

        </MapContainer>
    );
}
