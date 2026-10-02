from sqlalchemy import Column, DateTime, Integer, String, ForeignKey
from models.base import Base
from datetime import datetime


class PendingFriendInvitation(Base):
    __tablename__ = "pending_friend_invites"
    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_email = Column(String, nullable=False)
    invite_token = Column(String, unique=True)
    status = Column(String, default="pending")

    created_at = Column(DateTime, default=datetime.utcnow)
