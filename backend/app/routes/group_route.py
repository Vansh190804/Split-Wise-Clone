import json
import uuid
import resend
import os

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from models.friendship import Friendship
from core.db import get_db
from auth.dependencies import get_current_user
from models.users import User
from models.group import Group
from models.group_members import GroupMember
from models.group_invites import GroupInvite

from schemas.schema import GroupCreate, UserLeave

from models.expenses import Expense
from models.settlements import Settlement

from helper_functions.calculate_balances import calculate_balances
from emails.template import render_html_inviteToGroup
from services.storage import supabase

router = APIRouter(prefix="/groups", tags=["groups"])


@router.post('/')
def create_group(
    group_create: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = Group(
        name = group_create.name,
    )

    db.add(group)
    db.commit()
    db.refresh(group)

    membership = GroupMember(
       group_id = group.id,
       user_id = current_user.id
    )

    db.add(membership)
    db.commit()
    db.refresh(group)

    if group_create.members:
        for member in group_create.members:
            existing_user = db.query(User).filter(User.email == member['email']).first()

            # user exist 
            if existing_user:
                new_member = GroupMember(
                    group_id = group.id,
                    user_id = existing_user.id
                )
                db.add(new_member)
                db.commit()
                continue

            # user does not exist
            new_user = User(
                name = member['name'],
                email = member['email'],
                registered = False,
                avatar_url = None
            )

            db.add(new_user)
            db.flush()

            new_member = GroupMember(
                group_id = group.id,
                user_id = new_user.id
            )

            db.add(new_member)
            db.commit()

            #send invitation
            
            token = str(uuid.uuid4())
            subject = "Splitwise Invitation from " + current_user.name
                                
            htmlForUser = render_html_inviteToGroup(
                sender_name = current_user.name, 
                group_name = group.name,
                invite_link = f"http://localhost:5173/group-invite/{token}"
            )
                            
            group_invite = GroupInvite(
                group_id = group.id,
                invited_by = current_user.id,
                invite_token = token
            )
                            
            result = resend.Emails.send({
                "from": os.environ.get("EMAIL_FROM", "Splitwise <onboarding@resend.dev>"),
                "to": [member['email']],
                "subject": subject,
                "html": htmlForUser
            })
                            
            db.add(group_invite)
            db.commit()

    return group


@router.get('/my')
def get_my_groups(
    db: Session = Depends(get_db),
    current_user: User =Depends(get_current_user)
):
    membership = db.query(GroupMember).filter(
        GroupMember.user_id == current_user.id
    ).all()

    groups = []

    for m in membership:
        group = db.query(Group).filter(
          and_(
            Group.id == m.group_id,
            Group.is_active == True
          )
        ).first()

        if group: 
            groups.append(group)
    
    return groups


@router.get('/{group_id}/members')
def get_group_members(
    group_id: int,
    db: Session =  Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    members = db.query(GroupMember).filter(GroupMember.group_id == group_id).all()

    details = db.query(User).filter(User.id.in_([member.user_id for member in members])).all()
    
    response = []

    for d in details:
        response.append({
            "id": d.id,
            "group_id": group_id,
            "name": d.name,
            "email": d.email,
            "registered": d.registered,
            "avatar_url": d.avatar_url
        })
    
    return {"members": members, "details": response}



@router.post('/leave')
def leave_group(
    data: UserLeave,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if(current_user == None):
        raise HTTPException(status_code=401, detail="User not authenticated.")
    
    if(data.balance != 0):
        raise HTTPException(status_code=400, detail="You cannot leave the group without settling your balances.")
    
    member = db.query(GroupMember).filter(
        GroupMember.group_id == data.group_id,
        GroupMember.user_id == data.userToDelete
    ).first()

    print("Member to be deleted:", member)

    if not member:
        raise HTTPException(status_code=404, detail="You are already not a member of this group")
    
    db.delete(member)
    db.commit()



@router.post('/{group_id}/delete')
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if(current_user == None):
        raise HTTPException(status_code = 401, detail="User not authenticated.")
    
    group = db.query(Group).filter(Group.id == group_id).first()

    if not group:
        raise HTTPException(status_code=404, detail="Group not found.")
    
    group.is_active = False

    expenses = db.query(Expense).filter(Expense.group_id == group_id).all()
    settlements = db.query(Settlement).filter(Settlement.group_id == group_id).all()

    for ex in expenses:
        db.delete(ex)

    for s in settlements:
        db.delete(s)

    db.commit()

    return {"message": "Group deleted successfully."}



@router.get('/{group_id}/balances')
def group_balances(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expenses = db.query(Expense).filter(Expense.group_id == group_id).all()
    
    transactions, balances, current_user_balances =  calculate_balances(expenses, group_id, None, current_user, db)

    return {"transactions": transactions, "balances": balances, "current_user_balances": current_user_balances}

    

@router.put('/{group_id}/update')
def update_group_name(
    group_id: int,
    name: str = Form(...),
    members_data: str = Form(...),
    avatar: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    group  = db.query(Group).filter(Group.id == group_id).first()
    members = json.loads(members_data)

    print(avatar)

    if not group: 
        raise HTTPException(status_code=404, detail="Group not found.")

    group.name = name

    if avatar:
        file_data = avatar.file.read()
        path = f"groups/{group_id}/avatar"
    
        supabase.storage.from_("Images").upload(
            path,
            file_data,
            {
              "content-type": avatar.content_type,
              "upsert": "true"
            }
        )
    
        avatar_url = supabase.storage.from_("Images").get_public_url(path)
        group.group_avatar = avatar_url
    
    if avatar is None and group.group_avatar:
        path = f"groups/{group_id}/avatar"
        supabase.storage.from_("Images").remove([path])
        group.group_avatar = None

    db.commit()
    db.refresh(group)

    members_added = []

    if members != None:
        existing_members = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id != current_user.id
        ).all()

        existing_member_ids = [member.user_id for member in existing_members]
        member_ids = [member['friendId'] for member in members]

        member_to_delete = [member for member in existing_members if member.user_id not in member_ids]

        for member in member_to_delete:
            db.delete(member)
            db.commit()

        new_members = [member for member in members if member['friendId'] not in existing_member_ids]

        if new_members:
            for member in new_members:
                # check if the user is already a member of the group
                already_member =( 
                      db.query(User).
                      join(GroupMember, GroupMember.user_id == User.id).
                      filter(
                          GroupMember.group_id == group_id,
                          User.email == member['email']
                      ).first()
                    )

                if already_member:
                    raise HTTPException(status_code=400, detail="One of the members is already a member of the group.")

                # check if the user is already registered in the system -> if yes add to the group and return
                
                existing_user = db.query(User).filter(User.email == member['email']).first()
                
                if existing_user:
                    new_member = GroupMember(
                        group_id = group_id,
                        user_id = existing_user.id
                    )
                
                    db.add(new_member)
                    db.commit()

                    members_added.append(existing_user)
                    continue

                # if the user is not registered, send an invitation email (also add the user with a pending status)
                # restricting him to some actions until he register and accepts the invitation
                
                new_user = User(
                    name = name,
                    email = member['email'],
                    registered = False,
                    avatar_url = None
                )
                
                db.add(new_user)
                db.flush()
                
                new_member = GroupMember(
                    group_id = group_id,
                    user_id = new_user.id
                )
                
                db.add(new_member)
                db.commit()

                members_added.append(new_user)
                
                # send invitation email logic
                
                token = str(uuid.uuid4())
                subject = "Splitwise Invitation from " + current_user.name
                    
                htmlForUser = render_html_inviteToGroup(
                    sender_name = current_user.name, 
                    group_name = group.name,
                    invite_link = f"http://localhost:5173/group-invite/{token}"
                )
                
                group_invite = GroupInvite(
                    group_id = group_id,
                    invited_by = current_user.id,
                    invite_token = token
                )
                
                result = resend.Emails.send({
                    "from": os.environ.get("EMAIL_FROM", "Splitwise <onboarding@resend.dev>"),
                    "to": [member['email']],
                    "subject": subject,
                    "html": htmlForUser
                })
                
                db.add(group_invite)
                db.commit()

    return members_added


    
@router.get('/allmembers')
def get_all_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memberships = db.query(GroupMember).filter(
        GroupMember.user_id == current_user.id
    ).all()

    group_ids = [m.group_id for m in memberships]

    all_members = db.query(GroupMember).filter(
        GroupMember.group_id.in_(group_ids)
    ).all()

    member_details = db.query(User).filter(
        User.id.in_([member.user_id for member in all_members])
    ).all()

    response = []
    group_member_format = []

    for d in member_details:
      if d.id != current_user.id:
        response.append({
            "id": d.id,
            "name": d.name,
            "email": d.email,
            "registered": d.registered,
            "avatar_url": d.avatar_url
        })

        group_member_format.append({
            "id": d.id,
            "name": d.name,
            "email": d.email,
            "registered": d.registered,
            "avatar_url": d.avatar_url,
            "group_id": next((m.group_id for m in all_members if m.user_id == d.id), None)
        })

    friendships = db.query(Friendship).filter(
        or_(
            Friendship.user_id_1 == current_user.id,
            Friendship.user_id_2 == current_user.id
        )
    ).all()

    friend_users = db.query(User).filter(
        User.id.in_(
            [f.user_id_1 if f.user_id_2 == current_user.id else f.user_id_2 for f in friendships]
        )
    ).all()

    for d in friend_users:
        if d.id != current_user.id and d.id not in [member.id for member in member_details]:
            response.append({
                "id": d.id,
                "name": d.name,
                "email": d.email,
                "registered": d.registered,
                "avatar_url": d.avatar_url
            })

            group_member_format.append({
                "id": d.id,
                "name": d.name,
                "email": d.email,
                "registered": d.registered,
                "group_id": None,
                "avatar_url": d.avatar_url
            })

    return {"members": response, "group_member_format": group_member_format}