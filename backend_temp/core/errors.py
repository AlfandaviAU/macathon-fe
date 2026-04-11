from fastapi import Request, status
from fastapi.responses import JSONResponse
from postgrest.exceptions import APIError

async def global_exception_handler(request: Request, exc: Exception):
    """
    Catches all unhandled exceptions and returns a structured JSON response.
    """
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": str(exc),
            "path": request.url.path
        }
    )

async def supabase_exception_handler(request: Request, exc: APIError):
    """
    Specifically handles Supabase/PostgREST errors (e.g., missing tables, constraint violations).
    """
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "Database Error",
            "message": exc.message,
            "code": exc.code,
            "details": exc.details
        }
    )
