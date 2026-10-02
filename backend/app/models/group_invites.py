from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from models.base import Base

class GroupInvite(Base):

    __tablename__ = "group_invites"

    id = Column(Integer, primary_key=True)

    group_id = Column(Integer, ForeignKey("groups.id"))

    invite_token = Column(String, unique=True)

    invited_by = Column(Integer, ForeignKey("users.id"))

    created_at = Column(DateTime, default=datetime.utcnow)