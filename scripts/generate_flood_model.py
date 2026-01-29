import rasterio
from rasterio.merge import merge
from rasterio.features import rasterize, shapes
from rasterio.warp import reproject, Resampling
import geopandas as gpd
import numpy as np
from scipy.ndimage import distance_transform_edt, gaussian_filter
from pathlib import Path
import json
from shapely.geometry import shape, mapping

def generate_hand_model():
    print("Generating HAND Flood Model...")
    
    # Paths
    base_dir = Path(__file__).parent.parent
    hazards_dir = base_dir / "geo-maurice-app" / "public" / "data" / "hazards"
    dem_files = list(hazards_dir.glob("mauritius_dem_z*_*.tif"))
    river_file = hazards_dir / "flood.geojson"
    output_file = hazards_dir / "flood_model.geojson"

    if not dem_files:
        print("❌ No DEM files found. Run fetch_dem.py first.")
        return
    
    if not river_file.exists():
        print("❌ No river data found. Run fetch_hazards.py first.")
        return

    # 1. Merge DEM Tiles
    print(f"Merging {len(dem_files)} DEM tiles...")
    src_files_to_mosaic = []        
    for fp in dem_files:
        src = rasterio.open(fp)
        src_files_to_mosaic.append(src)
    
    mosaic, out_trans = merge(src_files_to_mosaic)
    out_meta = src.meta.copy()
    out_meta.update({
        "driver": "GTiff",
        "height": mosaic.shape[1],
        "width": mosaic.shape[2],
        "transform": out_trans,
        "crs": src.crs
    })

    # Elevation Grid (handle nodata)
    dem_grid = mosaic[0]
    # Replace weird negative values or nodata with high value or NaN
    # dem_grid[dem_grid < -100] = 9999 

    # 2. Rasterize Rivers
    print("Rasterizing rivers...")
    rivers_gdf = gpd.read_file(river_file)
    
    # Filter rivers (LineString) and wetlands (Polygon)
    # Convert all to a common format or just use is_valid check
    valid_types = ['LineString', 'MultiLineString', 'Polygon', 'MultiPolygon']
    rivers_gdf = rivers_gdf[rivers_gdf.geometry.type.isin(valid_types)]
    
    if rivers_gdf.empty:
        print("No river lines found.")
        return

    print(f"DEM CRS: {src.crs}, Rivers CRS: {rivers_gdf.crs}")
    if rivers_gdf.crs != src.crs:
        print("Re-projecting rivers to match DEM...")
        rivers_gdf = rivers_gdf.to_crs(src.crs)

    # Use 1 for river pixels, 0 for others
    river_mask = rasterize(
        shapes=rivers_gdf.geometry,
        out_shape=dem_grid.shape,
        transform=out_trans,
        fill=0,
        all_touched=True, # Improved connectivity
        default_value=1
    )
    
    print(f"River Mask Sum: {river_mask.sum()} pixels")
    if river_mask.sum() == 0:
        print("❌ Rasterization failed. Rivers might be outside DEM bounds.")
        print(f"DEM Bounds: {src.bounds}")
        print(f"River Bounds: {rivers_gdf.total_bounds}")
        return

    # 3. Compute Nearest River Elevation (Allocation)
    
    print("Computing distance transform...")
    # Invert mask: 0 is target (river), 1 is background for EDT
    # exact_edt computes distance to nearest zero
    indices = distance_transform_edt(1 - river_mask, return_distances=False, return_indices=True)
    
    nearest_y = indices[0]
    nearest_x = indices[1]
    
    # Fetch elevation of the nearest river pixel
    reference_elevation = dem_grid[nearest_y, nearest_x]
    
    # 4. Compute HAND
    print("Calculating relative height (HAND)...")
    hand_grid = dem_grid - reference_elevation
    
    # Filter invalid: negative HAND (local depressions) -> 0
    hand_grid[hand_grid < 0] = 0
    
    # SMOOTHING to reduce "voronoi" abrupt cuts
    print("Smoothing terrain analysis (Sigma=2)...")
    hand_grid = gaussian_filter(hand_grid, sigma=2)
    
    # 5. Thresholding
    print("Creating risk zones...")
    
    risk_grid = np.zeros_like(hand_grid, dtype=np.uint8)
    
    # Using 10m and 20m as conservative thresholds for plain simulation
    risk_grid[(hand_grid > 0) & (hand_grid <= 5)] = 2 # High
    risk_grid[(hand_grid > 5) & (hand_grid <= 15)] = 1 # Medium (Warning)
    
    # Mask out ocean/nodata (crucial fix for artifacts)
    # 1. Basic Elevation Filter
    print("Masking by Elevation <= 0m...")
    risk_grid[dem_grid <= 0] = 0
    
    # 2. Strict Land Mask using District Boundaries
    land_file = base_dir / "geo-maurice-app" / "public" / "data" / "districts_mauritius.geojson"
    if land_file.exists():
        print("Applying Land Mask from districts...")
        land_gdf = gpd.read_file(land_file)
        if land_gdf.crs != src.crs:
            land_gdf = land_gdf.to_crs(src.crs)
            
        land_mask = rasterize(
            shapes=land_gdf.geometry,
            out_shape=dem_grid.shape,
            transform=out_trans,
            fill=0,
            default_value=1,
            all_touched=True
        )
        # Clear risk pixels that are not on land
        risk_grid[land_mask == 0] = 0
        print(f"Land Mask applied. Active pixels: {land_mask.sum()}")
    else:
        print("⚠️ District file not found, skipping land mask.")

    # 6. Generate Raster Output for Client-Side Simulation
    print("Generating Raster Map for Dynamic Simulation...")
    
    # Normalize HAND grid to 0-255 for PNG export
    # We focus on the precision in the 0-820m range (Full Island Coverage)
    # PRECISION FIX: Use Square Root encoding to favor low altitudes.
    # Val = 255 * sqrt(h / 820)
    MAX_HAND_M = 820.0
    
    # Copy grid
    raster_grid = hand_grid.copy()
    
    height, width = raster_grid.shape
    rgba = np.zeros((height, width, 4), dtype=np.uint8)
    
    # SQRT Scaling
    # Avoid div by zero
    safe_grid = raster_grid.copy()
    safe_grid[safe_grid < 0] = 0
    safe_grid[safe_grid > MAX_HAND_M] = MAX_HAND_M # Clamp
    
    scaled = np.sqrt(safe_grid / MAX_HAND_M) * 255.0
    
    # Assign to Red Channel
    rgba[..., 0] = scaled.astype(np.uint8) 
    rgba[..., 1] = 0
    rgba[..., 2] = 0
    
    # Alpha Channel setup
    alpha = np.ones_like(raster_grid, dtype=np.uint8) * 255
    alpha[dem_grid <= 0] = 0 # Ocean
    
    try:
        land_file = base_dir / "geo-maurice-app" / "public" / "data" / "districts_mauritius.geojson"
        if land_file.exists():
            land_gdf = gpd.read_file(land_file)
            if land_gdf.crs != src.crs:
                land_gdf = land_gdf.to_crs(src.crs)
            
            land_mask_raster = rasterize(
                shapes=land_gdf.geometry,
                out_shape=dem_grid.shape,
                transform=out_trans,
                fill=0,
                default_value=1,
                all_touched=True
            )
            alpha[land_mask_raster == 0] = 0
    except Exception as e:
        print(f"Warning: Could not apply land mask to raster: {e}")
        
    rgba[..., 3] = alpha

    from PIL import Image
    img = Image.fromarray(rgba, 'RGBA')
    png_path = hazards_dir / "flood_hand.png"
    img.save(png_path, optimize=True)
    print(f"✔ Saved HAND Raster to {png_path}")
    
    # Metadata update
    bounds = rasterio.transform.array_bounds(height, width, out_trans)
    from pyproj import Transformer
    transformer = Transformer.from_crs(src.crs, "EPSG:4326", always_xy=True)
    min_lon, min_lat = transformer.transform(bounds[0], bounds[1])
    max_lon, max_lat = transformer.transform(bounds[2], bounds[3])
    
    metadata = {
        "bounds": [[min_lat, min_lon], [max_lat, max_lon]], 
        "max_height": MAX_HAND_M,
        "width": width,
        "height": height,
        "encoding": "sqrt" 
    }
    
    meta_path = hazards_dir / "flood_metadata.json"
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"✔ Saved Metadata to {meta_path}")

    # 7. Generate Absolute DEM Raster for "Sea Level Rise" Simulation
    print("Generating Sea Level Rise Map (Absolute Elevation)...")
    
    dem_raster = dem_grid.copy()
    
    rgba_sl = np.zeros((height, width, 4), dtype=np.uint8)
    
    # DEBUG: DEM Stats
    print(f"[DEBUG] DEM Stats: Min={np.nanmin(dem_raster):.2f}, Max={np.nanmax(dem_raster):.2f}, Mean={np.nanmean(dem_raster):.2f}")
    # Count land pixels below 50m
    pixels_below_50 = np.sum((dem_raster > 0) & (dem_raster < 50))
    total_land = np.count_nonzero(land_mask_raster)
    print(f"[DEBUG] Land Pixels < 50m: {pixels_below_50} / {total_land} ({pixels_below_50/total_land*100:.1f}%)")

    # SQRT Scaling for Sea Level
    dem_safe = dem_raster.copy()
    dem_safe[dem_safe < 0] = 0
    dem_safe[dem_safe > MAX_HAND_M] = MAX_HAND_M
    
    scaled_sl = np.sqrt(dem_safe / MAX_HAND_M) * 255.0
    
    rgba_sl[..., 0] = scaled_sl.astype(np.uint8)
    rgba_sl[..., 1] = 0
    rgba_sl[..., 2] = 0
    
    alpha_sl = np.ones_like(dem_raster, dtype=np.uint8) * 255
    alpha_sl[dem_raster <= 0] = 0
    
    # Apply District Mask
    alpha_sl[land_mask_raster == 0] = 0
    
    rgba_sl[..., 3] = alpha_sl

    img_sl = Image.fromarray(rgba_sl, 'RGBA')
    sl_path = hazards_dir / "sea_level.png"
    img_sl.save(sl_path, optimize=True)
    print(f"✔ Saved Sea Level Raster to {sl_path}")

    # (Optional) Still save vector for legacy/comparison if needed
    # ... code below vectorizes ...
    print("Vectorizing result (keeping legacy Poly support)...")
    results = (
        {'properties': {'risk_code': v}, 'geometry': s}
        for i, (s, v) 
        in enumerate(shapes(risk_grid, mask=risk_grid > 0, transform=out_trans))
    )
    
    features = []
    for geom_item in results:
        code = geom_item['properties']['risk_code']
        risk_level = "High" if code == 2 else "Medium"
        
        features.append({
            "type": "Feature",
            "properties": {
                "risk_level": risk_level,
                "type": "risk_zone"
            },
            "geometry": geom_item['geometry']
        })
        
    # Create GeoDataFrame from features to handle projection easily
    if features:
        temp_gdf = gpd.GeoDataFrame.from_features(features)
        temp_gdf.set_crs(src.crs, allow_override=True, inplace=True)
        final_gdf = temp_gdf.to_crs("EPSG:4326")
        final_gdf.to_file(output_file, driver='GeoJSON')
        print(f"✔ Saved Legacy HAND vector model to {output_file}")
    else:
        print("⚠️ No risk zones found to vectorize.")
    # 8. Generate Aligned Population Raster
    print("Generating Aligned Population Map...")
    pop_file = base_dir / "data" / "population_2020_1km.tif"
    if pop_file.exists():
        with rasterio.open(pop_file) as src_pop:
            # We need to reproject the population data (LatLon) to match the DEM grid (Mercator)
            # Create a destination array matching DEM shape
            pop_grid = np.zeros_like(dem_raster, dtype=np.float32)
            
            reproject(
                source=rasterio.band(src_pop, 1),
                destination=pop_grid,
                src_transform=src_pop.transform,
                src_crs=src_pop.crs,
                dst_transform=out_trans,
                dst_crs=src.crs,
                resampling=Resampling.bilinear
            )
            
            # Normalize Population for visualization
            # Find max reasonably 
            max_pop = np.nanmax(pop_grid)
            print(f"Max Population Density (reprojected): {max_pop}")
            if max_pop > 0:
                # Scale to 0-255
                # Using sqrt or log might be better for visibility, but linear for now
                scaled_pop = (pop_grid / max_pop) * 255
                scaled_pop[scaled_pop > 255] = 255
                scaled_pop[scaled_pop < 0] = 0
                
                rgba_pop = np.zeros((height, width, 4), dtype=np.uint8)
                # We store density in Red channel
                rgba_pop[..., 0] = scaled_pop.astype(np.uint8)
                rgba_pop[..., 1] = 0 
                rgba_pop[..., 2] = 0
                
                # Alpha - 0 if no pop? No, likely full alpha so we can multiply later
                # Or transparent if 0?
                # Let's make it transparent where 0 population to save processing
                alpha_pop = np.ones_like(pop_grid, dtype=np.uint8) * 255
                alpha_pop[pop_grid <= 0.1] = 0 # Empty areas
                rgba_pop[..., 3] = alpha_pop
                
                img_pop = Image.fromarray(rgba_pop, 'RGBA')
                pop_out = hazards_dir / "flood_population.png"
                img_pop.save(pop_out, optimize=True)
                print(f"✔ Saved Population Raster to {pop_out}")
            else:
                 print("⚠️ Population grid is empty after reprojection.")
    else:
        print("⚠️ Population file not found, skipping population raster.")
if __name__ == "__main__":
    generate_hand_model()
