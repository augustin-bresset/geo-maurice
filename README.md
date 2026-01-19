# Geo Maurice

An interactive map application for visualizing amenities and services in Mauritius.

## Project Structure

- **geo-maurice-app/**: The React frontend application (Vite + Leaflet).
- **scripts/**: Python scripts for fetching and processing OSM data.
- **data/**: Contains raw data files (CSVs, Shapefiles).
  - `shapefiles/`: Tourist spots shapefiles.
  - `*.csv`: Various raw datasets.

## Prerequisites

- Node.js (v18+ recommended)
- Python 3.8+

## Installation

### 1. Setup Python Environment & Dependencies

Install the required Python packages for the data fetching scripts:

```bash
pip install -r requirements.txt
```

### 2. Setup Frontend Application

Navigate to the application directory and install dependencies:

```bash
cd geo-maurice-app
npm install
```

## Data Preparation

Before running the application, you may want to fetch the latest data from OpenStreetMap. The `fetch_osm.py` script queries OSM for various amenities (Health, Security, Education, etc.) and saves them as GeoJSON files directly into the frontend's public directory (`geo-maurice-app/public/data/osm`).

To run the fetch script:

```bash
python scripts/fetch_osm.py
```

This will create/update the GeoJSON files used by the application to display points of interest.

## Running the Application

Start the development server:

```bash
cd geo-maurice-app
npm run dev
```

Open your browser and navigate to the URL shown (usually `http://localhost:5173`).

### Stopping the Application

To stop the development server, press `Ctrl + C` in the terminal where the server is running.

### Building for Production

To create a production-ready build of the application:

```bash
cd geo-maurice-app
npm run build
```

The built files will be in the `dist` directory.


## Scripts Overview

- **scripts/fetch_osm.py**: Main script to fetch amenity data from OSM using Overpass API.
- **scripts/amenities.py**: Defines the categories and lists of amenities to fetch.
- **scripts/fetch_point_mauritus.py**: Utility script for fetching points (imported by `fetch_osm.py`).

## Data Sources

- **OpenStreetMap**: Primary source for dynamic amenity data.

