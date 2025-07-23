# -*- coding: utf-8 -*-

import requests


# coordinates returned are not accurate
# def get_lat_lon_from_address(address):
#     geocode_url = f"https://nominatim.openstreetmap.org/search?q={address}&format=json&limit=1"
#     headers = {
#         "User-Agent": "MyApp/1.0 (youremail@example.com)"
#     }
#     response = requests.get(geocode_url, headers=headers)
#     data = response.json()
#     if data:
#         lat = float(data[0]['lat'])
#         lon = float(data[0]['lon'])
#         return lat, lon
#     return None, None

def get_lat_lon_from_address1(address, api_key):
    url = "https://api.opencagedata.com/geocode/v1/json"
    params = {
        "q": address,
        "key": api_key,
        "limit": 1,
        "no_annotations": 1
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        if data["results"]:
            location = data["results"][0]["geometry"]
            return location["lat"], location["lng"]
        else:
            print("No results found for the address.")
            return None, None

    except requests.RequestException as e:
        print("Request failed:", e)
        return None, None


def get_address_from_lat_lon(lat, lon, api_key):
    url = "https://api.opencagedata.com/geocode/v1/json"
    params = {
        "q": f"{lat},{lon}",
        "key": api_key,
        "no_annotations": 1,
        "language": "en"
    }
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        if data["results"]:
            address = data["results"][0]["formatted"]
            return address
        else:
            print("No address found for the coordinates.")
            return None

    except requests.RequestException as e:
        print("Request failed:", e)
        return None


def seismic_hazard_data_fetcher(result_dict):
    # site_data = data['data']['NBC2020'][site_class]
    site_data = get_seismic_hazard_data(result_dict["Latitude"], result_dict["Longitude"], result_dict["SiteClass"])
    result = site_data[0]
    # Store the results in the result_dict as arrays
    result_dict["SaSite"] = [result['sa0p2'], result['sa0p5'], result['sa1p0'], result['sa2p0'],
                             result['sa5p0'], result['sa10p0'], result['pga']]

    site_data = get_seismic_hazard_data(result_dict["Latitude"], result_dict["Longitude"], 'X450')
    result = site_data[0]
    # Store the results in the result_dict as arrays
    result_dict["X450"] = [result['sa0p2'], result['sa0p5'], result['sa1p0'], result['sa2p0'],
                           result['sa5p0'], result['sa10p0'], result['pga']]


# Send GraphQL request and print results to console
def get_seismic_hazard_data(latitude, longitude, site_class):
    query = create_graphql_query(latitude, longitude, site_class)
    headers = {
        "Content-Type": "application/json",
    }
    payload = {
        "query": query
    }
    response = requests.post("https://www.earthquakescanada.nrcan.gc.ca/api/canshm/graphql", json=payload,
                             headers=headers)

    if response.status_code == 200:
        data = response.json()
        if "data" in data:
            site_data = data['data']['NBC2020'][site_class]
            if site_data:
                print("Successful.")
                return site_data
            else:
                print(f"No data found for site class {site_class}.")
        else:
            print("Error: No data in response.")
    else:
        print(f"Error: {response.status_code} - {response.text}")


def create_graphql_query(latitude, longitude, site_class):
    valid_site_classes = ['A', 'B', 'C', 'D', 'E']
    if site_class in valid_site_classes:
        query = f"""
        query {{
          NBC2020(latitude: {latitude}, longitude: {longitude}) {{
            {site_class}: siteDesignationsXs(siteClass: {site_class}, poe50: [2.0, 5.0, 10.0]) {{
              sa0p2
              sa0p5
              sa1p0
              sa2p0
              sa5p0
              sa10p0
              pga
            }}
          }}
        }}
        """
    elif site_class == 'X450':
        query = f"""
            query {{
              NBC2020(latitude: {latitude}, longitude: {longitude}) {{
                X450: siteDesignationsXv(vs30: 450, poe50: [2.0, 5.0, 10.0]) {{
                  sa0p2
                  sa0p5
                  sa1p0
                  sa2p0
                  sa5p0
                  sa10p0
                  pga
                }}
              }}
            }}
            """

    return query
