import json
from app.core.config import GEMINI_API_KEY, gemini_client, gemini_model_name
from pydantic import BaseModel
from typing import List, Optional

# Standardized tags to map against landlord preferences
TAG_LIST = [
    "Tidy", "Non-smoker", "Quiet after 10pm", "Pet-friendly", "Friendly",
    "Active lifestyle", "Social", "Early riser", "Night owl", "Work from home",
    "Student", "Professional"
]

class PersonaResult(BaseModel):
    label: str
    bio: str
    tags: List[str]

class MatchExplanation(BaseModel):
    summary: str
    pros: List[str]
    cons: List[str]

class OptimizedListing(BaseModel):
    title: str
    description: str
    suggested_tags: List[str]

async def analyze_living_style(answers: dict):
    """
    Takes the 20-question responses and extracts the most relevant 
    standardized tags using Gemini.
    """
    if not gemini_client:
        return {"label": "Balanced Resident", "bio": "A reliable housemate.", "tags": ["Tidy", "Friendly", "Professional"]}
    
    prompt = f"Analyze these housemate quiz answers and return a persona label, bio, and at least 4 tags from: {', '.join(TAG_LIST)}\n\nAnswers: {json.dumps(answers)}"
    
    try:
        response = gemini_client.models.generate_content(
            model=gemini_model_name,
            contents=prompt,
            config={'response_mime_type': 'application/json', 'response_schema': PersonaResult}
        )
        return response.parsed.dict()
    except Exception as e:
        return {"label": "Balanced Resident", "bio": "A reliable housemate.", "tags": ["Tidy", "Friendly", "Professional"]}

async def explain_match(user_profile: dict, target_data: dict, is_property: bool = True):
    """
    Generates a human-friendly explanation of WHY two things matched.
    target_data can be a Property dict or another Profile dict.
    """
    if not gemini_client:
        return {"summary": "A great match based on your shared interests.", "pros": ["Location", "Budget"], "cons": []}

    target_type = "Property" if is_property else "Housemate"
    prompt = f"""
    Explain why this User matches with this {target_type}. 
    User Profile: {json.dumps(user_profile.get('preferences', {}))}
    {target_type} Data: {json.dumps(target_data.get('preferences', target_data))}
    
    Provide a 2-sentence summary and a list of specific pros/cons.
    """
    
    try:
        response = gemini_client.models.generate_content(
            model=gemini_model_name,
            contents=prompt,
            config={'response_mime_type': 'application/json', 'response_schema': MatchExplanation}
        )
        return response.parsed.dict()
    except:
        return {"summary": "Strong compatibility detected.", "pros": ["Lifestyle alignment"], "cons": []}

async def optimize_listing(raw_details: dict):
    """
    Takes raw property details and generates a professional, catchy listing.
    """
    if not gemini_client:
        return {"title": "Lovely Property", "description": "A great place to live.", "suggested_tags": ["Tidy"]}

    prompt = f"Optimize this property listing for a student/professional matching app. Raw Details: {json.dumps(raw_details)}"
    
    try:
        response = gemini_client.models.generate_content(
            model=gemini_model_name,
            contents=prompt,
            config={'response_mime_type': 'application/json', 'response_schema': OptimizedListing}
        )
        return response.parsed.dict()
    except:
        return {"title": "Available Room", "description": "Contact for more details.", "suggested_tags": []}
