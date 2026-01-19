export const GRID_BBOX = {
    minLat: -20.55,
    maxLat: -19.95,
    minLon: 57.3,
    maxLon: 57.8,
    step: 0.002 // Good balance of quality and performance
};

function dist(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const x = dLon * Math.cos((lat1 + lat2) * Math.PI / 360);
    return Math.sqrt(dLat * dLat + x * x) * R;
}

function getNearestDist(index, coords, lat, lon) {
    // Search radius approx 50km to be safe if range is large
    // 1 deg ~ 111km. 0.5 deg ~ 55km.
    const ids = index.within(lon, lat, 0.5);

    if (!ids || ids.length === 0) return null;

    let minOffset = Infinity;
    let closestId = -1;

    for (const id of ids) {
        const c = coords[id];
        const d2 = (c.lat - lat) ** 2 + (c.lon - lon) ** 2;
        if (d2 < minOffset) {
            minOffset = d2;
            closestId = id;
        }
    }

    if (closestId === -1) return null;

    const c = coords[closestId];
    return dist(lat, lon, c.lat, c.lon);
}

export function calculateHeatmap(spatialIndices, activeConfig, GROUPS) {
    // Returns { grid: 2D array, minLat, minLon, step, width, height }

    const { minLat, maxLat, minLon, maxLon, step } = GRID_BBOX;
    const width = Math.ceil((maxLon - minLon) / step);
    const height = Math.ceil((maxLat - minLat) / step);

    // Flatten 1D array or 2D? Canvas needs pixels. 1D is fine.
    // Let's us Float32Array for performance.
    const values = new Float32Array(width * height);

    let maxScore = 0;

    let i = 0;
    for (let lat = minLat; lat <= maxLat; lat += step) {
        for (let lon = minLon; lon <= maxLon; lon += step) {

            // Safety break if out of bounds (due to float precision loop)
            if (i >= values.length) break;

            let score = 0;

            for (const cat of Object.keys(GROUPS)) {
                for (const label of GROUPS[cat]) {
                    const cfg = activeConfig[label];
                    // cfg.weight IS NOW RANGE IN KM
                    // If range is 0, ignore
                    if (!cfg || !cfg.score || cfg.weight <= 0) continue;
                    if (!spatialIndices[label]) continue;

                    const rangeMeters = cfg.weight * 1000;

                    const { index, coords } = spatialIndices[label];
                    const d = getNearestDist(index, coords, lat, lon);

                    if (d !== null && d < rangeMeters) {
                        // Linear falloff: 1 at d=0, 0 at d=range
                        score += (1 - d / rangeMeters);
                    }
                }
            }

            values[i] = score;
            if (score > maxScore) maxScore = score;
            i++;
        }
    }

    // Normalize? No, keep raw scores, map component handles visualization
    return {
        values,
        width,
        height,
        minLat,
        minLon,
        maxLat,
        maxLon,
        step,
        maxScore
    };
}
