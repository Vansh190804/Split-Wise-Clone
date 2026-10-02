from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from models.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, nullable=False)

    name = Column(String)

    avatar_url = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    registered = Column(Boolean, default=True, nullable=False)

    linked_accounts = relationship("AuthAccount", back_populates="owner")
    groups = relationship("GroupMember")
