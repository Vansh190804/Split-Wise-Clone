from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from datetime import datetime
from models.base import Base

class SettlementCheckPoint(Base):
    __tablename__ = "settlement_checkpoints"

    id = Column(Integer, primary_key=True)

    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    settled_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user1_id", "user2_id"),
    )