export const GRID_BBOX = {
    minLat: -20.60, // South of Mauritius
    maxLat: -19.40, // Expanded further North for Rodrigues
    minLon: 57.20,  // West of Mauritius
    maxLon: 63.60,  // Expanded further East for Rodrigues
    step: 0.002 // Resolution (approx 200m)
};

function dist(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const x = dLon * Math.cos((lat1 + lat2) * Math.PI / 360);
    return Math.sqrt(dLat * dLat + x * x) * R;
}

// Simple Binary Heap Priority Queue for performance
class PriorityQueue {
    constructor() {
        this.heap = [];
    }
    push(node) {
        this.heap.push(node);
        this._bubbleUp(this.heap.length - 1);
    }
    pop() {
        const top = this.heap[0];
        const bottom = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = bottom;
            this._sinkDown(0);
        }
        return top;
    }
    size() {
        return this.heap.length;
    }
    _bubbleUp(n) {
        while (n > 0) {
            const p = Math.floor((n - 1) / 2);
            if (this.heap[n].dist >= this.heap[p].dist) break;
            [this.heap[n], this.heap[p]] = [this.heap[p], this.heap[n]];
            n = p;
        }
    }
    _sinkDown(n) {
        const len = this.heap.length;
        const elt = this.heap[n];
        while (true) {
            let swap = null;
            const left = 2 * n + 1;
            const right = 2 * n + 2;
            if (left < len && this.heap[left].dist < elt.dist) swap = left;
            if (right < len && this.heap[right].dist < (swap === null ? elt.dist : this.heap[left].dist)) swap = right;
            if (swap === null) break;
            [this.heap[n], this.heap[swap]] = [this.heap[swap], this.heap[n]];
            n = swap;
        }
    }
}

export function calculateHeatmap(spatialIndices, activeConfig, GROUPS, heatmapSettings, populationData, roadsFrictionData) {
    const { minLat, maxLat, minLon, maxLon, step } = GRID_BBOX;
    const width = Math.ceil((maxLon - minLon) / step);
    const height = Math.ceil((maxLat - minLat) / step);
    const size = width * height;

    const distGrid = new Float32Array(size); // Will be reused for each label
    const values = new Float32Array(size); // Final scores, accumulated

    // 1. Initialize Sources (This section is now handled within the loop per label)
    // The original comment block for "1. Initialize Sources" is replaced by the per-label loop.

    // 2. Prepare Friction Map
    let roadFactor = heatmapSettings?.params?.roadFactor || 1.0;
    const allowedRoads = heatmapSettings?.params?.allowedRoads || {};

    // Apply "allowedRoads" penalty when using population source
    if (heatmapSettings?.params?.frictionSource !== 'roads') {
        if (allowedRoads.motorway === false) roadFactor += 0.4;
        if (allowedRoads.primary === false) roadFactor += 0.2;
        if (allowedRoads.secondary === false) roadFactor += 0.1;
        if (allowedRoads.local === false) roadFactor += 0.1;
    }

    const popValues = populationData ? populationData.values : null;

    // Step distance in meters. 1 degree lat ~ 111km.
    // dx = 111139 * step * cos(lat)
    // dy = 111139 * step
    // Simplify: Approx constant for Mauritius (Lat -20)
    const metersPerStepLat = 111139 * step;
    const metersPerStepLon = 111139 * step * Math.cos(-20.2 * Math.PI / 180); // ~104km

    // Neighbors: Up, Down, Left, Right, Diagonals
    const neighbors = [
        { dx: -1, dy: 0, cost: metersPerStepLon },
        { dx: 1, dy: 0, cost: metersPerStepLon },
        { dx: 0, dy: -1, cost: metersPerStepLat },
        { dx: 0, dy: 1, cost: metersPerStepLat },
        // Diagonals
        { dx: -1, dy: -1, cost: Math.sqrt(metersPerStepLon ** 2 + metersPerStepLat ** 2) },
        { dx: 1, dy: -1, cost: Math.sqrt(metersPerStepLon ** 2 + metersPerStepLat ** 2) },
        { dx: -1, dy: 1, cost: Math.sqrt(metersPerStepLon ** 2 + metersPerStepLat ** 2) },
        { dx: 1, dy: 1, cost: Math.sqrt(metersPerStepLon ** 2 + metersPerStepLat ** 2) }
    ];

    // 3. Run Dijkstra for each active label and accumulate scores
    const visited = new Uint8Array(size); // Reused for each label

    const settings = heatmapSettings || { type: 'linear' };
    const params = settings.params || { distanceRef: 5 };

    for (const cat of Object.keys(GROUPS)) {
        for (const label of GROUPS[cat]) {
            const cfg = activeConfig[label];
            if (!cfg || !cfg.score || cfg.weight <= 0) continue;
            if (!spatialIndices[label]) continue;

            const rangeMeters = cfg.weight * 1000;
            const { coords } = spatialIndices[label];

            const startingNodes = [];
            for (const p of coords) {
                const y = Math.floor((p.lat - minLat) / step);
                const x = Math.floor((p.lon - minLon) / step);
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    startingNodes.push(y * width + x);
                }
            }

            if (startingNodes.length === 0) continue;

            // Reset distGrid and visited for this label's Dijkstra run
            distGrid.fill(Infinity);
            visited.fill(0);
            const localPQ = new PriorityQueue();

            startingNodes.forEach(idx => {
                distGrid[idx] = 0;
                localPQ.push({ idx, dist: 0 });
            });

            // For exponential, extend propagation range (exp(-5) ≈ 0.7%)
            const isExponential = settings.type === 'exponential';
            const labelMaxScanDist = rangeMeters * roadFactor * (isExponential ? 5 : 1.5);

            while (localPQ.size() > 0) {
                const { idx, dist } = localPQ.pop();
                if (visited[idx]) continue;
                visited[idx] = 1;

                if (dist > labelMaxScanDist) continue; // Optimization: stop propagating far beyond range

                // Score Calculation for current pixel (idx)
                let val = 0;
                switch (settings.type) {
                    case 'constant':
                        if (dist < rangeMeters) val = 1;
                        break;
                    case 'exponential':
                        // No hard cutoff - natural decay
                        val = Math.exp(-dist / rangeMeters);
                        break;
                    case 'linear':
                    default:
                        // Linear: score = 1 at dist=0, score = 0 at rangeMeters
                        if (dist < rangeMeters) {
                            val = 1 - dist / rangeMeters;
                        }
                        break;
                }
                if (val > 0) {
                    values[idx] += val;
                }

                const x = idx % width;
                const y = Math.floor(idx / width);

                // Explore neighbors
                for (const n of neighbors) {
                    const nx = x + n.dx;
                    const ny = y + n.dy;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const nIdx = ny * width + nx;
                        if (!visited[nIdx]) {
                            // Friction logic - choose source
                            const frictionSource = params.frictionSource || 'population';
                            let friction = 1.0;

                            if (frictionSource === 'roads' && roadsFrictionData && roadsFrictionData.values) {
                                // Use pre-calculated roads friction grid directly
                                const roadVal = roadsFrictionData.values[nIdx] || 5.0;
                                // roadVal: 1.0 = good road, 5.0 = off-road
                                // Apply roadFactor: higher roadFactor = more penalty for off-road
                                friction = 1.0 + (roadVal - 1.0) * (roadFactor - 1.0) / 4.0;
                            } else {
                                // Population-based friction
                                let popRatio = 0;
                                if (popValues) {
                                    popRatio = Math.min(1, Math.sqrt(popValues[nIdx]) / 5);
                                }
                                // friction: 1.0 for dense areas (roads), roadFactor for empty areas
                                friction = 1.0 + (roadFactor - 1.0) * (1 - popRatio);
                            }

                            const newDist = dist + n.cost * friction;
                            if (newDist < distGrid[nIdx]) {
                                distGrid[nIdx] = newDist;
                                localPQ.push({ idx: nIdx, dist: newDist });
                            }
                        }
                    }
                }
            }
        }
    }

    // 4. Create land mask based on population data (land = pop > 0)
    // Apply morphological dilation to include uninhabited land areas near populated ones
    const landMask = new Uint8Array(size);
    if (popValues) {
        // First pass: mark pixels with population
        const rawMask = new Uint8Array(size);
        for (let k = 0; k < size; k++) {
            rawMask[k] = popValues[k] > 0 ? 1 : 0;
        }

        // Dilate the mask (radius ~10 pixels = ~2km) to include nearby uninhabited land
        const dilateRadius = 10;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                if (rawMask[idx]) {
                    landMask[idx] = 1;
                    continue;
                }
                // Check neighborhood for any populated pixel
                let found = false;
                for (let dy = -dilateRadius; dy <= dilateRadius && !found; dy++) {
                    for (let dx = -dilateRadius; dx <= dilateRadius && !found; dx++) {
                        const ny = y + dy;
                        const nx = x + dx;
                        if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                            if (rawMask[ny * width + nx]) {
                                found = true;
                            }
                        }
                    }
                }
                landMask[idx] = found ? 1 : 0;
            }
        }
    } else {
        // No population data, assume everywhere is land
        landMask.fill(1);
    }

    // 5. Find max score for normalization
    let maxScore = 0;
    for (let k = 0; k < size; k++) {
        if (values[k] > maxScore) maxScore = values[k];
    }

    return {
        values, width, height, minLat, minLon, maxLat, maxLon, step, maxScore, landMask
    };
}
