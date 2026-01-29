import { useState, useEffect } from 'react';

/**
 * Hook to load profiles from JSON files in src/assets/profiles/
 * Uses Vite's import.meta.glob for dynamic loading without manual index.
 */
export function useProfiles() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfiles = async () => {
            // Vite glob import
            const modules = import.meta.glob('/src/assets/profiles/*.json');

            const loaded = [];
            for (const path in modules) {
                try {
                    const mod = await modules[path]();
                    // Default export or the JSON itself
                    // JSON imports in Vite usually return the object as default
                    const profile = mod.default || mod;
                    if (profile.name) {
                        loaded.push(profile);
                    }
                } catch (e) {
                    console.error(`Error loading profile ${path}`, e);
                }
            }

            setProfiles(loaded);
            setLoading(false);
        };

        loadProfiles();
    }, []);

    return { profiles, loading };
}
