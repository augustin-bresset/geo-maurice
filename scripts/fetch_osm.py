##
#%%
import os
import json
from pathlib import Path
from OSMPythonTools.nominatim import Nominatim
from OSMPythonTools.overpass import Overpass, overpassQueryBuilder


# ============================================================
# 1) Définition des catégories d’amenities
# ============================================================

health_amenities = [
    "hospital", "clinic", "doctors", "dentist", "pharmacy",
    "nursing_home", "social_facility", "first_aid", "blood_donation"
]

security_amenities = [
    "police", "fire_station", "ambulance_station",
    "rescue_station", "lifeguard", "lifeguard_tower"
]

education_amenities = [
    "school", "kindergarten", "college", "university", "library"
]

public_amenities = [
    "townhall", "courthouse", "embassy", "community_centre",
    "public_building", "government", "post_office", "post_box"
]

transport_amenities = [
    "bus_station", "bus_stop", "taxi", "ferry_terminal",
    "fuel", "charging_station", "parking",
    "bicycle_parking", "motorcycle_parking"
]

hygiene_amenities = [
    "drinking_water", "toilets", "shower", "water_point",
    "waste_disposal", "recycling"
]

commercial_amenities = [
    "marketplace", "bank", "atm", "vending_machine", "money_transfer"
]

tourism_amenities = [
    "restaurant", "fast_food", "cafe", "bar", "pub", "ice_cream"
]


ALL_AMENITY_GROUPS = {
    "health": health_amenities,
    "security": security_amenities,
    "education": education_amenities,
    "public": public_amenities,
    "transport": transport_amenities,
    "hygiene": hygiene_amenities,
    "commercial": commercial_amenities,
    "tourism": tourism_amenities
}


# ============================================================
# 2) Fonction d'extraction Overpass (ta fonction, inchangée)
# ============================================================

def fetch_points_mauritius(point):
    """Fetch OSM elements with amenity=point in Mauritius."""
    nominatim = Nominatim()
    areaId = nominatim.query('Mauritius').areaId()

    query = overpassQueryBuilder(
        area=areaId,
        elementType=['node', 'way', 'relation'],
        selector=f'"amenity"="{point}"',
        out='center'
    )

    overpass = Overpass()
    result = overpass.query(query)

    points = []
    for el in result.elements():
        lat = el.centerLat()
        lon = el.centerLon()
        if lat is None or lon is None:
            continue

        name = el.tag('name') or "Unknown"

        points.append({
            "id": el.id(),
            "name": name,
            "lat": lat,
            "lon": lon
        })

    return points


# ============================================================
# 3) Création automatique des dossiers + export JSON
# ============================================================

def save_points(point, points, base_dir=None):
    """
    Save points to data/osm/<point>.geojson
    in valid GeoJSON FeatureCollection format.
    """
    if len(points) == 0:
        print(f"[WARN] No points to save for '{point}'. Skipping.")
        return
        
    if base_dir is None:
        # Default to ../geo-maurice-app/public/data/osm relative to this script
        base_dir = Path(__file__).parent.parent / "geo-maurice-app" / "public" / "data" / "osm"
        
    folder = Path(base_dir) 
    folder.mkdir(parents=True, exist_ok=True)

    file_path = folder / f"{point}.geojson"

    # Structure GeoJSON
    geojson = {
        "type": "FeatureCollection",
        "features": []
    }

    for p in points:
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [p["lon"], p["lat"]]  # (lon, lat)
            },
            "properties": {
                "id": p["id"],
                "name": p["name"],
                "amenity": point
            }
        }
        geojson["features"].append(feature)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, indent=2, ensure_ascii=False)

    print(f"✔ Saved {len(points)} entries to {file_path}")

# ============================================================
# 4) Script principal
# ============================================================

if __name__ == "__main__":
    print("\n=== Fetching OSM amenities for Mauritius ===\n")

    for group_name, amenity_list in ALL_AMENITY_GROUPS.items():
        print(f"\n--- Category: {group_name} ---")

        for point in amenity_list:
            print(f"Fetching '{point}'...", end=" ")

            try:
                pts = fetch_points_mauritius(point)
                print(f"{len(pts)} found.")
                save_points(point, pts)

            except Exception as e:
                print(f"ERROR → {e}")

# %%
