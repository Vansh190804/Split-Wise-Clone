from sqlalchemy import Column, Integer, DateTime
from datetime import datetime
from models.base import Base

class SettlementBatch(Base):
    __tablename__ = "settlement_batches"

    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)