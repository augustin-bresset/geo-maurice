##
#%%
import requests
import json

import requests
from OSMPythonTools.nominatim import Nominatim
from OSMPythonTools.overpass import Overpass, overpassQueryBuilder

def fetch_points_mauritius(point):
    # 1. Résolution de "Mauritius" → areaId OSM
    nominatim = Nominatim()
    areaId = nominatim.query('Mauritius').areaId()

    # 2. Construction de la requête Overpass
    query = overpassQueryBuilder(
        area=areaId,
        elementType=['node', 'way', 'relation'],   # on prend tout
        selector=f'"amenity"="{point}"',
        out='center'  # → renvoie lat/lon même pour un building (way)
    )

    # 3. Envoi de la requête
    overpass = Overpass()
    result = overpass.query(query)

    points = []
    for el in result.elements():
        # extraction du centre géométrique
        lat = el.centerLat()
        lon = el.centerLon()

        name = el.tag('name') or 'Unknown'

        if lat is None or lon is None:
            continue

        points.append({
            'id': el.id(),
            'name': name,
            'lat': lat,
            'lon': lon
        })

    return points



if __name__ == "__main__":
    # point = "hospital"
    # hs = fetch_points_mauritius(point)
    # print(f"Number of {point} found : {len(hs)}")
    # for h in hs:
    #     print(h)

    point="pharmacy"
    hs = fetch_points_mauritius(point)
    print(f"Number of {point} found : {len(hs)}")
    for h in hs:
        print(h)

# %%
