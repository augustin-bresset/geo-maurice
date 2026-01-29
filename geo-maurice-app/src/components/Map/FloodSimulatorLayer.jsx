import React, { useEffect, useRef, useState } from 'react';
import { useMap, ImageOverlay } from 'react-leaflet';

/**
 * Renders a client-side dynamic flood model with Sea Level Rise and Population Impact modes.
 * 
 * @param {number} floodLevel - The water level in meters (0 to 50).
 * @param {string} riskMode - 'river' (HAND model) or 'sea' (Absolute DEM).
 * @param {boolean} populationWeighting - If true, modulates opacity/color by population density.
 * @param {boolean} visible - Layer visibility control.
 */
const FloodSimulatorLayer = ({ floodLevel, riskMode = 'river', populationWeighting = false, visible }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [bounds, setBounds] = useState(null);
    const [metadata, setMetadata] = useState(null);

    // Off-screen canvas buffers
    const buffersRef = useRef({
        hand: null,
        sea: null,
        pop: null
    });

    // 1. Load Metadata & Source Images
    useEffect(() => {
        if (!visible) return;

        const loadBuffs = async () => {
            // Avoid reloading if already present (naive check)
            if (buffersRef.current.hand && buffersRef.current.sea && buffersRef.current.pop) return;

            try {
                // Fetch stats
                const metaRes = await fetch('/data/hazards/flood_metadata.json');
                if (!metaRes.ok) throw new Error("Metadata missing");
                const meta = await metaRes.json();
                setMetadata(meta);
                setBounds(meta.bounds);

                const w = meta.width;
                const h = meta.height;

                const loadImageData = (src) => new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = src;
                    img.crossOrigin = "Anonymous";
                    img.onload = () => {
                        const c = document.createElement('canvas');
                        c.width = w;
                        c.height = h;
                        const ctx = c.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        resolve(ctx.getImageData(0, 0, w, h).data);
                    };
                    img.onerror = (e) => {
                        console.warn(`Failed to load ${src}`, e);
                        resolve(null); // Resolve null to not block others
                    };
                });

                // Load all concurrently
                const [handData, seaData, popData] = await Promise.all([
                    loadImageData('/data/hazards/flood_hand.png'),
                    loadImageData('/data/hazards/sea_level.png'),
                    loadImageData('/data/hazards/flood_population.png')
                ]);

                buffersRef.current = {
                    hand: handData,
                    sea: seaData,
                    pop: popData
                };

                // Trigger render
                updateCanvas(floodLevel, riskMode, populationWeighting);

            } catch (e) {
                console.error("Flood Simulator Load Error:", e);
            }
        };

        loadBuffs();
    }, [visible]);

    // 2. Dynamic Update
    useEffect(() => {
        if (visible && metadata) {
            updateCanvas(floodLevel, riskMode, populationWeighting);
        }
    }, [floodLevel, riskMode, populationWeighting, visible, metadata]);

    const updateCanvas = (level, mode, usePop) => {
        const bufs = buffersRef.current;
        if (!bufs.hand || !metadata) return;

        // Optimization: If level is 0, clear and hide
        if (level <= 0) {
            setImageUrl(null);
            return;
        }

        // Select Source Buffer
        const srcData = mode === 'sea' ? bufs.sea : bufs.hand;
        if (!srcData) return;

        const popData = bufs.pop;

        const width = metadata.width;
        const height = metadata.height;
        const maxH = metadata.max_height;

        const outCanvas = document.createElement('canvas');
        outCanvas.width = width;
        outCanvas.height = height;
        const ctx = outCanvas.getContext('2d');
        const outImgData = ctx.createImageData(width, height);
        const outData = outImgData.data;

        for (let i = 0; i < srcData.length; i += 4) {
            const r = srcData[i];     // Height
            const a = srcData[i + 3]; // Mask (Land)

            // Mask 0 (Ocean) or Value > 250 (Safe / >50m) -> Skip
            if (a === 0 || r > 250) {
                outData[i + 3] = 0;
                continue;
            }

            // SQRT Decoding
            // Height = (Pixel / 255.0)^2 * 820.0
            const valNorm = r / 255.0;
            const heightM = (valNorm * valNorm) * maxH;

            if (heightM <= level) {
                // FLOODED

                // Calculate visualization params
                const depth = level - heightM;
                // Deeper = more opaque/darker usually
                const depthRatio = Math.min(1, depth / 10.0); // 0-10m ramp

                // Base water color (Blue-ish)
                let red = 41;
                let green = 128;
                let blue = 185;
                let alpha; // Declare alpha here

                // Population Impact Logic
                if (usePop && popData) {
                    const popVal = popData[i]; // Density 0-255

                    if (popVal > 1) { // Threshold for "inhabited"
                        // High Impact: Shift to Red/alert color
                        // Mix Blue and Red based on density
                        const ratio = Math.min(1, popVal / 100.0); // Saturation ramp

                        red = 41 + (231 - 41) * ratio;   // Mix towards #e74c3c
                        green = 128 + (76 - 128) * ratio;
                        blue = 185 + (60 - 185) * ratio;

                        // Opacity dependent on population (more people = more visible)
                        alpha = Math.max(160, 60 + (ratio * 195));
                    } else {
                        // Unpopulated zone -> Faintly visible (Ghost Water)
                        // User requested not to disappear completely
                        alpha = 50;
                    }
                } else {
                    // Standard Mode (No Population Weighting)
                    // User requested "transparent", not "total opacity"
                    // Reduced range from 140-255 to 100-180
                    alpha = 100 + (depthRatio * 80);
                }

                outData[i] = red;
                outData[i + 1] = green;
                outData[i + 2] = blue;
                outData[i + 3] = alpha;

            } else {
                // Dry
                outData[i + 3] = 0;
            }
        }

        ctx.putImageData(outImgData, 0, 0);
        setImageUrl(outCanvas.toDataURL());
    };

    if (!visible || !imageUrl || !bounds) return null;

    return <ImageOverlay url={imageUrl} bounds={bounds} zIndex={500} />;
};

export default FloodSimulatorLayer;
