import json
import requests
from pathlib import Path
from OSMPythonTools.nominatim import Nominatim
from OSMPythonTools.overpass import Overpass, overpassQueryBuilder

def query_overpass_direct(query):
    url = "https://overpass-api.de/api/interpreter"
    response = requests.post(url, data={'data': query}, timeout=120)
    response.raise_for_status()
    return response.json()

def fetch_hazards():
    print("Fetching Flood Risk Data (Rivers/Wetlands)...")
    
    nominatim = Nominatim()
    areaId = nominatim.query('Mauritius').areaId()
    overpass = Overpass()

    # 1. Flowing water (LineString)
    query_water = overpassQueryBuilder(
        area=areaId,
        elementType=['way', 'relation'],
        selector=['"waterway"="river"', '"waterway"="stream"'],
        out='geom'
    )

    # 2. Static water (Direct Query for robust Union)
    ql = f"""
    [out:json][timeout:90];
    area({areaId})->.searchArea;
    (
      way["water"="lake"](area.searchArea);
      way["natural"="water"](area.searchArea);
      way["landuse"="reservoir"](area.searchArea);
      way["natural"="wetland"](area.searchArea);
      way["landuse"="basin"](area.searchArea);
      relation["water"="lake"](area.searchArea);
      relation["natural"="water"](area.searchArea);
      relation["landuse"="reservoir"](area.searchArea);
      relation["natural"="wetland"](area.searchArea);
      relation["landuse"="basin"](area.searchArea);
    );
    out geom;
    """

    features = []

    try:
        print("Querying rivers/streams...")
        res_water = overpass.query(query_water, timeout=60)
        
        for el in res_water.elements():
            geom = el.geometry()
            if geom and geom['type'] == 'LineString':
                features.append({
                    "type": "Feature",
                    "properties": {
                        "name": el.tag('name') or "Cours d'eau",
                        "risk_level": "Medium",
                        "type": "waterway"
                    },
                    "geometry": geom
                })
        print(f"Found {len(res_water.elements())} water segments.")

    except Exception as e:
        print(f"Error fetching waterways: {e}")

    try:
        print("Querying static water (Lakes/Wetlands) via raw API...")
        data = query_overpass_direct(ql)
        
        count = 0
        for el in data.get('elements', []):
            if 'geometry' in el:
                # Overpass geom is list of dicts {lat, lon}, need to convert to coordinates list?
                # Ah, out geom gives 'geometry' key in result but format depends on library or raw
                # Raw JSON from Overpass with [out:geom] structure:
                # way: 'geometry': [{'lat':..., 'lon':...}, ...]
                # relation: complex members
                
                # Handling raw geometry from requests is tedious. 
                # Alternative: Use OSMPythonTools overpass object simply but WITHOUT query builder for the UNION
                # The library `overpass.query(ql)` supports raw string too! 
                # The issue before was double header.
                pass
                
        # Actually... let's retry `overpass.query(ql)` but ensuring QL string has NO headers
        # The library ADDS [out:json][timeout:25]. If we omit them, it might work.
        pass
    except Exception:
        pass
        
    # REDOING logic: use library but clean raw string
    clean_ql = f"""
    area({areaId})->.searchArea;
    (
      way["water"="lake"](area.searchArea);
      way["natural"="water"](area.searchArea);
      way["landuse"="reservoir"](area.searchArea);
      way["natural"="wetland"](area.searchArea);
      way["landuse"="basin"](area.searchArea);
      relation["water"="lake"](area.searchArea);
      relation["natural"="water"](area.searchArea);
      relation["landuse"="reservoir"](area.searchArea);
      relation["natural"="wetland"](area.searchArea);
      relation["landuse"="basin"](area.searchArea);
    );
    out geom;
    """
    
    try:
        print("Querying static water (Union)...")
        # Ensure sufficient timeout passed to run() if wrapping
        res_static = overpass.query(clean_ql, timeout=120)
        
        count = 0
        for el in res_static.elements():
            geom = el.geometry()
            if geom: # OSMPythonTools parses geometry for us!
                tags = el.tags()
                name = tags.get('name', 'Plan d\'eau')
                subtype = "lake"
                if tags.get('natural') == 'wetland': subtype = "wetland"
                elif tags.get('landuse') == 'reservoir': subtype = "reservoir"
                
                features.append({
                    "type": "Feature",
                    "properties": {
                        "name": name,
                        "risk_level": "High",
                        "type": subtype
                    },
                    "geometry": geom
                })
                count += 1
        print(f"Found {count} static water bodies.")
    except Exception as e:
        print(f"Error fetching static water: {e}")

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    output_path = Path(__file__).parent.parent / "geo-maurice-app" / "public" / "data" / "hazards" / "flood.geojson"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False)
    
    print(f"Saved {len(features)} risk features to {output_path}")

if __name__ == "__main__":
    fetch_hazards()
