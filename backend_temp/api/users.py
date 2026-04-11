from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
import uuid
from app.models.user import UserUpdate, LocationUpdate
from app.core.config import supabase
from app.core.maps import get_coordinates
from app.core.deps import get_current_user, get_admin_user

router = APIRouter(prefix="/users", tags=["User Management"])

@router.get("/me", summary="Get current logged in user")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.get("/{user_id}", summary="Get user by ID")
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    # You can view any profile, but maybe only certain fields? 
    # For hackathon, we allow viewing but only owner can UPDATE.
    res = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = res.data[0]
    # Remove sensitive info before returning
    user.pop("password_hash", None)
    return user

@router.post("/{user_id}/upload-profile-pic", summary="Upload profile picture")
async def upload_profile_pic(user_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    # SECURITY: Only owner or admin can update their own profile picture
    if user_id != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")
    
    # 1. Generate unique filename
    ext = file.filename.split(".")[-1]
    filename = f"{user_id}_{uuid.uuid4()}.{ext}"
    
    try:
        # 2. Read file content
        content = await file.read()
        
        # 3. Upload to Supabase Storage
        # Ensure you have a bucket named 'profile-images' set to PUBLIC
        bucket_name = "profile-images"
        res = supabase.storage.from_(bucket_name).upload(
            path=filename,
            file=content,
            file_options={"content-type": file.content_type}
        )
        
        # 4. Get Public URL
        url = supabase.storage.from_(bucket_name).get_public_url(filename)
        
        # 5. Update user profile in DB
        supabase.table("profiles").update({"profile_image_url": url}).eq("id", user_id).execute()
        
        return {"profile_image_url": url}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload profile picture: {str(e)}")

@router.patch("/{user_id}", summary="Update user profile")
async def update_user(user_id: str, user: UserUpdate, current_user: dict = Depends(get_current_user)):
    # SECURITY: Only owner or admin can update a profile
    if user_id != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")
    
    data = user.dict(exclude_unset=True)
    
    if "work_location_name" in data:
        lat, lng = await get_coordinates(data["work_location_name"])
        if lat and lng: data["work_location_coords"] = f"POINT({lng} {lat})"
            
    if "common_location_name" in data:
        lat, lng = await get_coordinates(data["common_location_name"])
        if lat and lng: data["common_location_coords"] = f"POINT({lng} {lat})"
            
    res = supabase.table("profiles").update(data).eq("id", user_id).execute()
    return res.data[0]

@router.get("/", summary="List all users (Admin/Search)")
async def list_users(current_user: dict = Depends(get_current_user)):
    res = supabase.table("profiles").select("*").execute()
    # Clean output
    for u in res.data:
        u.pop("password_hash", None)
    return res.data

@router.delete("/{user_id}", summary="Delete user account")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    # SECURITY: Only owner or admin can delete an account
    if user_id != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this account")
        
    res = supabase.table("profiles").delete().eq("id", user_id).execute()
    return {"status": "success", "message": "User deleted"}
