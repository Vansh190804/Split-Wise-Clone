from models.base import Base
from sqlalchemy import Column, Integer, ForeignKey, DateTime
from datetime import datetime

class GroupCheckpoint(Base):
    __tablename__ = "group_checkpoints"

    id = Column(Integer, primary_key=True)

    group_id = Column(
        Integer,
        ForeignKey("groups.id"),
        nullable=False,
        unique=True
    )

    settled_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
