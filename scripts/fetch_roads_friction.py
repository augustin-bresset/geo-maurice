#!/usr/bin/env python3
"""
Fetch OSM road data for Mauritius and create a friction grid.
Friction values are based on road proximity and type.
"""

import json
import numpy as np
from pathlib import Path
from OSMPythonTools.nominatim import Nominatim
from OSMPythonTools.overpass import Overpass, overpassQueryBuilder
from scipy.ndimage import distance_transform_edt

# Configuration
DATA_DIR = Path(__file__).parent.parent / "data"
PUBLIC_DATA_DIR = Path(__file__).parent.parent / "geo-maurice-app/public/data"
OUTPUT_FILE = PUBLIC_DATA_DIR / "roads_friction.json"

# Same grid as heatmap.js and population.json
GRID_BBOX = {
    'minLat': -20.60,
    'maxLat': -19.40,
    'minLon': 57.20,
    'maxLon': 63.60,
    'step': 0.002  # ~200m resolution
}

# Road types and their friction values (lower = faster travel)
ROAD_FRICTION = {
    'motorway': 1.0,
    'motorway_link': 1.1,
    'trunk': 1.1,
    'trunk_link': 1.2,
    'primary': 1.2,
    'primary_link': 1.3,
    'secondary': 1.5,
    'secondary_link': 1.6,
    'tertiary': 1.8,
    'tertiary_link': 1.9,
    'residential': 2.0,
    'unclassified': 2.5,
    'service': 2.5,
    'living_street': 2.5,
    'track': 3.0,
    'path': 4.0,
}

# Default friction for areas far from roads
MAX_FRICTION = 5.0


def fetch_roads():
    """Fetch all road segments from OSM for Mauritius."""
    print("Fetching roads from OSM...")
    
    nominatim = Nominatim()
    areaId = nominatim.query('Mauritius').areaId()
    
    # Query all highway types
    road_types = list(ROAD_FRICTION.keys())
    
    overpass = Overpass()
    all_roads = []
    
    for road_type in road_types:
        print(f"  Fetching {road_type}...", end=" ")
        
        query = overpassQueryBuilder(
            area=areaId,
            elementType=['way'],
            selector=f'"highway"="{road_type}"',
            out='geom'
        )
        
        try:
            result = overpass.query(query, timeout=60)
            count = 0
            
            for element in result.elements():
                geom = element.geometry()
                if geom and 'coordinates' in geom:
                    coords = geom['coordinates']
                    all_roads.append({
                        'type': road_type,
                        'friction': ROAD_FRICTION[road_type],
                        'coords': coords
                    })
                    count += 1
            
            print(f"{count} ways")
        except Exception as e:
            print(f"ERROR: {e}")
    
    print(f"Total roads fetched: {len(all_roads)}")
    return all_roads


def create_friction_grid(roads):
    """Create a friction grid from road data."""
    print("Creating friction grid...")
    
    min_lat = GRID_BBOX['minLat']
    max_lat = GRID_BBOX['maxLat']
    min_lon = GRID_BBOX['minLon']
    max_lon = GRID_BBOX['maxLon']
    step = GRID_BBOX['step']
    
    width = int(np.ceil((max_lon - min_lon) / step))
    height = int(np.ceil((max_lat - min_lat) / step))
    
    print(f"Grid size: {width}x{height}")
    
    # Initialize with max friction (no roads)
    friction_grid = np.full((height, width), MAX_FRICTION, dtype=np.float32)
    
    # Mark road pixels with their friction values
    road_mask = np.zeros((height, width), dtype=np.uint8)
    
    def process_coords(coords, friction):
        """Recursively process coordinates, handling nested structures."""
        if not coords:
            return
        
        # Check if this is a coordinate pair [lon, lat]
        if isinstance(coords[0], (int, float)):
            lon, lat = coords[0], coords[1]
            x = int((lon - min_lon) / step)
            y = int((lat - min_lat) / step)
            
            if 0 <= x < width and 0 <= y < height:
                if friction < friction_grid[y, x]:
                    friction_grid[y, x] = friction
                road_mask[y, x] = 1
        else:
            # It's a list of coordinates or nested structure
            for item in coords:
                if isinstance(item, (list, tuple)):
                    process_coords(item, friction)
    
    for road in roads:
        process_coords(road['coords'], road['friction'])
    
    print(f"Pixels with roads: {np.sum(road_mask)}")
    
    # Interpolate friction for pixels between roads
    # Use distance transform to spread road influence
    print("Interpolating friction values...")
    
    # Distance from each pixel to nearest road (in pixels)
    distances = distance_transform_edt(1 - road_mask)
    
    # For each non-road pixel, interpolate friction based on distance
    # Friction increases with distance from roads
    # At ~10 pixels (~2km), friction reaches MAX_FRICTION
    decay_distance = 10  # pixels
    
    for y in range(height):
        for x in range(width):
            if road_mask[y, x] == 0:
                dist = distances[y, x]
                # Find nearest road friction
                # For simplicity, use average road friction as base
                base_friction = 1.5  # Average road
                
                # Interpolate: friction increases with distance
                t = min(1.0, dist / decay_distance)
                friction_grid[y, x] = base_friction + t * (MAX_FRICTION - base_friction)
    
    return friction_grid, width, height


def save_grid(friction_grid, width, height):
    """Save friction grid to JSON in same format as population.json."""
    print(f"Saving to {OUTPUT_FILE}...")
    
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    # Flatten to 1D array (row-major, matching population.json)
    flat_values = friction_grid.flatten().tolist()
    
    output_data = {
        "width": width,
        "height": height,
        "minLat": GRID_BBOX['minLat'],
        "maxLat": GRID_BBOX['maxLat'],
        "minLon": GRID_BBOX['minLon'],
        "maxLon": GRID_BBOX['maxLon'],
        "step": GRID_BBOX['step'],
        "maxScore": float(MAX_FRICTION),
        "values": flat_values
    }
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output_data, f)
    
    print(f"Saved! File size: {OUTPUT_FILE.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    print("=== Fetching OSM Roads for Mauritius ===\n")
    
    roads = fetch_roads()
    
    if len(roads) == 0:
        print("No roads found! Check OSM query.")
        exit(1)
    
    friction_grid, width, height = create_friction_grid(roads)
    save_grid(friction_grid, width, height)
    
    print("\nDone!")
