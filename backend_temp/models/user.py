from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

class UserRegister(BaseModel):
    """
    Stage 1: Initial Account Creation.
    Only the bare essentials to get them into the system.
    """
    email: EmailStr
    name: str
    role: str = "tenant"
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None

class UserUpdate(BaseModel):
    """
    Stage 2+: Onboarding & Profile Updates.
    Used to fill in preferences, locations, etc.
    """
    name: Optional[str] = None
    role: Optional[str] = None
    bio: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    work_location_name: Optional[str] = None
    common_location_name: Optional[str] = None
    profile_image_url: Optional[str] = None

class LocationUpdate(BaseModel):
    user_id: str
    location_type: str 
    location_name: str 
    lat: Optional[float] = None
    lng: Optional[float] = None
