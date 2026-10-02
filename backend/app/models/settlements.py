from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from datetime import datetime

from models.base import Base

class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(Integer, primary_key=True)

    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    paid_by = Column(Integer, ForeignKey("users.id"))
    paid_to = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)

    created_at = Column(DateTime, default=datetime.utcnow)