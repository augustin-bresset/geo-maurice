from OSMPythonTools.nominatim import Nominatim
from OSMPythonTools.overpass import Overpass, overpassQueryBuilder

def check_proxies():
    nominatim = Nominatim()
    areaId = nominatim.query('Mauritius').areaId()
    overpass = Overpass()

    queries = {
        "waterway=river": f'"waterway"="river"',
        "waterway=stream": f'"waterway"="stream"',
        "natural=wetland": f'"natural"="wetland"',
        "landuse=basin": f'"landuse"="basin"'
    }

    print("Checking OSM data for flood proxies...")
    
    for label, selector in queries.items():
        query = overpassQueryBuilder(
            area=areaId,
            elementType=['way', 'relation'],
            selector=selector,
            out='center'
        )
        try:
            result = overpass.query(query)
            count = len(result.elements())
            print(f"- {label}: {count} elements found.")
        except Exception as e:
            print(f"- {label}: Error ({e})")

if __name__ == "__main__":
    check_proxies()
