from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from models.base import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)

    paid_by = Column(Integer, ForeignKey("users.id"))
    split_type = Column(String, default="equal")

    created_at = Column(DateTime, default=datetime.utcnow)

    ExSplits = relationship("ExpenseSplit",back_populates="expense")


    
    