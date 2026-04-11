import os
from supabase import create_client, Client
from dotenv import load_dotenv
from google import genai

load_dotenv()

# Supabase Setup
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://127.0.0.1:54321")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Gemini Setup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    gemini_model_name = 'gemini-3-flash-preview'
else:
    gemini_client = None
    gemini_model_name = None
