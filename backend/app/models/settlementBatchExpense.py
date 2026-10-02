from sqlalchemy import Column, Integer, ForeignKey
from models.base import Base


class SettlementBatchExpense(Base):
    __tablename__ = "settlement_batch_expenses"

    id = Column(Integer, primary_key=True)

    batch_id = Column(
        Integer,
        ForeignKey("settlement_batches.id"),
        nullable=False
    )

    expense_id = Column(
        Integer,
        ForeignKey("expenses.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )