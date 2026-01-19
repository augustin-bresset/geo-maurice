import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, ImageOverlay } from 'react-leaflet';
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
function generateHeatmapImage(gridData) {
    if (!gridData || !gridData.values) return null;

    const { values, width, height, maxScore } = gridData;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Create image data
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
        // Grid row index (0 is MinLat (South))
        // Canvas y (0 is Top)
        // We want Canvas y=0 to be MaxLat (Grid row = height-1)
        const gridRow = height - 1 - y;

        for (let x = 0; x < width; x++) {
            const i = gridRow * width + x;
            const score = values[i];

            const pixelIndex = (y * width + x) * 4;

            if (score > 0) {
                // Normalize score relative to MaxScore for coloring
                // Avoid divide by zero
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

                data[pixelIndex] = r * 255;     // R
                data[pixelIndex + 1] = g * 255; // G
                data[pixelIndex + 2] = b * 255; // B
                data[pixelIndex + 3] = 150;     // Alpha (0-255) ~ 0.6 opacity
            } else {
                data[pixelIndex + 3] = 0; // Transparent
            }
        }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
}

const CustomHeatmapLayer = ({ gridData }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [bounds, setBounds] = useState(null);

    useEffect(() => {
        // Strict validation of gridData object
        if (!gridData || !gridData.values || !gridData.width || !gridData.height) {
            setImageUrl(null);
            setBounds(null);
            return;
        }

        try {
            const url = generateHeatmapImage(gridData);
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

    }, [gridData]);

    if (!imageUrl || !bounds) return null;

    return <ImageOverlay url={imageUrl} bounds={bounds} opacity={0.7} />;
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

export default function AccessibilityMap({
    heatmapPoints,
    populationData,
    viewMode = 'accessibility',
    geoData,
    config,
    groups,
    categoryColors
}) {

    // Select which grid to show
    // If viewMode is population, show populationData.
    // If accessibility, show heatmapPoints.

    const activeGridData = viewMode === 'population' ? populationData : heatmapPoints;

    const layersToRender = [];
    Object.keys(groups).forEach(cat => {
        const color = categoryColors[cat];
        groups[cat].forEach(label => {
            const cfg = config[label];
            // Only show points if visible AND we are in accessibility mode? 
            // Or always show points?
            // Usually if looking at population, we might still want to see amenities.
            // Let's keep existing logic: show if configured visible.
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

            {/* Custom Heatmap Layer - Dynamic Data Source */}
            <CustomHeatmapLayer gridData={activeGridData} />

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
        </MapContainer>
    );
}
