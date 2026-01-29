import requests
from pathlib import Path

# Mauritius approximates:
# Zoom level 10 seems appropriate for a whole island overview
# Center Lat/Lon: -20.2, 57.5
# Tile coordinates for Z=10
# X = 690, Y = 568 (approx)

import math

def latlon_to_tile(lat, lon, zoom):
    n = 2.0 ** zoom
    xtile = int((lon + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2.0 * n)
    return (xtile, ytile)

def fetch_dem():
    print("Fetching High-Res DEM (Elevation) Data for Mauritius (Zoom 12)...")
    
    # Mauritius Bounds
    min_lat, max_lat = -20.55, -19.95
    min_lon, max_lon = 57.30, 57.85
    zoom = 12
    
    min_x, min_y = latlon_to_tile(max_lat, min_lon, zoom) # Top Left
    max_x, max_y = latlon_to_tile(min_lat, max_lon, zoom) # Bottom Right
    
    print(f"Tile Range: X[{min_x}-{max_x}], Y[{min_y}-{max_y}]")
    
    for x in range(min_x, max_x + 1):
        for y in range(min_y, max_y + 1):
            url = f"https://s3.amazonaws.com/elevation-tiles-prod/geotiff/{zoom}/{x}/{y}.tif"
            filename = f"mauritius_dem_z{zoom}_{x}_{y}.tif"
            output_path = Path(__file__).parent.parent / "geo-maurice-app" / "public" / "data" / "hazards" / filename
            
            if output_path.exists():
                print(f"Skipping {filename} (already exists)")
                continue
                
            print(f"Downloading tile {x}/{y}...")
            
            try:
                response = requests.get(url, stream=True)
                if response.status_code == 200:
                    with open(output_path, 'wb') as f:
                        for chunk in response.iter_content(chunk_size=8192):
                            f.write(chunk)
                    print(f"✔ Saved {filename}")
                else:
                    print(f"Failed to download {url}: HTTP {response.status_code}")
            except Exception as e:
                print(f"Error downloading {x}/{y}: {e}")
            
    print("\nHigh-res DEM download complete. Now run 'generate_flood_model.py' to update the risk map.")

if __name__ == "__main__":
    fetch_dem()
