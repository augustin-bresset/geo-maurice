import json
import math
from pathlib import Path

# Grid BBox from heatmap.js
GRID_BBOX = {
    'minLat': -20.60,
    'maxLat': -19.40,
    'minLon': 57.20,
    'maxLon': 63.60,
    'step': 0.002
}

def check_points():
    file_path = Path("geo-maurice-app/public/data/osm/clinic.geojson")
    if not file_path.exists():
        print(f"File not found: {file_path}")
        return

    with open(file_path, "r") as f:
        data = json.load(f)

    print(f"Total features in clinic.geojson: {len(data['features'])}")

    valid_count = 0
    invalid_count = 0
    
    min_lat = GRID_BBOX['minLat']
    max_lat = GRID_BBOX['maxLat']
    min_lon = GRID_BBOX['minLon']
    max_lon = GRID_BBOX['maxLon']
    step = GRID_BBOX['step']
    
    width = math.ceil((max_lon - min_lon) / step)
    height = math.ceil((max_lat - min_lat) / step)
    
    print(f"Grid Size: {width} x {height}")

    for feat in data['features']:
        coords = feat['geometry']['coordinates']
        lon, lat = coords[0], coords[1]
        
        # heatmap.js logic
        # const y = Math.floor((p.lat - minLat) / step);
        # const x = Math.floor((p.lon - minLon) / step);
        
        y = math.floor((lat - min_lat) / step)
        x = math.floor((lon - min_lon) / step)
        
        is_inside = (x >= 0 and x < width and y >= 0 and y < height)
        
        if is_inside:
            valid_count += 1
        else:
            invalid_count += 1
            print(f"Point OUTSIDE: {feat.get('properties', {}).get('name')} ({lat}, {lon}) -> Index ({x}, {y})")

    print(f"\nSummary:")
    print(f"Valid Points (Inside Grid): {valid_count}")
    print(f"Invalid Points (Outside): {invalid_count}")

if __name__ == "__main__":
    check_points()
