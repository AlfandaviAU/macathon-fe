import uuid
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.core.config import supabase

router = APIRouter(prefix="/storage", tags=["Storage"])

@router.post("/upload", summary="Upload multiple images")
async def upload_multiple_images(files: List[UploadFile] = File(...)):
    """
    Uploads multiple images to Supabase 'property-images' bucket.
    Returns a list of public URLs.
    """
    public_urls = []
    
    for file in files:
        # 1. Generate unique filename
        ext = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        
        try:
            # 2. Read file content
            content = await file.read()
            
            # 3. Upload to Supabase Storage
            # Note: Ensure you have a bucket named 'property-images' set to PUBLIC
            res = supabase.storage.from_("property-images").upload(
                path=filename,
                file=content,
                file_options={"content-type": file.content_type}
            )
            
            # 4. Get Public URL
            url = supabase.storage.from_("property-images").get_public_url(filename)
            public_urls.append(url)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload {file.filename}: {str(e)}")

    return {"urls": public_urls}
