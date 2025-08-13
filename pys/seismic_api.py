from flask import Flask, request, jsonify
from network_data_fetcher import get_lat_lon_from_address1, get_address_from_lat_lon, get_seismic_hazard_data
from geo_tif_handler import get_pixel_rgb, cosine_similarity
import os

app = Flask(__name__)

# Remove default_soil_table

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'flask-seismic-api'})

@app.route('/api/seismic-info', methods=['POST'])
def seismic_info():
    data = request.get_json()
    address = data.get('address')
    api_key = data.get('api_key')
    soil_table = data.get('soil_table')
    tif_path = os.path.join(os.path.dirname(__file__), 'GeoVan_src4326.tif')

    if not soil_table:
        return jsonify({'error': 'No soil_table provided'}), 400

    # 1. Geocode
    lat, lon = get_lat_lon_from_address1(address, api_key)
    if lat is None or lon is None:
        return jsonify({'error': 'Failed to geocode address'}), 400

    # 2. Reverse geocode
    address_checked = get_address_from_lat_lon(lat, lon, api_key)

    # 3. Get RGB from GeoTIFF
    rgb = get_pixel_rgb(tif_path, lon, lat)
    if rgb is None:
        return jsonify({'error': 'Failed to get RGB from GeoTIFF'}), 400

    # 4. Find most similar soil type
    similarities = []
    for soil in soil_table:
        soil_rgb = [soil['color_r'], soil['color_g'], soil['color_b']]
        sim = cosine_similarity(rgb, soil_rgb)
        similarities.append(sim)
    max_idx = similarities.index(max(similarities))
    most_similar_soil = soil_table[max_idx]
    site_class = most_similar_soil['site_class']
    soil_pressure = most_similar_soil['soil_pressure_psf']

    # 5. Seismic hazard data
    sa_site = None
    sa_x450 = None
    try:
        site_data = get_seismic_hazard_data(lat, lon, site_class)
        if site_data and len(site_data) > 0:
            result = site_data[0]
            sa_site = [result['sa0p2'], result['sa0p5'], result['sa1p0'], result['sa2p0'], result['sa5p0'], result['sa10p0'], result['pga']]
        x450_data = get_seismic_hazard_data(lat, lon, 'X450')
        if x450_data and len(x450_data) > 0:
            result = x450_data[0]
            sa_x450 = [result['sa0p2'], result['sa0p5'], result['sa1p0'], result['sa2p0'], result['sa5p0'], result['sa10p0'], result['pga']]
    except Exception as e:
        return jsonify({'error': f'Failed to fetch seismic hazard data: {str(e)}'}), 400

    return jsonify({
        'site_class': site_class,
        'coordinates': {'lat': lat, 'lon': lon},
        'address_checked': address_checked,
        'rgb': rgb,
        'most_similar_soil': most_similar_soil,
        'soil_pressure': soil_pressure,
        'sa_site': sa_site,
        'sa_x450': sa_x450
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True) 