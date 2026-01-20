from pydantic import BaseModel
from enum import Enum

class ReactionType(str, Enum):
    like = "like"
    clap = "clap"
    star = "star"

class ReactionBase(BaseModel):
    type: ReactionType

class ReactionCreate(ReactionBase):
    pass

class ReactionResponse(ReactionBase):
    id: int
    shoutout_id: int
    user_id: int

    class Config:
        from_attributes = True
