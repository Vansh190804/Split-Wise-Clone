from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from models.base import Base

class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"))

    user_id = Column(Integer, ForeignKey("users.id"))

    group = relationship("Group", back_populates="members")