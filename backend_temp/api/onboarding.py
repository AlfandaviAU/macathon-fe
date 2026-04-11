from fastapi import APIRouter, HTTPException
from app.models.matching import QuizResponse
from app.core.config import supabase
from app.core.maps import get_coordinates
from app.core.ai import analyze_living_style

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

@router.post("/quiz", summary="Complete Onboarding & AI Tagging")
async def handle_quiz(quiz: QuizResponse):
    """
    Takes 20 answers, uses Gemini to intelligently pick matching tags,
    and saves them for tag-based matching.
    """
    # 1. AI Analysis to extract tags
    persona = await analyze_living_style(quiz.responses)
    
    update_data = {
        "personality_label": persona['label'],
        "bio": persona['bio'],
        "tags": persona['tags'],
        "raw_quiz_results": quiz.responses,
        "preferences": quiz.responses 
    }
    
    # Extract known fields if present
    r = quiz.responses
    if "1_name" in r:
        update_data["name"] = str(r["1_name"])
    
    if "4_common_locations" in r:
        update_data["common_location_name"] = str(r["4_common_locations"])
        lat, lng = await get_coordinates(update_data["common_location_name"])
        if lat and lng:
            update_data["common_location_coords"] = f"POINT({lng} {lat})"
            
    if "5_study_locations" in r:
        update_data["work_location_name"] = str(r["5_study_locations"])
        lat, lng = await get_coordinates(update_data["work_location_name"])
        if lat and lng:
            update_data["work_location_coords"] = f"POINT({lng} {lat})"

    # 2. Update DB
    res = supabase.table("profiles").update(update_data).eq("id", quiz.user_id).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "status": "success",
        "label": persona['label'],
        "bio": persona['bio'],
        "tags": persona['tags']
    }
