from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from postgrest.exceptions import APIError
from app.api import users, onboarding, matching, properties, questions, storage, auth
from app.core.errors import global_exception_handler, supabase_exception_handler

app = FastAPI(
    title="Dwllr AI Matchmaker API",
    description="""
    The complete backend for Dwllr, a "Tinder for housemates" application.
    """,
    version="1.2.0",
)

# CORS Policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(APIError, supabase_exception_handler)

# Include Routers
app.include_router(auth.router) # Auth must be first for Swagger order
app.include_router(users.router)
app.include_router(onboarding.router)
app.include_router(matching.router)
app.include_router(properties.router)
app.include_router(questions.router)
app.include_router(storage.router)

@app.get("/", include_in_schema=False)
async def root():
    return {"message": "Dwllr API is live and healthy."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
