from fastapi import APIRouter

router = APIRouter(prefix="/questions", tags=["Questions"])

QUESTIONS = [
    {"id": "1_name", "category": "Core Profile", "question": "What is your full name?", "type": "text"},
    {"id": "2_age", "category": "Core Profile", "question": "What is your age?", "type": "number"},
    {"id": "3_occupation", "category": "Core Profile", "question": "What is your occupation?", "type": "text"},
    {"id": "4_common_locations", "category": "Core Profile", "question": "Common locations (Where you hang out)", "type": "text"},
    {"id": "5_study_locations", "category": "Core Profile", "question": "Work/Study locations (For commute calculation)", "type": "text"},
    {"id": "6_personality_traits", "category": "Core Profile", "question": "Personality Traits (Introvert vs. Extrovert)", "type": "scale", "min": 1, "max": 5},
    
    {"id": "7_budget_range", "category": "Financial & Location", "question": "Budget range per week ($)", "type": "range"},
    {"id": "8_distance_preference", "category": "Financial & Location", "question": "Distance preference (Max radius in km)", "type": "number"},
    {"id": "9_move_in_date", "category": "Financial & Location", "question": "Move-in Date & Lease Length", "type": "text"},
    {"id": "10_parking_requirement", "category": "Financial & Location", "question": "Parking requirement?", "type": "boolean"},

    {"id": "11_cleanliness_level", "category": "Lifestyle Big Three", "question": "Cleanliness Level (1-5)", "type": "scale", "min": 1, "max": 5},
    {"id": "12_social_battery", "category": "Lifestyle Big Three", "question": "Social Battery (Quiet sanctuary vs. Social hub)", "type": "scale", "min": 1, "max": 5},
    {"id": "13_guest_policy", "category": "Lifestyle Big Three", "question": "Guest Policy (How often is too often for friends?)", "type": "scale", "min": 1, "max": 5},

    {"id": "14_wfh_status", "category": "Physical & Routine", "question": "Work from Home (Days per week)", "type": "number"},
    {"id": "15_bathroom_preference", "category": "Physical & Routine", "question": "Bathroom Preference (Private vs. Shared)", "type": "boolean"},
    {"id": "16_pet_question", "category": "Physical & Routine", "question": "Are you okay with pets?", "type": "boolean"},

    {"id": "17_utility_preferences", "category": "Logistics", "question": "Utility Preferences (Shared bills vs. Separate?)", "type": "boolean"},
    {"id": "18_smoking_vaping", "category": "Logistics", "question": "Smoking/Vaping preference?", "type": "boolean"},
    {"id": "19_dietary_practices", "category": "Logistics", "question": "Dietary/Religious requirements for kitchen?", "type": "text"},
    {"id": "20_allergies", "category": "Logistics", "question": "Allergies (Pets, dust, etc.)", "type": "text"}
]

@router.get("/")
async def get_all_questions():
    """
    Returns the full list of 20 onboarding/matching questions.
    """
    return {"questions": QUESTIONS}
