from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from core.db import get_db
from auth.dependencies import get_current_user
from models.users import User
from models.group_invites import GroupInvite
from models.group import Group

router = APIRouter(prefix="/invites", tags=["invites"])


@router.get('/{token}')
def verify_invite(
    token: str,
    db: Session = Depends(get_db)
):
    invite = db.query(GroupInvite).filter(
        GroupInvite.invite_token == token
    ).first()

    if not invite:
        return HTTPException(status_code=404, detail="Invalid invite token")
    
    if invite.created_at and (datetime.utcnow() - invite.created_at).total_seconds() > 86400:
       return HTTPException(status_code=400, detail="Invite token expired")
    
    groupName = db.query((Group)).filter(Group.id == invite.group_id).first().name
    invitedByName = db.query((User)).filter(User.id == invite.invited_by).first().name

    invite_details = {
        "group_id": invite.group_id,
        "group_name": groupName,
        "invited_by": invite.invited_by,
        "invited_by_name": invitedByName,
        "invite_token": invite.invite_token,
        "created_at": invite.created_at
    }
   
    return { "valid": True, "data": invite_details}
 

@router.post('/register/{token}')
def register_for_invite(
    token: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
): 
    
    invite = db.query(GroupInvite).filter(
        GroupInvite.invite_token == token
    ).first()

    print("Invite token:", invite)

    if not invite or (invite.created_at and (datetime.utcnow() - invite.created_at).total_seconds() > 86400):
        raise HTTPException(status_code=404, detail="Invalid invite token")

    if(current_user == None):
        raise HTTPException(status_code=401, detail="User not Registered")

    return { "message": "User registered successfully", "group_id": invite.group_id, "user_id": current_user.id}



