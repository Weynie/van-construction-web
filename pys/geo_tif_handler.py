# -*- coding: utf-8 -*-

import numpy as np
import xlwings as xw
import rasterio


def site_class_detector(initFile_name, GeoFile_name, soil_dict, result_dict):
    # get RGB from Geo Vancouver Map
    result_dict["RGB"] = get_pixel_rgb(GeoFile_name, result_dict["Longitude"], result_dict["Latitude"])

    # Initialize the similarity list
    similarity_list = []

    # Compare result_dict["RGB"] with each vector in soil_dict
    for i in range(1, 11):
        soil_rgb = soil_dict[i]
        similarity = cosine_similarity(result_dict["RGB"], soil_rgb)
        similarity_list.append(similarity)

    # Store the similarity results in result_dict
    result_dict["Similarity"] = similarity_list

    # Find the key with the highest similarity
    most_similar_key = similarity_list.index(max(similarity_list)) + 1  # Adding 1 because keys start from 1

    # Store the corresponding soil type in result_dict
    result_dict["SoilType"] = most_similar_key

    # wb = openpyxl.load_workbook(initFile_name)
    # sheet = wb["Seismic Calculator"]
    wb = xw.Book(initFile_name)
    sheet = wb.sheets["Seismic Template"]

    # type is the number key from 1 to 10
    soil_type = result_dict["SoilType"]
    site_class = None

    for row in range(24, 34):
        cell_value = sheet[f'A{row}'].value
        if cell_value == soil_type:
            # site_class is from E, D, C
            site_class = sheet[f'C{row}'].value
            break

    result_dict["SiteClass"] = site_class


def get_pixel_rgb(geotiff_path, longitude, latitude):
    """
    Get the average pixel RGB value from the surrounding area of the specified latitude and longitude in a GeoTIFF file.

    Parameters:
        geotiff_path: Path to the GeoTIFF file.
        longitude: Longitude (WGS84 coordinate system).
        latitude: Latitude (WGS84 coordinate system).

    Returns:
        If successful: [R, G, B] array representing the average RGB value in the area.
        If failed: None.
    """
    try:
        with rasterio.open(geotiff_path) as dataset:
            # Check if the coordinate system is EPSG:4326 (WGS84)
            if dataset.crs.to_epsg() != 4326:
                raise ValueError(
                    f"Error: The CRS of the file is {dataset.crs}, not EPSG:4326. The process will be terminated."
                )

            # Convert geographic coordinates to pixel coordinates
            row, col = dataset.index(longitude, latitude)

            # Define a 3x3 window around the target pixel
            window_size = 1  # This results in a 3x3 window, means “one pixel in every direction,” so total size = 3×3.
            row_start = max(row - window_size, 0)
            row_end = min(row + window_size + 1, dataset.height) # calls clamp your window so it never runs off the edge of the image.
            col_start = max(col - window_size, 0)
            col_end = min(col + window_size + 1, dataset.width)

            # Read RGB bands (assuming band order is 1:R, 2:G, 3:B)
            # is the number of bands in the file. If it’s at least 3, you can treat bands 1, 2, and 3 as R, G, B.
            if dataset.count >= 3:
                # Multiband image, read the first 3 bands (R, G, B) in the defined window
                # Each of r, g, b is a (3,3) array matching the pixels:
                # window slicing conventions—start inclusive, end exclusive.
                r, g, b = dataset.read([1, 2, 3], window=((row_start, row_end), (col_start, col_end)))

                # Compute the average value for each band, convert to int
                avg_r = int(np.mean(r))
                avg_g = int(np.mean(g))
                avg_b = int(np.mean(b))

                return [avg_r, avg_g, avg_b]
            else:
                raise ValueError("Error: The image does not have 3 RGB channels.")

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return None


def cosine_similarity(vec1, vec2):
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    return dot_product / (norm1 * norm2)
