# Geo Maurice - Carte d'Accessibilité

Une application de cartographie interactive pour visualiser l'accessibilité aux services et commodités à Maurice.

## 📁 Structure du Projet

```
geo-maurice-app/     # Application React (Vite + Leaflet)
scripts/             # Scripts Python pour récupérer les données
data/                # Données brutes (CSV, Shapefiles)
```

## 🔧 Prérequis

- **Node.js** v18+
- **Python** 3.8+
- **pip** pour les packages Python

## 🚀 Installation Rapide (avec Makefile)

```bash
# Installation complète (venv + données + app)
make all

# Lancer l'application
make run
```

Ouvrir http://localhost:5173 dans le navigateur.

### Commandes Makefile disponibles

| Commande | Description |
|----------|-------------|
| `make install` | Crée le venv Python et installe les dépendances |
| `make data` | Télécharge toutes les données (OSM, population, routes) |
| `make install-app` | Installe les dépendances Node.js |
| `make run` | Lance l'application en développement |
| `make build` | Build de production |
| `make clean` | Nettoie les fichiers générés |
| `make all` | Installation complète |
| `make help` | Affiche l'aide |

---

## 🔧 Installation Manuelle

### 1. Environnement Python

```bash
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### 2. Télécharger les données

```bash
python scripts/fetch_osm.py          # Points OSM (~5-10 min)
python scripts/fetch_population.py   # Population (~2 min)
python scripts/fetch_roads_friction.py  # Routes (~5-10 min)
```

### 3. Application

```bash
cd geo-maurice-app
npm install
npm run dev
```

---

## 📊 Description des Scripts

| Script | Description | Fichier généré |
|--------|-------------|----------------|
| `fetch_osm.py` | Points OSM (écoles, hôpitaux, etc.) | `public/data/osm/*.geojson` |
| `fetch_population.py` | Densité de population WorldPop | `public/data/population.json` |
| `fetch_roads_friction.py` | Grille de friction routière | `public/data/roads_friction.json` |

---

## 🗂️ Fichiers de données attendus

```
geo-maurice-app/public/data/
├── osm/                    # Points OSM par catégorie
│   ├── hospital.geojson
│   ├── school.geojson
│   └── ...
├── population.json         # Grille de densité de population
├── roads_friction.json     # Grille de friction routière (optionnel)
└── districts_mauritius.geojson  # Frontières des districts
```

---

## 🖥️ Utilisation

### Lancer en développement
```bash
cd geo-maurice-app && npm run dev
```

### Build production
```bash
cd geo-maurice-app && npm run build
```

Les fichiers sont générés dans `dist/`.

---

## 📚 Sources de données

- **OpenStreetMap** : Commodités (Overpass API)
- **WorldPop** : Densité de population 2020 (1km)
- **OpenStreetMap** : Réseau routier

---

## ⚙️ Paramètres avancés

L'application supporte :
- **3 fonctions de score** : Linéaire, Exponentielle, Constante
- **2 sources de friction** : Population ou Routes OSM
- **Filtrage par type de route** : Autoroutes, Principales, Secondaires, Locales
- **Profils personnalisables** : Famille, Tourisme, Seniors, etc.

Consultez le bouton **❓ Aide** dans l'application pour plus de détails.
