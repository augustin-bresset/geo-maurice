# Geo Maurice App

Application web de cartographie de l'accessibilité aux services à l'île Maurice.

## Prérequis

- **[Node.js](https://nodejs.org/en/download)** ≥ 18 (inclut npm)
- **[Git](https://git-scm.com/downloads)** (pour cloner le dépôt)

> Pour vérifier vos versions : `node --version` et `npm --version`

## Installation et lancement

```bash
# Cloner le dépôt
git clone <url-du-depot>
cd geo-maurice-app

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Construire pour la production
npm run build
```

---

## Stack technique

- **[React](https://react.dev/)** 18 — interface utilisateur
- **[Vite](https://vite.dev/)** 5 — bundler et serveur de développement
- **[Leaflet](https://leafletjs.com/)** / **[React-Leaflet](https://react-leaflet.js.org/)** — cartographie interactive
- **[ESLint](https://eslint.org/)** — linting
