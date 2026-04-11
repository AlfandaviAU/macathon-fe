import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

async def get_location_name(lat: float, lng: float):
    """Reverse Geocoding: Coords -> Name"""
    if not GOOGLE_MAPS_API_KEY:
        return f"Mock Location ({lat}, {lng})"
    
    url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key={GOOGLE_MAPS_API_KEY}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json()
        if data["status"] == "OK":
            return data["results"][0]["formatted_address"]
    return f"Unknown Location ({lat}, {lng})"

async def get_coordinates(location_name: str):
    """Geocoding: Name -> Coords"""
    if not GOOGLE_MAPS_API_KEY:
        # Mock coordinates for Monash area if no API key
        return -37.915, 145.130
    
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={location_name}&key={GOOGLE_MAPS_API_KEY}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json()
        if data["status"] == "OK":
            location = data["results"][0]["geometry"]["location"]
            return location["lat"], location["lng"]
    return None, None

async def get_distance_and_time(origin_lat, origin_lng, dest_lat, dest_lng):
    """Distance Matrix: Origin -> Destination (Time & Distance)"""
    if not GOOGLE_MAPS_API_KEY:
        # Mock 10 mins / 5km
        return {"distance_text": "5.0 km", "distance_value": 5000, "duration_text": "10 mins", "duration_value": 600}
    
    url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={origin_lat},{origin_lng}&destinations={dest_lat},{dest_lng}&mode=transit&key={GOOGLE_MAPS_API_KEY}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json()
        if data["status"] == "OK" and data["rows"][0]["elements"][0]["status"] == "OK":
            element = data["rows"][0]["elements"][0]
            return {
                "distance_text": element["distance"]["text"],
                "distance_value": element["distance"]["value"],
                "duration_text": element["duration"]["text"],
                "duration_value": element["duration"]["value"]
            }
    return None
