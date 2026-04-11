from fastapi import APIRouter, HTTPException, Depends
from app.models.property import PropertyCreate, PropertyUpdate
from app.core.config import supabase
from app.core.maps import get_coordinates
from app.core.deps import get_current_user
from typing import List
from datetime import datetime, timedelta, timezone

from app.core.ai import optimize_listing

router = APIRouter(prefix="/properties", tags=["Properties"])

def calculate_occupancy(property_data: dict):
    max_t = property_data.get("max_tenants", 1)
    curr_t = property_data.get("current_tenants", 0)
    rate = (curr_t / max_t) * 100 if max_t > 0 else 0
    property_data["occupancy_rate"] = round(min(rate, 100.0), 2)
    return property_data

@router.post("/", summary="Create Property Listing")
async def create_property(prop: PropertyCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["landlord", "admin"]:
        raise HTTPException(status_code=403, detail="Only landlords or admins can create properties")

    lat, lng = prop.lat, prop.lng
    if lat is None or lng is None:
        lat, lng = await get_coordinates(prop.address)
        if not lat or not lng:
            raise HTTPException(status_code=400, detail=f"Could not find coordinates for: {prop.address}")

    point = f"POINT({lng} {lat})"
    insert_data = prop.dict(exclude={"lat", "lng", "ideal_tenant_description", "landlord_id"})
    landlord_id = prop.landlord_id if current_user["role"] == "admin" and prop.landlord_id else current_user["id"]

    insert_data.update({
        "landlord_id": landlord_id,
        "coords": point,
        "expiry_date": str(prop.expiry_date) if prop.expiry_date else None
    })

    res = supabase.table("properties").insert(insert_data).execute()
    return calculate_occupancy(res.data[0])

@router.get("/", summary="List Properties (Role-based Filtering)")
async def list_properties(current_user: dict = Depends(get_current_user)):
    role = current_user.get("role")
    user_id = current_user.get("id")
    
    query = supabase.table("properties").select("*")
    
    # Role-based filtering
    if role == "admin":
        # Admin sees everything
        pass
    elif role == "landlord":
        # Landlord only sees their own listings
        query = query.eq("landlord_id", user_id)
    else:
        # Tenants (or others) see nothing via this generic list endpoint
        # (They should use the /matching/ endpoints to find houses)
        return []

    res = query.execute()
    properties = res.data
    
    # Check for active super-likes
    now = datetime.now(timezone.utc)
    one_day_ago = (now - timedelta(hours=24)).isoformat()
    
    super_likes_res = supabase.table("super_likes") \
        .select("property_id, user_id") \
        .gte("created_at", one_day_ago) \
        .execute()
    
    sl_map = {}
    for sl in super_likes_res.data:
        pid = sl["property_id"]
        uid = sl["user_id"]
        if pid not in sl_map: sl_map[pid] = []
        sl_map[pid].append(uid)
    
    for p in properties:
        calculate_occupancy(p)
        p_sl_users = sl_map.get(p["id"], [])
        p["super_liked_user_ids"] = p_sl_users
        p["super_liked_by_me"] = user_id in p_sl_users
        
    return properties

@router.get("/landlord/{landlord_id}", summary="Get properties by landlord ID")
async def get_properties_by_landlord(landlord_id: str):
    res = supabase.table("properties").select("*").eq("landlord_id", landlord_id).execute()
    return [calculate_occupancy(p) for p in res.data]

@router.get("/{property_id}", summary="Get Property Details")
async def get_property(property_id: str, current_user: dict = Depends(get_current_user)):
    res = supabase.table("properties").select("*").eq("id", property_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Property not found")
    
    prop = calculate_occupancy(res.data[0])
    
    # Check super likes for this specific property
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)
    one_day_ago = (now - timedelta(hours=24)).isoformat()
    
    sl_res = supabase.table("super_likes") \
        .select("user_id") \
        .eq("property_id", property_id) \
        .gte("created_at", one_day_ago) \
        .execute()
    
    sl_users = [sl["user_id"] for sl in sl_res.data]
    prop["super_liked_user_ids"] = sl_users
    prop["super_liked_by_me"] = user_id in sl_users
    return prop

@router.patch("/{property_id}", summary="Update Property Listing")
async def update_property(property_id: str, prop: PropertyUpdate, current_user: dict = Depends(get_current_user)):
    existing_res = supabase.table("properties").select("landlord_id").eq("id", property_id).execute()
    if not existing_res.data:
        raise HTTPException(status_code=404, detail="Property not found")
    
    existing = existing_res.data[0]
    if existing["landlord_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this property")

    data = prop.dict(exclude_unset=True)
    if "address" in data and ("lat" not in data or "lng" not in data):
        lat, lng = await get_coordinates(data["address"])
        if lat and lng:
            data["coords"] = f"POINT({lng} {lat})"
            data.pop("lat", None)
            data.pop("lng", None)
    
    if "expiry_date" in data and data["expiry_date"]:
        data["expiry_date"] = str(data["expiry_date"])

    res = supabase.table("properties").update(data).eq("id", property_id).execute()
    return calculate_occupancy(res.data[0])

@router.delete("/{property_id}", summary="Delete Property")
async def delete_property(property_id: str, current_user: dict = Depends(get_current_user)):
    existing_res = supabase.table("properties").select("landlord_id").eq("id", property_id).execute()
    if not existing_res.data:
        raise HTTPException(status_code=404, detail="Property not found")
    
    existing = existing_res.data[0]
    if existing["landlord_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this property")
        
    supabase.table("properties").delete().eq("id", property_id).execute()
    return {"status": "success", "message": "Property deleted"}

@router.post("/{property_id}/approve/{user_id}", summary="Landlord approves a tenant for matching")
async def approve_tenant(property_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    # 1. Verify property exists and check ownership
    prop_res = supabase.table("properties").select("*").eq("id", property_id).execute()
    if not prop_res.data:
        raise HTTPException(status_code=404, detail="Property not found")
    
    prop = prop_res.data[0]
    if prop["landlord_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only the landlord can approve tenants")

    # 2. Check occupancy
    if prop["current_tenants"] >= prop["max_tenants"]:
        raise HTTPException(status_code=400, detail="Property is already at maximum capacity")

    # 3. Update Property (add to approved_user_ids and increment current_tenants)
    approved_ids = prop.get("approved_user_ids") or []
    if user_id in approved_ids:
        return {"status": "success", "message": "User already approved"}
    
    approved_ids.append(user_id)
    new_count = prop["current_tenants"] + 1
    
    supabase.table("properties").update({
        "approved_user_ids": approved_ids,
        "current_tenants": new_count
    }).eq("id", property_id).execute()

    # 4. Update User Profile (mark as approved by this property)
    user_res = supabase.table("profiles").select("approved_property_ids").eq("id", user_id).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    approved_prop_ids = user_res.data[0].get("approved_property_ids") or []
    if property_id not in approved_prop_ids:
        approved_prop_ids.append(property_id)
        supabase.table("profiles").update({"approved_property_ids": approved_prop_ids}).eq("id", user_id).execute()

    return {"status": "success", "message": f"User {user_id} approved for property {property_id}"}

@router.post("/{property_id}/remove-tenant/{user_id}", summary="Remove an approved tenant from property")
async def remove_tenant(property_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    # 1. Verify ownership
    prop_res = supabase.table("properties").select("*").eq("id", property_id).execute()
    if not prop_res.data:
        raise HTTPException(status_code=404, detail="Property not found")
    
    prop = prop_res.data[0]
    if prop["landlord_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only the landlord can manage tenants")

    # 2. Update Property
    approved_ids = prop.get("approved_user_ids") or []
    if user_id in approved_ids:
        approved_ids.remove(user_id)
        new_count = max(0, prop["current_tenants"] - 1)
        supabase.table("properties").update({
            "approved_user_ids": approved_ids,
            "current_tenants": new_count
        }).eq("id", property_id).execute()

    # 3. Update User Profile (remove from approved list)
    user_res = supabase.table("profiles").select("approved_property_ids").eq("id", user_id).execute()
    if user_res.data:
        approved_prop_ids = user_res.data[0].get("approved_property_ids") or []
        if property_id in approved_prop_ids:
            approved_prop_ids.remove(property_id)
            supabase.table("profiles").update({"approved_property_ids": approved_prop_ids}).eq("id", user_id).execute()

    return {"status": "success", "message": "Tenant approval removed"}

@router.post("/{property_id}/interest", summary="Express interest in a property")
async def express_interest(property_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # 1. Update Property list
    res = supabase.table("properties").select("interested_user_ids").eq("id", property_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Property not found")
    
    current_ids = res.data[0].get("interested_user_ids") or []
    if user_id not in current_ids:
        current_ids.append(user_id)
        supabase.table("properties").update({"interested_user_ids": current_ids}).eq("id", property_id).execute()
    
    # 2. Update User Profile list
    user_res = supabase.table("profiles").select("interested_property_ids").eq("id", user_id).execute()
    if user_res.data:
        interested_prop_ids = user_res.data[0].get("interested_property_ids") or []
        if property_id not in interested_prop_ids:
            interested_prop_ids.append(property_id)
            supabase.table("profiles").update({"interested_property_ids": interested_prop_ids}).eq("id", user_id).execute()

    return {"status": "success", "message": "Interest recorded"}

@router.delete("/{property_id}/interest", summary="Remove interest from a property")
async def remove_interest(property_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    # 1. Update Property list
    res = supabase.table("properties").select("interested_user_ids").eq("id", property_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Property not found")
    
    current_ids = res.data[0].get("interested_user_ids") or []
    if user_id in current_ids:
        current_ids.remove(user_id)
        supabase.table("properties").update({"interested_user_ids": current_ids}).eq("id", property_id).execute()

    # 2. Update User Profile list
    user_res = supabase.table("profiles").select("interested_property_ids").eq("id", user_id).execute()
    if user_res.data:
        interested_prop_ids = user_res.data[0].get("interested_property_ids") or []
        if property_id in interested_prop_ids:
            interested_prop_ids.remove(property_id)
            supabase.table("profiles").update({"interested_property_ids": interested_prop_ids}).eq("id", user_id).execute()
    
    return {"status": "success", "message": "Interest removed"}

@router.post("/{property_id}/super-like", summary="Super Like a property (24h application)")
async def super_like(property_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)
    one_day_ago = (now - timedelta(hours=24)).isoformat()

    # 1. Automatic Cleanup: Delete expired super likes for this user
    supabase.table("super_likes").delete().eq("user_id", user_id).lt("created_at", one_day_ago).execute()

    # 2. Check if user already has an active super like today
    existing_sl = supabase.table("super_likes") \
        .select("*") \
        .eq("user_id", user_id) \
        .execute()
    
    if existing_sl.data:
        raise HTTPException(status_code=400, detail="You can only send one super like per 24 hours.")

    # 3. Record Super Like
    supabase.table("super_likes").insert({
        "user_id": user_id,
        "property_id": property_id,
        "created_at": now.isoformat()
    }).execute()

    # 4. Also record regular interest if not already there
    prop_res = supabase.table("properties").select("interested_user_ids").eq("id", property_id).execute()
    if prop_res.data:
        current_ids = prop_res.data[0].get("interested_user_ids") or []
        if user_id not in current_ids:
            current_ids.append(user_id)
            supabase.table("properties").update({"interested_user_ids": current_ids}).eq("id", property_id).execute()

    return {"status": "success", "message": "Super like recorded! Your priority application is active for 24 hours."}

@router.post("/{property_id}/refresh-expiry", summary="Landlord manually refreshes property expiry date (Adds 30 days)")
async def refresh_property_expiry(property_id: str, current_user: dict = Depends(get_current_user)):
    # 1. Verify property and ownership
    prop_res = supabase.table("properties").select("landlord_id, expiry_date").eq("id", property_id).execute()
    if not prop_res.data:
        raise HTTPException(status_code=404, detail="Property not found")
    
    prop = prop_res.data[0]
    if prop["landlord_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only the landlord or admin can refresh the listing")

    # 2. Calculate new expiry date (30 days from now or 30 days from existing)
    now = datetime.now(timezone.utc).date()
    current_expiry = None
    if prop.get("expiry_date"):
        try:
            current_expiry = datetime.strptime(prop["expiry_date"], "%Y-%m-%d").date()
        except: pass
        
    # If already expired, refresh from now. If not, extend from current.
    base_date = current_expiry if (current_expiry and current_expiry > now) else now
    new_expiry = (base_date + timedelta(days=30)).isoformat()

    supabase.table("properties").update({"expiry_date": new_expiry}).eq("id", property_id).execute()
    
    return {"status": "success", "new_expiry_date": new_expiry}

@router.post("/{property_id}/super-like/refresh", summary="Tenant manually refreshes super like expiry (Resets 24h timer)")
async def refresh_super_like(property_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)
    one_day_ago = (now - timedelta(hours=24)).isoformat()

    # 1. Check if super like exists and is active
    res = supabase.table("super_likes") \
        .select("*") \
        .eq("user_id", user_id) \
        .eq("property_id", property_id) \
        .gte("created_at", one_day_ago) \
        .execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="No active super like found for this property")

    # 2. Update created_at to reset the 24h timer
    supabase.table("super_likes").update({
        "created_at": now.isoformat()
    }).eq("user_id", user_id).eq("property_id", property_id).execute()

    return {"status": "success", "message": "Super like timer reset to 24 hours"}

@router.post("/{property_id}/withdraw", summary="Withdraw all interest and unmatch from a property")
async def withdraw_from_property(property_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # 1. Remove from super_likes
    supabase.table("super_likes").delete().eq("user_id", user_id).eq("property_id", property_id).execute()
    
    # 2. Get property to update interest and approved lists
    prop_res = supabase.table("properties").select("*").eq("id", property_id).execute()
    if not prop_res.data:
        raise HTTPException(status_code=404, detail="Property not found")
    
    prop = prop_res.data[0]
    update_data = {}
    
    # 3. Remove from regular interest
    interested_ids = prop.get("interested_user_ids") or []
    if user_id in interested_ids:
        interested_ids.remove(user_id)
        update_data["interested_user_ids"] = interested_ids
        
    # 4. Remove from approved matching (unmatch)
    approved_ids = prop.get("approved_user_ids") or []
    if user_id in approved_ids:
        approved_ids.remove(user_id)
        update_data["approved_user_ids"] = approved_ids
        # Decrement current tenants if they were already part of it
        update_data["current_tenants"] = max(0, prop.get("current_tenants", 0) - 1)
        
    # Apply updates if any
    if update_data:
        supabase.table("properties").update(update_data).eq("id", property_id).execute()
        
    # 5. Update user's profile to remove the property from their interest and approved lists
    user_res = supabase.table("profiles").select("approved_property_ids, interested_property_ids").eq("id", user_id).execute()
    if user_res.data:
        profile_updates = {}
        
        # Remove from approved
        approved_prop_ids = user_res.data[0].get("approved_property_ids") or []
        if property_id in approved_prop_ids:
            approved_prop_ids.remove(property_id)
            profile_updates["approved_property_ids"] = approved_prop_ids
            
        # Remove from interest
        interested_prop_ids = user_res.data[0].get("interested_property_ids") or []
        if property_id in interested_prop_ids:
            interested_prop_ids.remove(property_id)
            profile_updates["interested_property_ids"] = interested_prop_ids
            
        if profile_updates:
            supabase.table("profiles").update(profile_updates).eq("id", user_id).execute()
            
    return {"status": "success", "message": "Successfully withdrawn and unmatched from property"}

@router.post("/ai-optimize", summary="AI Optimize property listing")
async def ai_optimize_listing(raw_details: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["landlord", "admin"]:
        raise HTTPException(status_code=403, detail="Only landlords can optimize listings")
    
    optimized = await optimize_listing(raw_details)
    return optimized


