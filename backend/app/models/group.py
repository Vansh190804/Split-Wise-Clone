from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from models.base import Base

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)

    group_avatar = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    is_active = Column(Boolean, default=True)

    members = relationship("GroupMember", back_populates="group")