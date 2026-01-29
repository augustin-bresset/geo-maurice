import { useState, useEffect } from 'react';
import KDBush from 'kdbush';
import { GROUPS } from '../config/amenities';

export function useAmenityData() {
    const [data, setData] = useState({});
    const [spatialIndices, setSpatialIndices] = useState({});
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    const [populationData, setPopulationData] = useState(null);
    const [roadsFrictionData, setRoadsFrictionData] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const loadAll = async () => {
            const allLabels = Object.values(GROUPS).flat();
            const total = allLabels.length + 1; // +1 for population
            let loadedCount = 0;

            const newData = {};
            const newIndices = {};

            // Fetch Population Data
            try {
                const popRes = await fetch('/data/population.json');
                if (popRes.ok) {
                    const popJson = await popRes.json();
                    if (isMounted) setPopulationData(popJson);
                }
            } catch (e) {
                console.warn("Failed to load population data", e);
            } finally {
                loadedCount++;
                if (isMounted) setProgress((loadedCount / total) * 100);
            }

            // Fetch Roads Friction Data
            try {
                const roadsRes = await fetch('/data/roads_friction.json');
                if (roadsRes.ok) {
                    const roadsJson = await roadsRes.json();
                    if (isMounted) setRoadsFrictionData(roadsJson);
                }
            } catch (e) {
                console.warn("Failed to load roads friction data", e);
            }

            // Parallel fetching by category could be efficient, but let's just do bulk promises
            // or chunks to update progress.

            const fetchPromises = allLabels.map(async (label) => {
                try {
                    const response = await fetch(`/data/osm/${label}.geojson`);
                    if (!response.ok) return null;
                    const json = await response.json();

                    if (!json.features || json.features.length === 0) return null;

                    // Build Spatial Index immediately
                    const coords = json.features.map(f => ({
                        lat: f.geometry.coordinates[1],
                        lon: f.geometry.coordinates[0],
                        id: f.properties.id
                    }));

                    // KDBush(points, getX, getY) - getX is lon, getY is lat
                    const index = new KDBush(coords.length);
                    for (const p of coords) {
                        index.add(p.lon, p.lat);
                    }
                    index.finish();

                    return { label, json, index, coords };
                } catch (e) {
                    console.warn(`Failed to load ${label}`, e);
                    return null;
                } finally {
                    loadedCount++;
                    if (isMounted) setProgress((loadedCount / total) * 100);
                }
            });

            const results = await Promise.all(fetchPromises);

            if (!isMounted) return;

            results.forEach(res => {
                if (res) {
                    newData[res.label] = res.json;
                    newIndices[res.label] = {
                        index: res.index,
                        coords: res.coords
                    };
                }
            });

            setData(newData);
            setSpatialIndices(newIndices);
            setLoading(false);
        };

        loadAll();

        return () => { isMounted = false; };
    }, []);

    return { data, spatialIndices, populationData, roadsFrictionData, loading, progress };
}
