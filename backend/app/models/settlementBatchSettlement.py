from sqlalchemy import Column, Integer, ForeignKey
from models.base import Base

class SettlementBatchSettlement(Base):
    __tablename__ = "settlement_batch_settlements"

    id = Column(Integer, primary_key=True)

    batch_id = Column(
        Integer,
        ForeignKey("settlement_batches.id"),
        nullable=False
    )

    settlement_id = Column(
        Integer,
        ForeignKey("settlements.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )