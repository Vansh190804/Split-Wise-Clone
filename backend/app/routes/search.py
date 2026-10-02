from fastapi import APIRouter, Depends
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session
from models.users import User
from models.group import Group
from models.group_members import GroupMember
import uuid
from models.friendship import Friendship
from core.db import get_db
from auth.dependencies import get_current_user
from schemas.schema import SearchRequest


router = APIRouter(prefix='/search', tags=['search'])

# understand this shit
@router.post('/')
def search(
    data: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
   
   search_results = []

   alreadySelected = data.selectedMembers
   selectedGroup_members = db.query(GroupMember).filter(
       GroupMember.group_id.in_([g['item_id'] for g in alreadySelected if g['is_group']])
   ).all()


   #search by group
   groups = db.query(Group).filter(
       Group.name.ilike(f'%{data.query}%'),
       Group.is_active is True,
       Group.id.notin_([g['item_id'] for g in alreadySelected if g['is_group']])
    ).all()

   for g in groups:
       unique_id = str(uuid.uuid4())
       search_results.append({
           "id": unique_id,
           "item_id": g.id,
           "name": g.name,
           "is_group": True,
           "is_active": g.is_active
       })

   #search by friends
   friends = db.query(Friendship).filter(
       or_(
          Friendship.user_id_1 == current_user.id,
          Friendship.user_id_2 == current_user.id
       )
   ).all()


   friend_users = db.query(User).filter(
      and_(
         or_(
            User.id.in_([f.user_id_1 for f in friends if f.user_id_1 != current_user.id]),
            User.id.in_([f.user_id_2 for f in friends if f.user_id_2 != current_user.id]),
           ),
        User.name.ilike(f'%{data.query}%'),
        User.id.notin_([f['item_id'] for f in alreadySelected if not f['is_group']]),
        User.id.notin_([sm.user_id for sm in selectedGroup_members]),
      )
   ).all()

   print(friend_users)

   for f in friend_users:
       unique_id = str(uuid.uuid4())
       search_results.append({
              "id": unique_id,
              "item_id": f.id,
              "name": f.name,
              "is_group": False,
              "is_active": None
       })

   return search_results

