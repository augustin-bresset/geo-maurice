const translations = {
  en: {
    // App title
    appTitle: 'Maurice Map',

    // Mode tabs
    services: 'Services',
    risks: 'Risks',

    // View modes
    displayMode: "Display Mode",
    accessibility: 'Accessibility',
    population: 'Population',
    combination: 'Combination',

    // Legend
    far: 'Far',
    near: 'Near',
    timeEstimate: '(Time estimate)',

    // Loading
    loading: 'Loading data...',
    calculating: 'Calculating...',
    recalculate: 'Recalculate Heatmap',

    // Header buttons titles
    toggleVisibility: 'Show / Hide all',
    calcSettings: 'Calculation settings',

    // Heatmap settings panel
    settings: 'Heatmap Settings',
    function: 'Function',
    linear: 'Linear (Default)',
    constant: 'Constant',
    exponential: 'Exponential',
    openAdvanced: 'Open advanced settings',
    hybridMode: 'Hybrid Mode',
    opacity: 'Opacity',
    roadEstimation: 'Road Estimation',
    tortuosity: 'Tortuosity',
    birdFlight: '1.0 = Bird flight. >1.0 = Winding.',

    // Profile section
    modified: '-- Modified --',
    saveProfileTitle: 'Save as new profile',
    deleteProfileTitle: 'Delete this profile',
    deleteConfirm: 'Delete this profile?',

    // Range slider label
    range: 'Range',

    // Services mode
    portee: 'Range',

    // Risk mode
    riskMaps: 'Risk Maps',
    riskMapsDesc: 'Visualize natural risk zones. Access to amenities is disabled in this mode for clarity.',
    riskType: 'Risk Type',
    riverFlood: 'River Flood (HAND)',
    seaRise: 'Sea Level Rise',
    floodLevel: 'Level',
    flood: 'Flood',
    sea: 'Sea',
    extremeFlood: '20m (Extreme Flood)',
    summit: '800m (Summit)',
    riverFloodDesc: 'Simulates river and lake flooding (HAND model).',
    seaRiseDesc: 'Simulates absolute sea level rise (Tsunami / Ice melt).',
    humanImpact: 'Human Impact (Density)',
    humanImpactDesc: 'Highlights flooded inhabited areas.',

    // Advanced settings modal
    advancedSettings: 'Advanced Settings',
    advancedSettingsDesc: 'Adjust the maximum values of the setting sliders.',
    maxRange: 'Max Range (km)',
    maxTortuosity: 'Max Tortuosity',
    maxOpacity: 'Max Opacity',
    frictionSource: 'Friction source',
    osmRoads: 'OSM Roads',
    frictionRoadsHint: 'Uses real roads from OpenStreetMap',
    frictionPopHint: 'Estimates roads from population density',
    close: 'Close',

    // Save profile modal
    saveProfile: 'Save Profile',
    profileName: 'Profile Name',
    profileNamePlaceholder: 'Ex: My configuration...',
    description: 'Description (optional)',
    descriptionPlaceholder: 'Short note for this profile...',
    saveOptions: 'Save options:',
    includeServices: 'Include services configuration (weights, visibility)',
    includeCalc: 'Include calculation settings (Tortuosity, Range, etc.)',
    cancel: 'Cancel',
    save: 'Save',
    profileNameRequired: 'Please enter a name for the profile.',

    // Help modal
    help: 'Help',
    helpTitle: 'Help - Maurice Map',
    helpFooter: 'Accessibility in Mauritius',
    helpReading_title: 'Reading the map',
    helpReading_content: `The map displays an accessibility score for each zone of Mauritius.

**Colors:**
- **Red** = Very accessible area (close to services)
- **Yellow/Green** = Average accessibility
- **Blue** = Less accessible area (far from services)

The more red an area is, the closer it is to the selected amenities.`,
    helpModes_title: 'Display modes',
    helpModes_content: `**Accessibility**: Displays the score based on proximity to amenities.

**Population**: Displays population density.

**Combination**: Combines accessibility and density. Opacity varies with population (populated areas more visible).`,
    helpFunctions_title: 'Score functions',
    helpFunctions_content: `**Linear**: Score decreases uniformly from 1 (at distance 0) to 0 (at defined range).
Formula: Score = 1 - distance/range

**Exponential**: Progressive decrease based on each amenity's range.
Formula: Score = exp(-distance/range)

**Constant**: Score = 1 everywhere within range (binary).`,
    helpRange_title: 'Range (km)',
    helpRange_content: `Range defines the maximum influence distance of an amenity.

Example: A school with a 5 km range will contribute to the score of all zones within a 5 km radius.

Each type of amenity can have its own range, adjustable via sliders.`,
    helpTortuosity_title: 'Tortuosity and Friction',
    helpTortuosity_content: `Controls the importance of roads in distance calculation.

**Tortuosity (Intensity):**
- **1.0** = No road effect (bird flight)
- **2.0** = Moderate effect (roads speed up movement)
- **5.0** = Maximum effect (roads very important, off-road difficult)

**Friction source (Advanced Settings):**
- **Population**: Estimates roads via population density
- **OSM Roads**: Uses real OpenStreetMap roads

**Road types:**
Disabling a type = removing its speed bonus.`,
    helpProfiles_title: 'Profiles',
    helpProfiles_content: `Profiles are pre-defined configurations:

- **Standard**: No selection
- **Family**: Focus on schools and health
- **Tourism**: Beaches, restaurants, transport
- **Seniors**: Health and public services

You can create and save your own profiles.`,

    // Category names
    cat_health: 'Health',
    cat_security: 'Security',
    cat_education: 'Education',
    cat_public: 'Public Services',
    cat_transport: 'Transport',
    cat_hygiene: 'Hygiene',
    cat_commercial: 'Commercial',
    cat_tourism: 'Tourism',

    // Color settings modal
    colorSettings: 'Color Settings',
    categoryColorsSection: 'Category Colors',
    gradientSection: 'Accessibility Gradient',
    gradientLow: 'Far (low)',
    gradientHigh: 'Near (high)',
    gradientPreview: 'Preview',
    resetAll: 'Reset all',
    openColorSettings: 'Color settings',

    // Alert messages
    alertSavedOk: (name, filename) => `Profile "${name}" saved successfully in ${filename}!`,
    alertSaveError: (msg) => `Error saving profile: ${msg}`,
  },

  fr: {
    // App title
    appTitle: 'Maurice Map',

    // Mode tabs
    services: 'Services',
    risks: 'Risques',

    // View modes
    displayMode: "Mode d'affichage",
    accessibility: 'Accessibilité',
    population: 'Population',
    combination: 'Combinaison',

    // Legend
    far: 'Éloigné',
    near: 'Proche',
    timeEstimate: '(Estimation temporelle)',

    // Loading
    loading: 'Chargement des données...',
    calculating: 'Chargement...',
    recalculate: 'Recalculer la Heatmap',

    // Header buttons titles
    toggleVisibility: 'Tout afficher / Tout masquer',
    calcSettings: 'Paramètres de calcul',

    // Heatmap settings panel
    settings: 'Paramètres de la Heatmap',
    function: 'Fonction',
    linear: 'Linéaire (Défaut)',
    constant: 'Constante',
    exponential: 'Exponentielle',
    openAdvanced: 'Ouvrir les paramètres avancés',
    hybridMode: 'Mode Hybride',
    opacity: 'Opacité',
    roadEstimation: 'Estimation Routière',
    tortuosity: 'Tortuosité',
    birdFlight: "1.0 = Vol d'oiseau. >1.0 = Sinueux.",

    // Profile section
    modified: '-- Modifié --',
    saveProfileTitle: 'Sauvegarder comme nouveau profil',
    deleteProfileTitle: 'Supprimer ce profil',
    deleteConfirm: 'Supprimer ce profil ?',

    // Range slider label
    range: 'Portée',

    // Services mode
    portee: 'Portée',

    // Risk mode
    riskMaps: 'Cartes des Risques',
    riskMapsDesc: "Visualisez les zones à risques naturels. L'accès aux commodités est désactivé dans ce mode pour plus de clarté.",
    riskType: 'Type de Risque',
    riverFlood: 'Crue Rivière (HAND)',
    seaRise: 'Montée Océan',
    floodLevel: 'Niveau',
    flood: 'Crue',
    sea: 'Mer',
    extremeFlood: '20m (Crue Extrême)',
    summit: '800m (Sommet)',
    riverFloodDesc: 'Simule la crue des rivières et lacs (modèle HAND).',
    seaRiseDesc: 'Simule la montée absolue du niveau de la mer (Tsunami/Fonte glaces).',
    humanImpact: 'Impact Humain (Densité)',
    humanImpactDesc: 'Met en évidence les zones habitées inondées.',

    // Advanced settings modal
    advancedSettings: 'Paramètres Avancés',
    advancedSettingsDesc: 'Ajustez les valeurs maximales des curseurs de réglage.',
    maxRange: 'Portée Max (Range) [km]',
    maxTortuosity: 'Tortuosité Max',
    maxOpacity: 'Opacité Max',
    frictionSource: 'Source de friction',
    osmRoads: 'Routes OSM',
    frictionRoadsHint: 'Utilise les routes réelles de la carte OpenStreetMap',
    frictionPopHint: 'Estime les routes à partir de la densité de population',
    close: 'Fermer',

    // Save profile modal
    saveProfile: 'Sauvegarder le Profil',
    profileName: 'Nom du Profil',
    profileNamePlaceholder: 'Ex: Ma configuration...',
    description: 'Description (optionnel)',
    descriptionPlaceholder: 'Petite note pour ce profil...',
    saveOptions: 'Options de sauvegarde :',
    includeServices: 'Inclure la configuration des services (poids, visibilité)',
    includeCalc: 'Inclure les réglages de calcul (Tortuosité, Portée, etc.)',
    cancel: 'Annuler',
    save: 'Sauvegarder',
    profileNameRequired: 'Veuillez entrer un nom pour le profil.',

    // Help modal
    help: 'Aide',
    helpTitle: 'Aide - Maurice Map',
    helpFooter: 'Accessibilité à Maurice',
    helpReading_title: 'Lecture de la carte',
    helpReading_content: `La carte affiche un score d'accessibilité pour chaque zone de l'île Maurice.

**Couleurs :**
- **Rouge** = Zone très accessible (proche des services)
- **Jaune/Vert** = Accessibilité moyenne
- **Bleu** = Zone peu accessible (éloignée des services)

Plus une zone est rouge, plus elle est proche des commodités sélectionnées.`,
    helpModes_title: "Modes d'affichage",
    helpModes_content: `**Accessibilité** : Affiche le score basé sur la proximité aux commodités.

**Population** : Affiche la densité de population.

**Combinaison** : Combine accessibilité et densité. L'opacité varie selon la population (zones peuplées plus visibles).`,
    helpFunctions_title: 'Fonctions de score',
    helpFunctions_content: `**Linéaire** : Le score décroît uniformément de 1 (à distance 0) à 0 (à la portée définie).
Formule : Score = 1 - distance/portée

**Exponentielle** : Décroissance progressive basée sur la portée de chaque commodité.
Formule : Score = exp(-distance/portée)

**Constante** : Score = 1 partout dans la portée (binaire).`,
    helpRange_title: 'Portée (km)',
    helpRange_content: `La portée définit la distance maximale d'influence d'une commodité.

Exemple : Une école avec portée de 5 km contribuera au score de toutes les zones dans un rayon de 5 km.

Chaque type de commodité peut avoir sa propre portée, ajustable via les sliders.`,
    helpTortuosity_title: 'Tortuosité et Friction',
    helpTortuosity_content: `Contrôle l'importance des routes dans le calcul de distance.

**Tortuosité (Intensité) :**
- **1.0** = Pas d'effet des routes (vol d'oiseau)
- **2.0** = Effet modéré (routes accélèrent le déplacement)
- **5.0** = Effet maximum (routes très importantes, hors-route difficile)

**Source de friction (Paramètres Avancés) :**
- **Population** : Estime les routes via la densité de population
- **Routes OSM** : Utilise les vraies routes OpenStreetMap

**Types de routes :**
Désactiver un type = retirer son bonus de vitesse.`,
    helpProfiles_title: 'Profils',
    helpProfiles_content: `Les profils sont des configurations pré-définies :

- **Standard** : Aucune sélection
- **Famille** : Focus sur écoles et santé
- **Tourisme** : Plages, restaurants, transports
- **Seniors** : Santé et services publics

Vous pouvez créer et sauvegarder vos propres profils.`,

    // Category names
    cat_health: 'Santé',
    cat_security: 'Sécurité',
    cat_education: 'Éducation',
    cat_public: 'Services Publics',
    cat_transport: 'Transport',
    cat_hygiene: 'Hygiène',
    cat_commercial: 'Commercial',
    cat_tourism: 'Tourisme',

    // Color settings modal
    colorSettings: 'Gestion des couleurs',
    categoryColorsSection: 'Couleurs des catégories',
    gradientSection: "Gradient d'accessibilité",
    gradientLow: 'Loin (bas)',
    gradientHigh: 'Proche (haut)',
    gradientPreview: 'Aperçu',
    resetAll: 'Réinitialiser tout',
    openColorSettings: 'Gestion des couleurs',

    // Alert messages
    alertSavedOk: (name, filename) => `Profil "${name}" sauvegardé avec succès dans ${filename} !`,
    alertSaveError: (msg) => `Erreur lors de la sauvegarde du profil: ${msg}`,
  },

  mc: {
    // App title
    appTitle: 'Maurice Map',

    // Mode tabs
    services: 'Servis',
    risks: 'Risk',

    // View modes
    displayMode: 'Mod Afisaz',
    accessibility: 'Aksesibilité',
    population: 'Popilasion',
    combination: 'Konbinezon',

    // Legend
    far: 'Lwen',
    near: 'Proser',
    timeEstimate: '(Estimasion letan)',

    // Loading
    loading: 'Sarzman done...',
    calculating: 'Ap kalkile...',
    recalculate: 'Kalkil Ankor',

    // Header buttons titles
    toggleVisibility: 'Mont / Kasyet tou',
    calcSettings: 'Paramèt kalkil',

    // Heatmap settings panel
    settings: 'Paramèt Heatmap',
    function: 'Fonksion',
    linear: 'Lineyer (Defot)',
    constant: 'Konstan',
    exponential: 'Eksponansiell',
    openAdvanced: 'Ouver paramèt avanse',
    hybridMode: 'Mod Ibrid',
    opacity: 'Opasité',
    roadEstimation: 'Estimasion Sime',
    tortuosity: 'Tortiozité',
    birdFlight: '1.0 = Vol zoizo. >1.0 = Siniye.',

    // Profile section
    modified: '-- Modifié --',
    saveProfileTitle: 'Sov kouma nouvo profil',
    deleteProfileTitle: 'Efas sa profil',
    deleteConfirm: 'Efas sa profil ?',

    // Range slider label
    range: 'Distans',

    // Services mode
    portee: 'Distans',

    // Risk mode
    riskMaps: 'Kart Risk',
    riskMapsDesc: 'Get zons risk natirel. Aksè servis désaktivé dan mod-la pou pli klèr.',
    riskType: 'Tip Risk',
    riverFlood: 'Kri Larivyer (HAND)',
    seaRise: 'Monte Losean',
    floodLevel: 'Nivo',
    flood: 'Kri',
    sea: 'Lamer',
    extremeFlood: '20m (Kri Ekstrèm)',
    summit: '800m (Somè)',
    riverFloodDesc: 'Simil kri larivyer ek lak (modèl HAND).',
    seaRiseDesc: 'Simil monte absoli nivo lamer (Tsunami / Fon glas).',
    humanImpact: 'Impak Imin (Densité)',
    humanImpactDesc: 'Montre zons abitab ki inonndé.',

    // Advanced settings modal
    advancedSettings: 'Paramèt Avanse',
    advancedSettingsDesc: 'Aziste valèr maksimom kursèr réglaz.',
    maxRange: 'Max Distans (km)',
    maxTortuosity: 'Max Tortiozité',
    maxOpacity: 'Max Opasité',
    frictionSource: 'Sourd frission',
    osmRoads: 'Sime OSM',
    frictionRoadsHint: 'Itiliz sime réel OpenStreetMap',
    frictionPopHint: 'Estim sime depi densité popilasion',
    close: 'Ferm',

    // Save profile modal
    saveProfile: 'Sov Profil',
    profileName: 'Non Profil',
    profileNamePlaceholder: 'Ex: Mo konfigirasion...',
    description: 'Deskripsion (opsionel)',
    descriptionPlaceholder: 'Ti not pou sa profil...',
    saveOptions: 'Opsion sov :',
    includeServices: 'Enkli konfig servis (pwa, vizibilité)',
    includeCalc: 'Enkli paramèt kalkil (Tortiozité, Distans, etc.)',
    cancel: 'Anile',
    save: 'Sov',
    profileNameRequired: 'Silvouplé rant enn non pou profil-la.',

    // Help modal
    help: 'Led',
    helpTitle: 'Led - Maurice Map',
    helpFooter: 'Aksesibilité dan Moris',
    helpReading_title: 'Lir Kart-la',
    helpReading_content: `Kart-la afiS enn skor aksesibilité pou sak zOn dan Moris.

**Kouler :**
- **Rouz** = Zòn trè aksesibl (proser servis)
- **Zonn/Ver** = Aksesibilité mwayen
- **Blé** = Zòn mwens aksesibl (lwen servis)

Pli enn zòn rouz, pli li proser konmodité séleksioné.`,
    helpModes_title: 'Mod Afisaz',
    helpModes_content: `**Aksesibilité** : Montre skor baze lor proksimité konmodité.

**Popilasion** : Montre densité popilasion.

**Konbinezon** : Konbin aksesibilité ek densité. Opasité varie avek popilasion (zons abitab pli vizib).`,
    helpFunctions_title: 'Fonksion Skor',
    helpFunctions_content: `**Lineyer** : Skor diminié uniformément depi 1 (distans 0) ziska 0 (distans maximom).
Formil : Skor = 1 - distans/portée

**Eksponansiell** : Diminision progresif baze lor distans sak konmodité.
Formil : Skor = exp(-distans/portée)

**Konstan** : Skor = 1 partou dan portée (bineyr).`,
    helpRange_title: 'Distans (km)',
    helpRange_content: `Distans définir distans maksimom linflians enn konmodité.

Egzamp : Enn lékol ek distans 5 km pou kontribié dan skor tou zòns dan enn reyon 5 km.

Sak tip konmodité kapav ena so prop distans, azistab avek sliders.`,
    helpTortuosity_title: 'Tortiozité ek Frission',
    helpTortuosity_content: `Kontrol limportans sime dan kalkil distans.

**Tortiozité (Intensité) :**
- **1.0** = Pa ena efè sime (vol zoizo)
- **2.0** = Efè modéré (sime akselèr déplasma)
- **5.0** = Efè maksimom (sime trè importan, hors-route difisil)

**Sourd frission (Paramèt Avanse) :**
- **Popilasion** : Estim sime avek densité popilasion
- **Sime OSM** : Itiliz sime réel OpenStreetMap

**Tip sime :**
Désaktivé enn tip = eliminn so bonis vitès.`,
    helpProfiles_title: 'Profil',
    helpProfiles_content: `Profil se konfigirasion pre-définir :

- **Standèrd** : Okenn séleksion
- **Lafamiy** : Fokis lor lékol ek lasanté
- **Tourizm** : Plaz, restoran, transpor
- **Seniors** : Lasanté ek servis piblik

Ou kapav kréer ek sov ou prop profil.`,

    // Category names
    cat_health: 'Lasanté',
    cat_security: 'Sékirité',
    cat_education: 'Ledikasion',
    cat_public: 'Servis Piblik',
    cat_transport: 'Transpor',
    cat_hygiene: 'Izienn',
    cat_commercial: 'Komèrsial',
    cat_tourism: 'Tourizm',

    // Color settings modal
    colorSettings: 'Jesion Kouler',
    categoryColorsSection: 'Kouler Katégori',
    gradientSection: 'Gradyan Aksesibilité',
    gradientLow: 'Lwen (ba)',
    gradientHigh: 'Proser (o)',
    gradientPreview: 'Apersi',
    resetAll: 'Remiz tou',
    openColorSettings: 'Jesion kouler',

    // Alert messages
    alertSavedOk: (name, filename) => `Profil "${name}" sové avek siksè dan ${filename} !`,
    alertSaveError: (msg) => `Erèr kan sov profil: ${msg}`,
  },
};

export default translations;
