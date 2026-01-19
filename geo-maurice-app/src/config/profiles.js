import { GROUPS } from './amenities';

export const DEFAULT_PROFILES = [
    {
        id: 'default',
        name: 'Standard',
        description: 'Aucune sélection par défaut',
        config: (baseConfig) => {
            const c = JSON.parse(JSON.stringify(baseConfig));
            // Set all ranges to 0
            Object.keys(c).forEach(k => { c[k].weight = 0; c[k].score = true; c[k].visible = true; });
            return c;
        }
    },
    {
        id: 'family',
        name: 'Famille',
        description: 'Focus : Écoles (10km), Santé (15km)',
        config: (baseConfig) => {
            const c = JSON.parse(JSON.stringify(baseConfig));
            // Reset all to 0
            Object.keys(c).forEach(k => { c[k].weight = 0; c[k].score = true; c[k].visible = false; });

            // Education
            GROUPS.education.forEach(k => { if (c[k]) { c[k].weight = 10; c[k].visible = true; } }); // 10km range
            // Health
            GROUPS.health.forEach(k => { if (c[k]) { c[k].weight = 15; c[k].visible = true; } }); // 15km range

            return c;
        }
    },
    {
        id: 'tourism',
        name: 'Tourisme',
        description: 'Focus : Plages (5km), Restos (5km), Transport (20km)',
        config: (baseConfig) => {
            const c = JSON.parse(JSON.stringify(baseConfig));
            Object.keys(c).forEach(k => { c[k].weight = 0; c[k].score = true; c[k].visible = false; });

            // Tourism
            GROUPS.tourism.forEach(k => { if (c[k]) { c[k].weight = 5; c[k].visible = true; } });
            // Transport
            GROUPS.transport.forEach(k => { if (c[k]) { c[k].weight = 20; c[k].visible = true; } });
            // Commercial (ATM)
            GROUPS.commercial.forEach(k => { if (c[k]) { c[k].weight = 5; c[k].visible = true; } });

            return c;
        }
    },
    {
        id: 'senior',
        name: 'Seniors',
        description: 'Focus : Santé (20km), Services (10km)',
        config: (baseConfig) => {
            const c = JSON.parse(JSON.stringify(baseConfig));
            Object.keys(c).forEach(k => { c[k].weight = 0; c[k].score = true; c[k].visible = false; });

            // Health
            GROUPS.health.forEach(k => { if (c[k]) { c[k].weight = 20; c[k].visible = true; } });
            // Public Services
            GROUPS.public.forEach(k => { if (c[k]) { c[k].weight = 10; c[k].visible = true; } });
            // Transport
            GROUPS.transport.forEach(k => { if (c[k]) { c[k].weight = 10; c[k].visible = true; } });

            return c;
        }
    },
    {
        id: 'health_only',
        name: 'Santé Pure',
        description: 'Santé (30km)',
        config: (baseConfig) => {
            const c = JSON.parse(JSON.stringify(baseConfig));
            Object.keys(c).forEach(k => { c[k].weight = 0; c[k].score = true; c[k].visible = false; });
            GROUPS.health.forEach(k => { if (c[k]) { c[k].weight = 30; c[k].visible = true; } });
            return c;
        }
    }
];
