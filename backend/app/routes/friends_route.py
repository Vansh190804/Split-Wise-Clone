from operator import and_ , or_
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, aliased
from schemas.schema import EmailRequest, SearchFriend
from models.friendship import Friendship
from models.pendingFriendInvitation import PendingFriendInvitation
from models.users import User
from models.expenses import Expense
from models.expense_split import ExpenseSplit
from models.group_members import GroupMember
from models.settlements import Settlement
from models.group import Group
import resend
import os
import uuid
from core.db import get_db
from auth.dependencies import get_current_user
from core.config import RESEND_API_KEY
from emails.template import render_html_existingUser, render_html_newUser
from helper_functions.settle_balances import settle_balances
from helper_functions.calculate_friend_balance import calculate_friend_balance

router = APIRouter(prefix='/friends', tags=['friends'])
resend.api_key = RESEND_API_KEY


@router.get('/')
def get_friends(
      db: Session = Depends(get_db),
      current_user: User = Depends(get_current_user)
):
    friendships = db.query(Friendship).filter(
          or_(
              Friendship.user_id_1 == current_user.id,
              Friendship.user_id_2 == current_user.id  
          ),
    ).all()

    result = []

    for f in friendships:
      user1 = db.query(User).filter(User.id == f.user_id_1).first()
      user2 = db.query(User).filter(User.id == f.user_id_2).first()

      result.append({
        "id": f.id,
        "user_id_1": f.user_id_1,
        "user_id_2": f.user_id_2,
        "user1_name": user1.name if user1 else None,
        "user2_name": user2.name if user2 else None,
        "user1_email": user1.email if user1 else None,
        "user2_email": user2.email if user2 else None,
        "user1_avatar": user1.avatar_url if user1 else None,
        "user2_avatar": user2.avatar_url if user2 else None,
      })

    return result



@router.post('/add')
def add_friend(
    data: EmailRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    print(os.getcwd())
    
    email = data.email 
    token = str(uuid.uuid4())
    
    existing_user = db.query(User).filter(User.email == email).first()

    if existing_user: 
        if(existing_user.id == current_user.id):
           raise HTTPException(status_code=400, detail="You cannot add yourself as a friend")
       
        is_a_friend = db.query(Friendship).filter(
            or_(
                and_(
                     Friendship.user_id_1 == current_user.id,
                     Friendship.user_id_2 == existing_user.id
                ),
                and_(
                    Friendship.user_id_1 == existing_user.id,
                    Friendship.user_id_2 == current_user.id
                )
            )
       ).first()

        if is_a_friend:
           raise HTTPException(status_code=400, detail="This user is already your friend")

        friendship = Friendship(
            user_id_1 = current_user.id,
            user_id_2 = existing_user.id,
            status = "pending"
        )

        db.add(friendship)
        db.commit()

    elif not existing_user:
         new_user = User(
            name = email.split('@')[0],
            email = data.email,
            avatar_url = None,
            registered = False
         )

         db.add(new_user)
         db.commit()

         friendship = Friendship(
            user_id_1 = current_user.id,
            user_id_2 = new_user.id,
            status = "pending" 
         )

         db.add(friendship)
         db.commit()

    subject = "Splitwise Invitation from " + current_user.name

    htmlForNewUser = render_html_newUser(
        sender_name = current_user.name,  
        invite_link = f"http://localhost:5173/friend-invite/{token}"
    )

    htmlForExisting = render_html_existingUser(
            sender_name = current_user.name,
            invite_link = f"http://localhost:5173/friend-invite/{token}"
       )

    try:
          already_pending = db.query(PendingFriendInvitation).filter(
              PendingFriendInvitation.sender_id == current_user.id,
              PendingFriendInvitation.receiver_email == email
            ).first()

          if already_pending:
              raise HTTPException(status_code=400, detail="An invitation has already been sent to this email")

          result = resend.Emails.send({
            "from": os.environ.get("EMAIL_FROM", "Splitwise <onboarding@resend.dev>"),
            "to": [email],
            "subject": subject,
            "html": htmlForExisting if existing_user else htmlForNewUser
          })

          pending_invitation = PendingFriendInvitation(
           sender_id = current_user.id,
           receiver_email =  email,
           invite_token = token,
           status = "pending"
          ) 

          db.add(pending_invitation)
          db.commit()
          return {"success": True, "id": result["id"]}
       
        
    except Exception as e:
            print("Error sending email:", str(e))
            raise HTTPException(status_code=500, detail="Failed to send email")
    


@router.post('/valid-invite/{token}')
def validate_token(
     token: str,
     db: Session = Depends(get_db)
):
      valid_invite = db.query(PendingFriendInvitation).filter(PendingFriendInvitation.invite_token == token).with_for_update().first()

      if not valid_invite:
           raise HTTPException(status_code=404, detail="Invalid token") 
      
      return {"valid": True, "sender_id": valid_invite.sender_id, "receiver_email": valid_invite.receiver_email}



    
@router.post('/accept-invite/{token}')
def accept_invite(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
    valid_invite = db.query(PendingFriendInvitation).filter(PendingFriendInvitation.invite_token == token).with_for_update().first()

    if not valid_invite:
          raise HTTPException(status_code=404, detail="Invalid token")

    if not current_user:
          raise HTTPException(status_code=401, detail="User not authenticated")
    
    if current_user.id == valid_invite.sender_id:
          raise HTTPException(status_code=400, detail="You cannot accept your own invitation")

    friendship = db.query(Friendship).filter(
        or_(
            and_(
                 Friendship.user_id_1 == valid_invite.sender_id,
                 Friendship.user_id_2 == current_user.id
            ),
            and_(
                Friendship.user_id_1 == current_user.id,
                Friendship.user_id_2 == valid_invite.sender_id
            )
        )
    ).first()

    friendship.status = "accepted"

    return {"message": "Friendship established successfully"}

          
@router.post('/addFromGroup/{friendId}')
def add_friend_from_group(
     friendId: int, 
     db: Session = Depends(get_db),
     current_user: User = Depends(get_current_user)
):

    if(current_user.id == friendId):
          raise HTTPException(status_code=400, detail="You cannot add yourself as a friend")
    
    is_a_friend = db.query(Friendship).filter(
            or_(
                and_(
                     Friendship.user_id_1 == current_user.id,
                     Friendship.user_id_2 == friendId
                ),
                and_(
                    Friendship.user_id_1 == friendId,
                    Friendship.user_id_2 == current_user.id
                )
            )
       ).first()

       
    if is_a_friend:
           raise HTTPException(status_code=400, detail="This user is already your friend")

    friendship = Friendship(
        user_id_1 = current_user.id,
        user_id_2 = friendId,
        status = "accepted"
    )

    db.add(friendship)
    db.commit()

    return {"message": "Friendship established successfully"}


       

@router.get('/{friend_id}/balances')
def friend_balances(
     friend_id: int,
     db: Session = Depends(get_db),
     current_user: User = Depends(get_current_user)
):

    total_balances = calculate_friend_balance(current_user, friend_id, db)     

    total_transactions = settle_balances(total_balances, db)

    total_current_user_balances = total_balances.get(current_user.id, 0)

    return {"transactions": total_transactions, "balances": total_balances, "current_user_balances": total_current_user_balances}




@router.delete('/remove/{friendId}')
def remove_friend(
     friendId: int, 
     db: Session = Depends(get_db),
     current_user: User = Depends(get_current_user)
):
     
    # check if friend shares a group then ask to remove from group or delete the group entirely
    groups = db.query(Group).join(GroupMember, Group.id == GroupMember.group_id).filter(
          GroupMember.user_id == current_user.id
    ).all()

    for g in groups:
       is_friend = db.query(GroupMember).filter(
          GroupMember.group_id == g.id,
          GroupMember.user_id == friendId
       ).first()

       if is_friend:
            raise HTTPException(status_code=400, detail="You cannot remove this friend as you both are part of a group. Please remove them from the group first")


    friendship = db.query(Friendship).filter(
            or_(
                and_(
                     Friendship.user_id_1 == current_user.id,
                     Friendship.user_id_2 == friendId
                ),
                and_(
                    Friendship.user_id_1 == friendId,
                    Friendship.user_id_2 == current_user.id
                )
            )
        ).first()


    db.delete(friendship)
    db.commit()

    me = aliased(ExpenseSplit)
    friend = aliased(ExpenseSplit)

    non_group_expenses = []
    settlements = []

    nge = (
      db.query(Expense, me, friend).
      join(me, Expense.id == me.expense_id).
      join(friend, Expense.id == friend.expense_id).
      filter(
           me.user_id == current_user.id,
           friend.user_id == friendId,
           Expense.group_id is None
      ).all()
    )

    ngs = (
         db.query(Settlement).
         filter(
            Settlement.group_id is None,
            or_(
                and_(
                    Settlement.paid_by == current_user.id,
                    Settlement.paid_to == friendId
                ),
                and_(
                    Settlement.paid_by == friendId,
                    Settlement.paid_to == current_user.id
                )
            )
         ).all()
    )

    for expense, es, fs in nge:
        non_group_expenses.append(expense)
        db.delete(expense)
        db.delete(es)
        db.delete(fs)

    for settlement in ngs:
         settlements.append(settlement)
         db.delete(settlement)

    db.commit()

    return non_group_expenses, settlements

  

    
    
@router.post('/search')
def search_friends(
    data: SearchFriend,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    friends = db.query(Friendship).filter(
         or_(
            Friendship.user_id_1 == current_user.id,
            Friendship.user_id_2 == current_user.id
         ),
         Friendship.status == "accepted",
    ).all()

    filtered_friends = db.query(User).filter(
        or_(
            User.id.in_([f.user_id_1 for f in friends if f.user_id_1 != current_user.id]),
            User.id.in_([f.user_id_2 for f in friends if f.user_id_2 != current_user.id])
        ),
        User.name.ilike(f'%{data.query}%')
    ).all()

    if data.group_id is not None:
        group_members = db.query(GroupMember).filter(GroupMember.group_id == data.group_id).all()
        group_member_ids = [member.user_id for member in group_members]
        filtered_friends = [friend for friend in filtered_friends if friend.id not in group_member_ids]

    return filtered_friends 
    

@router.get('/{friend_id}/route')
def get_friend(
    friend_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    friendship = db.query(Friendship).filter(
            or_(
                and_(
                     Friendship.user_id_1 == current_user.id,
                     Friendship.user_id_2 == friend_id
                ),
                and_(
                    Friendship.user_id_1 == friend_id,
                    Friendship.user_id_2 == current_user.id
                )
            )
     ).first()

    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found")

    friend = db.query(User).filter(User.id == friend_id).first()

    response = {
        "id": friendship.id,
        "user_id_1": current_user.id,
        "user_id_2": friend.id,
        "user1_name": current_user.name,
        "user2_name": friend.name,
        "user1_email": current_user.email,
        "user2_email": friend.email,
        "user1_avatar": current_user.avatar_url,
        "user2_avatar": friend.avatar_url
    }

    return response
    
       


