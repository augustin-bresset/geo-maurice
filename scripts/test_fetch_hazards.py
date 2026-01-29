from OSMPythonTools.nominatim import Nominatim
from OSMPythonTools.overpass import Overpass, overpassQueryBuilder

def check_hazards():
    nominatim = Nominatim()
    areaId = nominatim.query('Mauritius').areaId()
    overpass = Overpass()

    queries = {
        "hazard=flood": f'"hazard"="flood"',
        "hazard_prone=flood": f'"hazard_prone"="flood"',
        "natural=landslide": f'"natural"="landslide"',
        "hazard=*": f'"hazard"'
    }

    print("Checking OSM data for potential risk zones...")
    
    for label, selector in queries.items():
        query = overpassQueryBuilder(
            area=areaId,
            elementType=['node', 'way', 'relation'],
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
    check_hazards()
