from pydantic import BaseModel
from typing import List

class ShoutOutCreate(BaseModel):
    message: str
    recipient_ids: List[int]
