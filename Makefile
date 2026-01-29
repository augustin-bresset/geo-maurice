# Geo Maurice - Makefile
# ========================

# Python et Node
PYTHON = python3
NPM = npm
VENV = .venv
ACTIVATE = . $(VENV)/bin/activate

# Répertoires
APP_DIR = geo-maurice-app
SCRIPTS_DIR = scripts

# ==================== CIBLES PRINCIPALES ====================

.PHONY: all install data run build clean help

## Installation complète (venv + deps + data + app)
all: install data install-app

## Affiche l'aide
help:
	@echo "╔══════════════════════════════════════════════════════════════╗"
	@echo "║                  Geo Maurice - Commandes                     ║"
	@echo "╠══════════════════════════════════════════════════════════════╣"
	@echo "║  make install      - Crée le venv et installe les deps Python║"
	@echo "║  make data         - Télécharge toutes les données           ║"
	@echo "║  make install-app  - Installe les dépendances Node.js        ║"
	@echo "║  make run          - Lance l'application en développement    ║"
	@echo "║  make build        - Build de production                     ║"
	@echo "║  make clean        - Nettoie les fichiers générés            ║"
	@echo "║  make all          - Installation complète                   ║"
	@echo "╚══════════════════════════════════════════════════════════════╝"

# ==================== INSTALLATION ====================

## Crée le venv Python et installe les dépendances
install:
	@echo "📦 Création de l'environnement virtuel Python..."
	$(PYTHON) -m venv $(VENV)
	@echo "📥 Installation des dépendances Python..."
	$(ACTIVATE) && pip install --upgrade pip
	$(ACTIVATE) && pip install -r requirements.txt
	@echo "✅ Environnement Python prêt!"

## Installe les dépendances Node.js
install-app:
	@echo "📦 Installation des dépendances Node.js..."
	cd $(APP_DIR) && $(NPM) install
	@echo "✅ Application prête!"

# ==================== DONNÉES ====================

## Télécharge toutes les données
data: data-osm data-population data-roads
	@echo "✅ Toutes les données sont prêtes!"

## Télécharge les points OSM (amenities)
data-osm:
	@echo "🗺️  Téléchargement des points OSM..."
	$(ACTIVATE) && $(PYTHON) $(SCRIPTS_DIR)/fetch_osm.py

## Télécharge les données de population
data-population:
	@echo "👥 Téléchargement des données de population..."
	$(ACTIVATE) && $(PYTHON) $(SCRIPTS_DIR)/fetch_population.py

## Télécharge la grille de friction routière
data-roads:
	@echo "🛤️  Téléchargement des données routières..."
	$(ACTIVATE) && $(PYTHON) $(SCRIPTS_DIR)/fetch_roads_friction.py

# ==================== EXECUTION ====================

## Lance l'application en mode développement
run:
	@echo "🚀 Lancement de l'application..."
	cd $(APP_DIR) && $(NPM) run dev

## Build de production
build:
	@echo "🏗️  Build de production..."
	cd $(APP_DIR) && $(NPM) run build
	@echo "✅ Build terminé dans $(APP_DIR)/dist/"

# ==================== NETTOYAGE ====================

## Nettoie les fichiers générés
clean:
	@echo "🧹 Nettoyage..."
	rm -rf $(VENV)
	rm -rf $(APP_DIR)/node_modules
	rm -rf $(APP_DIR)/dist
	@echo "✅ Nettoyage terminé!"

## Nettoie uniquement les données
clean-data:
	@echo "🧹 Suppression des données..."
	rm -rf $(APP_DIR)/public/data/osm/*.geojson
	rm -f $(APP_DIR)/public/data/population.json
	rm -f $(APP_DIR)/public/data/roads_friction.json
	@echo "✅ Données supprimées!"
