from sqlalchemy import Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import relationship
from models.base import Base

class AuthAccount(Base):
    __tablename__ = "auth_accounts"

    id = Column(Integer, primary_key=True, index=True)

    user_id= Column(Integer, ForeignKey("users.id"))

    provider = Column(String, nullable=False)

    provider_user_id = Column(String, nullable=True)

    password = Column(String)

    owner = relationship("User", back_populates="linked_accounts")


