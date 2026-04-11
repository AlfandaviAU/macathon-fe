from pydantic import BaseModel
from typing import Optional, List
from datetime import date

class PropertyBase(BaseModel):
    address: str
    price: float # Weekly price
    description: str
    images: Optional[List[str]] = []
    status: Optional[str] = "available"
    
    # New Fields
    bedrooms: int = 1
    bathrooms: int = 1
    garages: int = 0
    max_tenants: int = 1
    current_tenants: int = 0
    expiry_date: Optional[date] = None
    tenant_preferences: Optional[List[str]] = [] # Tidy, Non-smoker, etc.

class PropertyCreate(PropertyBase):
    landlord_id: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    ideal_tenant_description: Optional[str] = None

class PropertyUpdate(BaseModel):
    address: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    status: Optional[str] = None
    
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    garages: Optional[int] = None
    max_tenants: Optional[int] = None
    current_tenants: Optional[int] = None
    expiry_date: Optional[date] = None
    tenant_preferences: Optional[List[str]] = None
    
    ideal_tenant_description: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
