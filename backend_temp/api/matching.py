from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.config import supabase
from app.core.maps import get_distance_and_time
import numpy as np
from typing import List, Optional

from app.core.ai import explain_match

router = APIRouter(prefix="/matching", tags=["Matching"])

@router.get("/explain-property/{user_id}/{property_id}", summary="AI explanation of a property match")
async def get_match_explanation_property(user_id: str, property_id: str):
    u_res = supabase.table("profiles").select("*").eq("id", user_id).execute()
    p_res = supabase.table("properties").select("*").eq("id", property_id).execute()
    
    if not u_res.data or not p_res.data:
        raise HTTPException(status_code=404, detail="User or Property not found")
    
    explanation = await explain_match(u_res.data[0], p_res.data[0], is_property=True)
    return explanation

@router.get("/explain-housemate/{user_id}/{other_id}", summary="AI explanation of a housemate match")
async def get_match_explanation_housemate(user_id: str, other_id: str):
    u_res = supabase.table("profiles").select("*").eq("id", user_id).execute()
    o_res = supabase.table("profiles").select("*").eq("id", other_id).execute()
    
    if not u_res.data or not o_res.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    explanation = await explain_match(u_res.data[0], o_res.data[0], is_property=False)
    return explanation

def calculate_property_preference_score(user_quiz: dict, prop: dict) -> float:
    points = 0
    total = 0
    if "10_parking_requirement" in user_quiz:
        total += 1
        if user_quiz["10_parking_requirement"] and prop.get("garages", 0) > 0: points += 1
        elif not user_quiz["10_parking_requirement"]: points += 1
    if "15_bathroom_preference" in user_quiz:
        total += 1
        if user_quiz["15_bathroom_preference"] and prop.get("bathrooms", 1) >= prop.get("bedrooms", 1): points += 1
        elif not user_quiz["15_bathroom_preference"]: points += 1
    if "16_pet_question" in user_quiz:
        total += 1
        pet_friendly = "Pet-friendly" in (prop.get("tenant_preferences") or [])
        if user_quiz["16_pet_question"] == pet_friendly: points += 1
        elif not user_quiz["16_pet_question"]: points += 1
    return (points / total) * 100 if total > 0 else 100.0

def calculate_lifestyle_score(user_prefs: dict, other_prefs: dict) -> float:
    """Lifestyle compatibility between two users."""
    if not user_prefs or not other_prefs:
        return 50.0
    
    weights = {
        "11_cleanliness_level": 2.0,
        "12_social_battery": 1.5,
        "13_guest_policy": 1.5,
        "16_pet_question": 2.0,
        "18_smoking_vaping": 2.0,
        "6_personality_traits": 1.0,
        "14_wfh_status": 1.0
    }
    
    points = 0
    total_weight = 0
    
    for key, weight in weights.items():
        if key in user_prefs and key in other_prefs:
            try:
                u_val = 1.0 if isinstance(user_prefs[key], bool) and user_prefs[key] else (float(user_prefs[key]) if not isinstance(user_prefs[key], bool) else 0.0)
                o_val = 1.0 if isinstance(other_prefs[key], bool) and other_prefs[key] else (float(other_prefs[key]) if not isinstance(other_prefs[key], bool) else 0.0)
                max_diff = 1.0 if isinstance(user_prefs[key], bool) else 4.0
                diff = abs(u_val - o_val)
                points += (1 - (diff / max_diff)) * weight
                total_weight += weight
            except: pass

    return (points / total_weight) * 100 if total_weight > 0 else 50.0

@router.get("/properties/{user_id}", summary="Property Match (Distance Priority)")
async def get_property_matches(
    user_id: str, 
    max_price: Optional[float] = Query(None),
    max_range_km: Optional[float] = Query(None)
):
    user_res = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not user_res.data: raise HTTPException(status_code=404, detail="User not found")
    user = user_res.data[0]
    user_tags = user.get("tags", [])
    user_quiz = user.get("preferences", {})

    query = supabase.table("properties").select("*").eq("status", "available")
    if max_price: query = query.lte("price", max_price)
    prop_res = query.execute()
    
    results = []
    for prop in prop_res.data:
        travel_score = 0.0
        travel_details = []
        min_dist_km = 99999
        origin = prop.get("address")
        
        try:
            commute_scores = []
            if user.get("work_location_name"):
                info = await get_distance_and_time_by_name(origin, user["work_location_name"])
                if info:
                    time_mins = info["duration_value"] / 60
                    dist_km = info["distance_value"] / 1000
                    min_dist_km = min(min_dist_km, dist_km)
                    s = max(0, 100 - ((time_mins - 10) * 2.5)) if time_mins > 10 else 100.0
                    commute_scores.append(s)
                    travel_details.append({"to": "Work", "time": info["duration_text"], "dist": info["distance_text"]})

            if user.get("common_location_name"):
                info = await get_distance_and_time_by_name(origin, user["common_location_name"])
                if info:
                    time_mins = info["duration_value"] / 60
                    dist_km = info["distance_value"] / 1000
                    min_dist_km = min(min_dist_km, dist_km)
                    s = max(0, 100 - ((time_mins - 10) * 2.5)) if time_mins > 10 else 100.0
                    commute_scores.append(s)
                    travel_details.append({"to": "Common Place", "time": info["duration_text"], "dist": info["distance_text"]})
            
            travel_score = sum(commute_scores) / len(commute_scores) if commute_scores else 50.0
        except: travel_score = 50.0

        if max_range_km and min_dist_km > max_range_km: continue

        lifestyle_score = calculate_property_preference_score(user_quiz, prop)
        p_tags = prop.get("tenant_preferences") or []
        tag_intersect = set(user_tags) & set(p_tags)
        tag_score = (len(tag_intersect) / len(p_tags) * 100) if p_tags else 100.0
        
        budget_score = 100
        try:
            max_budget = float(str(user_quiz.get("7_budget_range", "1000")).split("-")[-1])
            if float(prop.get("price", 0)) > max_budget: budget_score = max(0, 100 - (float(prop.get("price", 0)) - max_budget) / 10 * 10)
        except: pass
        
        secondary_score = (tag_score + budget_score) / 2
        final_score = (travel_score * 0.70) + (lifestyle_score * 0.20) + (secondary_score * 0.10)
        
        results.append({
            "id": prop["id"],
            "address": prop["address"],
            "price": prop["price"],
            "match_score": round(final_score, 1),
            "travel_score": round(travel_score, 1),
            "travel_details": travel_details,
            "occupancy": f"{prop.get('current_tenants', 0)}/{prop.get('max_tenants', 1)}",
            "bedrooms": prop.get("bedrooms", 1),
            "bathrooms": prop.get("bathrooms", 1),
            "garages": prop.get("garages", 0),
            "matching_tags": list(tag_intersect),
            "unmatching_tags": list(set(p_tags) - set(user_tags)),
            "images": prop["images"]
        })

    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results

@router.get("/tenants/{user_id}", summary="Housemate Match (Distance & Lifestyle)")
async def match_tenants(user_id: str):
    """
    Matches users based on:
    - 50% Lifestyle Quiz
    - 40% Common Location & Work Proximity (Travel Time)
    - 10% Tag Overlap
    """
    res = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not res.data: raise HTTPException(status_code=404, detail="User not found")
    user = res.data[0]
    user_prefs = user.get("preferences", {})
    
    others_res = supabase.table("profiles").select("*").neq("id", user_id).eq("role", "tenant").execute()
    
    results = []
    for other in others_res.data:
        # 1. Lifestyle (50%)
        lifestyle = calculate_lifestyle_score(user_prefs, other.get("preferences", {}))
        
        # 2. Location Proximity (40%)
        travel_score = 50.0
        travel_details = []
        try:
            loc_scores = []
            # Work Proximity
            if user.get("work_location_name") and other.get("work_location_name"):
                info = await get_distance_and_time_by_name(user["work_location_name"], other["work_location_name"])
                if info:
                    time_mins = info["duration_value"] / 60
                    s = max(0, 100 - (time_mins * 2))
                    loc_scores.append(s)
                    travel_details.append({"type": "Work Proximity", "time": info["duration_text"], "dist": info["distance_text"]})
            
            # Common Place Proximity
            if user.get("common_location_name") and other.get("common_location_name"):
                info = await get_distance_and_time_by_name(user["common_location_name"], other["common_location_name"])
                if info:
                    time_mins = info["duration_value"] / 60
                    s = max(0, 100 - (time_mins * 2))
                    loc_scores.append(s)
                    travel_details.append({"type": "Common Place Proximity", "time": info["duration_text"], "dist": info["distance_text"]})
            
            if loc_scores: travel_score = sum(loc_scores) / len(loc_scores)
        except: pass

        # 3. Tags (10%)
        common_tags = list(set(user.get("tags", [])) & set(other.get("tags", [])))
        tag_score = (len(common_tags) / max(1, len(user.get("tags", []))) * 100)

        final_score = (lifestyle * 0.50) + (travel_score * 0.40) + (tag_score * 0.10)
        
        results.append({
            "id": other["id"],
            "name": other["name"],
            "match_score": round(final_score, 1),
            "lifestyle_match": round(lifestyle, 1),
            "travel_details": travel_details,
            "profile_image_url": other.get("profile_image_url"),
            "common_tags": common_tags,
            "label": other.get("personality_label")
        })

    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results[:15]

async def get_distance_and_time_by_name(origin, dest):
    from app.core.maps import GOOGLE_MAPS_API_KEY
    import httpx
    if not GOOGLE_MAPS_API_KEY:
        return {"distance_text": "5.2 km", "distance_value": 5200, "duration_text": "12 mins", "duration_value": 720}
    url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={origin}&destinations={dest}&mode=transit&key={GOOGLE_MAPS_API_KEY}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json()
        if data["status"] == "OK" and data["rows"][0]["elements"][0]["status"] == "OK":
            element = data["rows"][0]["elements"][0]
            return {"distance_text": element["distance"]["text"], "distance_value": element["distance"]["value"], "duration_text": element["duration"]["text"], "duration_value": element["duration"]["value"]}
    return None
