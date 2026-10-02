from models.settlementCheckPoint import SettlementCheckPoint
from models.groupCheckpoint import GroupCheckpoint
from sqlalchemy.orm import Session
from datetime import datetime



def update_settlement_checkpoint(
    user1_id: int,
    user2_id: int,
    db: Session
):

    user_a = min(user1_id, user2_id)
    user_b = max(user1_id, user2_id)

    checkpoint = db.query(SettlementCheckPoint).filter(
        SettlementCheckPoint.user1_id == user_a,
        SettlementCheckPoint.user2_id == user_b
    ).first()

    if checkpoint:
        checkpoint.settled_at = datetime.utcnow()
    else:
        db.add(
            SettlementCheckPoint(
                user1_id=user_a,
                user2_id=user_b,
                settled_at=datetime.utcnow()
            )
        )

    db.commit()
    return checkpoint

    
def update_group_checkpoint(
    group_id: int,
    db: Session
):
    checkpoint = db.query(GroupCheckpoint).filter(GroupCheckpoint.group_id == group_id).first()

    if checkpoint:
        checkpoint.settled_at = datetime.utcnow()

    else:
        db.add(
            GroupCheckpoint(
                group_id=group_id,
                settled_at=datetime.utcnow()
            )
        )

    db.commit()
    return checkpoint