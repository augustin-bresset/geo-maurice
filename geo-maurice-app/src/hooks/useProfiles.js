import { useState, useEffect } from 'react';

/**
 * Hook to load profiles from JSON files in /data/profiles/
 */
export function useProfiles() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadProfiles = async () => {
            try {
                // Load index
                const indexRes = await fetch('/data/profiles/index.json');
                if (!indexRes.ok) {
                    console.warn('No profiles index found');
                    setLoading(false);
                    return;
                }

                const indexJson = await indexRes.json();
                const profileIds = indexJson.profiles || [];

                // Load each profile
                const loadedProfiles = [];
                for (const id of profileIds) {
                    try {
                        const res = await fetch(`/data/profiles/${id}.json`);
                        if (res.ok) {
                            const profile = await res.json();
                            loadedProfiles.push(profile);
                        }
                    } catch (e) {
                        console.warn(`Failed to load profile ${id}`, e);
                    }
                }

                if (isMounted) {
                    setProfiles(loadedProfiles);
                    setLoading(false);
                }
            } catch (e) {
                console.error('Failed to load profiles', e);
                if (isMounted) setLoading(false);
            }
        };

        loadProfiles();
        return () => { isMounted = false; };
    }, []);

    return { profiles, loading };
}
