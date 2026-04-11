from pydantic import BaseModel
from typing import List

class QuizResponse(BaseModel):
    user_id: str
    responses: dict
