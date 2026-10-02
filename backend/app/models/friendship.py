from sqlalchemy import Column, Integer, ForeignKey, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from models.base import Base

class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True)
    user_id_1 = Column(Integer, ForeignKey("users.id"))
    user_id_2 = Column(Integer, ForeignKey("users.id")) 
    status = Column(String, default="pending")

    created_at = Column(DateTime, default=datetime.utcnow)
