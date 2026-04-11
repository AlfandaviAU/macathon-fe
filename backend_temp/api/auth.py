from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from app.core.config import supabase
from app.core.auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["Authentication"])

class UserRegisterSchema(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    role: str = "tenant"

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    role: str

@router.post("/register", response_model=Token)
async def register(user_data: UserRegisterSchema):
    # 1. Check if user already exists
    existing_user = supabase.table("profiles").select("id").eq("email", user_data.email).execute()
    if existing_user.data:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Hash password
    hashed_password = get_password_hash(user_data.password)

    # 3. Create user in profiles
    new_user = supabase.table("profiles").insert({
        "name": user_data.name,
        "email": user_data.email,
        "phone": user_data.phone,
        "password_hash": hashed_password,
        "role": user_data.role
    }).execute()
    
    if not new_user.data:
        raise HTTPException(status_code=500, detail="Failed to create user")
    
    user = new_user.data[0]
    
    # 4. Generate Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"], "role": user["role"]}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": user["id"],
        "role": user["role"]
    }

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

@router.post("/login", response_model=Token)
async def login(login_data: UserLoginSchema):
    # 1. Fetch user by email
    email = login_data.email.strip().lower()
    password = login_data.password.strip()
    
    res = supabase.table("profiles").select("*").eq("email", email).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    user = res.data[0]
    
    # 2. Verify password
    if not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # 3. Generate Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"], "role": user["role"]}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": user["id"],
        "role": user["role"]
    }
