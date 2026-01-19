import os
import requests
import rasterio
import json
import numpy as np
from pathlib import Path

# Configuration
# Correct URL Pattern for UNadj 1km:
URL = "https://data.worldpop.org/GIS/Population/Global_2000_2020_1km_UNadj/2020/MUS/mus_ppp_2020_1km_Aggregated_UNadj.tif"



DATA_DIR = Path(__file__).parent.parent / "data"
PUBLIC_DATA_DIR = Path(__file__).parent.parent / "geo-maurice-app/public/data"
RAW_FILE = DATA_DIR / "population_2020_1km.tif"
OUTPUT_FILE = PUBLIC_DATA_DIR / "population.json"

# Bounding box of our map
GRID_BBOX = {
    'minLat': -20.55,
    'maxLat': -19.95,
    'minLon': 57.3,
    'maxLon': 57.8,
    'step': 0.002 # Same as heatmap.js resolution
}

def download_file(url, target_path):
    print(f"Downloading {url}...")
    target_path.parent.mkdir(parents=True, exist_ok=True)
    
    if target_path.exists():
        print("File already exists, skipping download.")
        return

    resp = requests.get(url, stream=True)
    resp.raise_for_status()
    
    with open(target_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)
    print("Download complete.")

def process_raster():
    print("Processing raster data...")
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with rasterio.open(RAW_FILE) as src:
        print(f"Raster size: {src.width}x{src.height}")
        print(f"Bounds: {src.bounds}")
        
        # We need to resample/interpolate this to match our application grid
        # Our app uses a regular grid defined by GRID_BBOX
        
        min_lat = GRID_BBOX['minLat']
        max_lat = GRID_BBOX['maxLat']
        min_lon = GRID_BBOX['minLon']
        max_lon = GRID_BBOX['maxLon']
        step = GRID_BBOX['step']
        
        width = int(np.ceil((max_lon - min_lon) / step))
        height = int(np.ceil((max_lat - min_lat) / step))
        
        print(f"Target Grid: {width}x{height}")
        
        values = np.zeros((height, width), dtype=np.float32)
        
        # Inefficient but simple sampling method for now (nearest neighbor or sample at point)
        # Iterate over our target grid and sample from raster
        
        # Note: Rasterio sample expects list of (x, y) coordinates
        samples = []
        for y in range(height):
            # Calculate Lat for this row (Grid 0 is MinLat? No, usually MaxLat is top for images)
            # But our loop in heatmap.js is: for (let lat = minLat; lat <= maxLat...)
            # so row 0 is minLat.
            
            # For raster sampling, we just need correct coords
            # Let's stick to our heatmap logic: index 0 is minLat
            
            grid_lat = min_lat + y * step 
            
            for x in range(width):
                grid_lon = min_lon + x * step
                samples.append((grid_lon, grid_lat))
        
        # Perform sampling
        # rasterio.sample returns a generator of arrays
        sampled_values = list(src.sample(samples))
        
        # Convert to 1D flat array matched to our grid logic
        # sampled_values is list of [val], process nodata
        
        flat_values = []
        max_val = 0
        
        for val in sampled_values:
            v = val[0]
            if v < 0: v = 0 # NoData usually -9999
            if np.isnan(v): v = 0
            
            flat_values.append(float(v))
            if v > max_val: max_val = v

        output_data = {
            "width": width,
            "height": height,
            "minLat": min_lat,
            "maxLat": max_lat,
            "minLon": min_lon,
            "maxLon": max_lon,
            "step": step,
            "maxScore": float(max_val),
            "values": flat_values # Json handles list of floats
        }
        
        print(f"Max population density found: {max_val}")
        
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(output_data, f)
            
        print(f"Saved processed grid to {OUTPUT_FILE}")

if __name__ == "__main__":
    download_file(URL, RAW_FILE)
    process_raster()
