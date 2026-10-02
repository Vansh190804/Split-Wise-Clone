from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship

from models.base import Base

class ExpenseSplit(Base):
    __tablename__ = "expenses_splits"

    id = Column(Integer, primary_key=True)

    expense_id = Column(Integer, ForeignKey("expenses.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    user_name = Column(String, nullable=False)
    amount = Column(Float)

    expense = relationship("Expense",back_populates="ExSplits")
    user = relationship("User")
