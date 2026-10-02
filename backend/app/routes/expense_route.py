from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, aliased

from core.db import get_db
from auth.dependencies import get_current_user
from models.users import User
from models.expenses import Expense
from models.group import Group
from models.settlements import Settlement
from models.expense_split import ExpenseSplit
from models.group_members import GroupMember
from models.friendship import Friendship
from models.settlementBatch import SettlementBatch
from models.settlementBatchExpense import SettlementBatchExpense
from models.settlementBatchSettlement import SettlementBatchSettlement
from models.settlementCheckPoint import SettlementCheckPoint
from models.groupCheckpoint import GroupCheckpoint
from schemas.schema import ExpenseCreate

from helper_functions.calculate_balances import calculate_balances
from helper_functions.send_invitation import send_invitation

router = APIRouter(prefix="/expenses", tags=["expenses"])




@router.post('/')
def create_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # if we have more than one group, the only payer can be ourselves
    # if we are adding in a group with a non-member, only we can be the payer
    # conclusion -> when there are multiple groups or non-members, only we can be the payer 

    users = data.split_between
    if data.major_group_id != None:
      group_users = [
       row[0]
       for row in db.query(GroupMember.user_id)
        .filter(GroupMember.group_id == data.major_group_id)
        .all()
      ]
    
      if(any(u_id not in group_users for u_id in users) and data.paid_by != current_user.id): 
        raise HTTPException(status_code=400, detail="you can not add an expense that does not involve yourself, unless the expense is in a group")


    split_map = {}

    if data.split_type == 'equal':
        split_amount = data.amount / len(users)
        for user_id in users:
            split_map[user_id] = split_amount
    
    elif data.split_type == 'percentage':
        for user_id in users:
            percentage = data.splits[data.split_between.index(user_id)]
            amount = (percentage  / 100) * data.amount
            split_map[user_id] = amount
    
    elif data.split_type == 'custom':
        for user_id in users:
            amount = data.splits[data.split_between.index(user_id)]
            split_map[user_id] = amount

    if data.major_group_id != None:

        expense = Expense(
            title=data.title,
            amount=data.amount,
            group_id = None,
            paid_by=data.paid_by,
            split_type=data.split_type
        )

        db.add(expense)
        db.flush()

        for user_id, amount in split_map.items():

            user = db.query(User).filter(User.id == user_id).first()
            is_friend = db.query(Friendship).filter(
                or_(
                    and_(
                        Friendship.user_id_1 == current_user.id,
                        Friendship.user_id_2 == user_id
                    ),
                    and_(
                        Friendship.user_id_1 == user_id,
                        Friendship.user_id_2 == current_user.id
                    )
                )
            ).first()

            #if a financial relationship exist then add user as a friend
            if not is_friend and user_id != current_user.id:
               send_invitation(
                   current_user=current_user,
                   user=user,
                   db=db
               )
                
            db.add(
                ExpenseSplit(
                    expense_id = expense.id,
                    user_id = user_id,
                    user_name = user.name,
                    amount = amount
                )
            )

        db.commit()

        return {"message": "Expense created", "expense": expense}

    major_group_users = {
        user_id
        for (user_id,) in db.query(GroupMember.user_id).filter(GroupMember.group_id == data.major_group_id).all()
    }

    group_split = {}
    outside_split = {}

    for user_id, amount in split_map.items():
        if user_id in major_group_users:
            group_split[user_id] = amount
        else:
            outside_split[user_id] = amount

    group_amount = sum(group_split.values())

    if group_amount > 0:
        group_expense = Expense(
           title = data.title,
           amount = group_amount, 
           group_id = data.major_group_id, 
           paid_by = data.paid_by,
           split_type = data.split_type
        )

        db.add(group_expense)
        db.flush()

        for user_id, amount in group_split.items():
            user = db.query(User).filter(User.id == user_id).first()

            is_friend = db.query(Friendship).filter(
                or_(
                    and_(
                        Friendship.user_id_1 == current_user.id,
                        Friendship.user_id_2 == user_id
                    ),
                    and_(
                        Friendship.user_id_1 == user_id,
                        Friendship.user_id_2 == current_user.id
                    )
                )
            ).first()
            
            #if a financial relationship exist then add user as a friend
            if not is_friend and user_id != current_user.id:
                send_invitation(
                    current_user=current_user,
                    user=user,
                    db=db
                )

            db.add(
                ExpenseSplit(
                    expense_id = group_expense.id,
                    user_id = user_id,
                    user_name = user.name,
                    amount = amount
                )
            )

        db.commit()


    for user_id, amount in outside_split.items():

        outside_expense = Expense(
            title = data.title,
            amount = amount,
            group_id = None,
            paid_by = data.paid_by,
            split_type = "custom"
        )

        db.add(outside_expense)
        db.flush()

                    
        user = db.query(User).filter(User.id == user_id).first()
        is_friend = db.query(Friendship).filter(
            or_(
                and_(
                    Friendship.user_id_1 == current_user.id,
                    Friendship.user_id_2 == user_id
                ),
                and_(
                    Friendship.user_id_1 == user_id,
                    Friendship.user_id_2 == current_user.id
                )
                )
        ).first()
                        
        #if a financial relationship exist then add user as a friend
        if not is_friend and user_id != current_user.id:
            send_invitation(
                current_user=current_user,
                user=user,
                db=db
            )

        db.add(
            ExpenseSplit(
                expense_id = outside_expense.id,
                user_id = user_id,
                user_name = user.name,
                amount = amount
            )
        )

        db.add(
            ExpenseSplit(
                expense_id = outside_expense.id,
                user_id = data.paid_by,
                user_name = db.query(User).filter(User.id == data.paid_by).first().name,
                amount = 0
            )
        )

    db.commit()

    return {"message": "Expense created", "expense": group_expense if group_amount > 0 else None}




@router.get('/group/{group_id}')
def get_group_expenses(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    expenses = db.query(Expense).filter(Expense.group_id == group_id).all()

    expense_split = db.query(ExpenseSplit).filter(
        ExpenseSplit.expense_id.in_([e.id for e in expenses]),
    ).all()
    
    response = []
    splits = []
    
    for ex in expenses:
        paid_name = db.query(User).filter(User.id == ex.paid_by).first().name
        response.append({
            "id": ex.id,
            "title": ex.title,
            "amount": round(ex.amount, 2),
            "paid_by": ex.paid_by,
            "paid_name": paid_name,
            "split_type": ex.split_type,
            "group_id": ex.group_id,
            "created_at": ex.created_at
        })

    for sp in expense_split:
        avatar = db.query(User.avatar_url).filter(User.id == sp.user_id).scalar()
        splits.append({
            "id": sp.id,
            "expense_id": sp.expense_id,
            "user_id": sp.user_id,
            "user_name": sp.user_name,
            "avatar_url": avatar if avatar else None,
            "amount": round(sp.amount, 2)
        })

    checkpoint = db.query(GroupCheckpoint).filter(GroupCheckpoint.group_id == group_id).first()
    
    return {"expenses": response, "splits": splits, "settled_until": checkpoint.settled_at if checkpoint else None}




@router.get('/friend/{friend_id}')
def get_friend_expenses(
    friend_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    nonGroupExpenses = []
    groupExpenses = []

    print("friend_id", friend_id)

    me = aliased(ExpenseSplit)
    friend = aliased(ExpenseSplit)

    nge =(
        db.query(Expense, me, friend)
        .join(me, Expense.id == me.expense_id)
        .join(friend, Expense.id == friend.expense_id)
        .filter(
            me.user_id == current_user.id,
            friend.user_id == friend_id,
            Expense.group_id == None
        )
    )

    for e, es, fs in nge:
        nonGroupExpenses.append({
            "id": e.id,
            "title": e.title,
            "amount": round(e.amount, 2),
            "splits": [split for split in db.query(ExpenseSplit).filter(ExpenseSplit.expense_id == e.id).all()],
            "paid_by": e.paid_by,
            "paid_name": db.query(User).filter(User.id == e.paid_by).first().name,
            "label": "You lent" if e.paid_by == current_user.id else "lent you" if e.paid_by == friend_id else "you owe nothing",
            "split_type": e.split_type,
            "group_id": e.group_id,
            "created_at": e.created_at
        })
     
    mygroup = aliased(GroupMember)
    friendgroup = aliased(GroupMember)

    groups_shared = (
     db.query(mygroup).
     join(friendgroup, mygroup.group_id == friendgroup.group_id).
     filter(
         mygroup.user_id == current_user.id,
         friendgroup.user_id == friend_id
     ).all()      
    )

    groups = db.query(Group).filter(Group.id.in_([g.group_id for g in groups_shared])).all()

    for g in groups:
        expenses = db.query(Expense).filter(Expense.group_id == g.id)

        transactions, balances, current_user_balances = calculate_balances(expenses, g.id, None, current_user=current_user, db=db)

        for t in transactions:
            if(t["from_userid"] == current_user.id and t["to_userid"] == friend_id 
               or t["from_userid"] == friend_id and t["to_userid"] == current_user.id):
                
                groupExpenses.append({
                    "group_id": g.id,
                    "group_name": g.name,
                    "group_avatar": g.group_avatar,
                    "from": t["from"],
                    "to": t["to"],
                    "label": "You owe" if t["from_userid"] == current_user.id else "Owes you",
                    "amount": t["amount"],
                    "created_at": t["created_at"]
                })

        if not groupExpenses:
            groupExpenses.append({
                "group_id": g.id,
                "group_name": g.name,
                "group_avatar": g.group_avatar,
                "label": "You are settled up",
                "amount": 0,
                "created_at": t["created_at"]
            })

    checkpoint = db.query(SettlementCheckPoint).filter(
        SettlementCheckPoint.user1_id == min(current_user.id, friend_id),
        SettlementCheckPoint.user2_id == max(current_user.id, friend_id)
    ).first()

    
    return {"non_group_expenses": nonGroupExpenses, "group_expenses": groupExpenses,
             "settled_until": checkpoint.settled_at if checkpoint else None}



@router.get('/dashboard')
def calculate_dashboard_balances(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pair_balances = {}
    all_transactions = []

    def add_transactions(transactions):
        for t in transactions:

            if t["from_userid"] == current_user.id:
                other_user = t["to_userid"]

                pair_balances[other_user] = (
                    pair_balances.get(other_user, 0)
                    - t["amount"]
                )           

            elif t["to_userid"] == current_user.id:
                other_user = t["from_userid"]

                pair_balances[other_user] = (
                    pair_balances.get(other_user, 0)
                    + t["amount"]
                )

    groups = db.query(Group).join(
        GroupMember,
        Group.id == GroupMember.group_id
    ).filter(
        GroupMember.user_id == current_user.id
    ).all()

    for group in groups:

        group_expenses = db.query(Expense).filter(
            Expense.group_id == group.id
        ).all()

        transactions, _, _ = calculate_balances(
            expenses=group_expenses,
            group_id=group.id,
            friend_id=None,
            current_user=current_user,
            db=db
        )

        add_transactions(transactions)

    friendships = db.query(Friendship).filter(
        or_(
            Friendship.user_id_1 == current_user.id,
            Friendship.user_id_2 == current_user.id
        ),
        Friendship.status == "accepted"
    ).all()

    for friendship in friendships:

        if friendship.user_id_1 == current_user.id:
            friend_id = friendship.user_id_2
        else:
            friend_id = friendship.user_id_1

        friend_expenses = db.query(Expense).join(
            ExpenseSplit,
            Expense.id == ExpenseSplit.expense_id
        ).filter(
            Expense.group_id == None,
            or_(
                and_(
                    Expense.paid_by == current_user.id,
                    ExpenseSplit.user_id == friend_id
                ),
                and_(
                    Expense.paid_by == friend_id,
                    ExpenseSplit.user_id == current_user.id
                )
            )
        ).all()

        transactions, _, _ = calculate_balances(
            expenses=friend_expenses,
            group_id=None,
            friend_id=friend_id,
            current_user=current_user,
            db=db
        )

        add_transactions(transactions)

    you_owe = []
    you_are_owed = []

    for user_id, amount in pair_balances.items():

        if amount == 0:
            continue

        user = db.query(User).filter(User.id == user_id).first()

        if amount < 0:

            you_owe.append({
                "user_id": user_id,
                "name": user.name,
                "email": user.email,
                "avatar_url": user.avatar_url,
                "amount": abs(amount)
            })

            all_transactions.append({
                "from_userid": current_user.id,
                "to_userid": user_id,
                "from": current_user.name,
                "to": user.name,
                "amount": abs(amount)
            })

        else:

            you_are_owed.append({
                "user_id": user_id,
                "name": user.name,
                "email": user.email,
                "avatar_url": user.avatar_url,
                "amount": amount
            })

            all_transactions.append({
                "from_userid": user_id,
                "to_userid": current_user.id,
                "from": user.name,
                "to": current_user.name,
                "amount": amount
            })

    return {
        "you_owe": you_owe,
        "you_are_owed": you_are_owed,
        "all_transactions": all_transactions
    }



@router.get('/mytotalExpense')
def my_expenses(
   db: Session = Depends(get_db),
   current_user: User = Depends(get_current_user)
):
    expenses = db.query(Expense, ExpenseSplit).join(ExpenseSplit, Expense.id == ExpenseSplit.expense_id).filter(
          ExpenseSplit.user_id == current_user.id
    ).all()

    settlements = db.query(Settlement).filter(
        or_(
            Settlement.paid_by == current_user.id,
            Settlement.paid_to == current_user.id
        )
    ).all()

    balance = 0

    for e, es in expenses:
        if e.paid_by == current_user.id:
             balance += e.amount - es.amount
        else:
             balance -= es.amount

    for s in settlements:
        if s.paid_by == current_user.id:
             balance += s.amount
        else:
             balance -= s.amount

    return {"balance": balance }
            


@router.get('/allExpenses')
def get_all_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    groups = db.query(Group).join(GroupMember, Group.id == GroupMember.group_id).filter(
        GroupMember.user_id == current_user.id
    ).all()

    all_expenses = []
    all_splits = []

    for g in groups:
        group_expenses = db.query(Expense).filter(Expense.group_id == g.id).all()

        for e in group_expenses:
            paid_name = db.query(User).filter(User.id == e.paid_by).first().name
            all_expenses.append({
                "id": e.id,
                "title": e.title,
                "amount": round(e.amount, 2),
                "paid_by": e.paid_by,
                "paid_name": paid_name,
                "split_type": e.split_type,
                "group_id": e.group_id,
                "group_name": g.name,
                "created_at": e.created_at
            })
            splits = db.query(ExpenseSplit).filter(ExpenseSplit.expense_id == e.id).all()
            all_splits.extend(splits)

    non_ge = db.query(Expense).join(ExpenseSplit, Expense.id == ExpenseSplit.expense_id).filter(
        ExpenseSplit.user_id == current_user.id,
        Expense.group_id == None
    ).all()

    
    for e in non_ge:
        paid_name = db.query(User).filter(User.id == e.paid_by).first().name
        all_expenses.append({
            "id": e.id,
            "title": e.title,
            "amount": round(e.amount, 2),
            "paid_by": e.paid_by,
            "paid_name": paid_name,
            "split_type": e.split_type,
            "group_name": None,
            "group_id": None,
            "created_at": e.created_at
        })
        splits = db.query(ExpenseSplit).filter(ExpenseSplit.expense_id == e.id).all()
        all_splits.extend(splits)


    return {"expenses": all_expenses, "splits": all_splits}

    
    

@router.put('/update/{expense_id}')
def edit_expense(
    expense_id: int,
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()

    if not expense: 
        raise HTTPException(status_code=404, detail="Expense not found")

    original_group = expense.group_id
    new_group = data.major_group_id

    split_map = {}
    users = data.split_between
    expense_splits = db.query(ExpenseSplit).filter(ExpenseSplit.expense_id == expense_id).all()
    
    if data.split_type == 'equal':
        split_amount = data.amount / len(users)
        for user_id in users:
            split_map[user_id] = split_amount
        
    elif data.split_type == 'percentage':
        for user_id in users:
            percentage = data.splits[data.split_between.index(user_id)]
            amount = (percentage  / 100) * data.amount
            split_map[user_id] = amount
        
    elif data.split_type == 'custom':
        for user_id in users:
            amount = data.splits[data.split_between.index(user_id)]
            split_map[user_id] = amount

    if new_group == None:

        for split in expense_splits:
            if split.user_id not in split_map.keys():
                db.delete(split)
                db.commit()

        for user_id, amount in split_map.items():
            user = db.query(User).filter(User.id == user_id).first()

            if user_id in [es.user_id for es in expense_splits]:
                expense_split = db.query(ExpenseSplit).filter(
                    ExpenseSplit.expense_id == expense_id,
                    ExpenseSplit.user_id == user_id
                ).first()
                expense_split.amount = amount

            else:
                db.add(
                    ExpenseSplit(
                    expense_id=expense_id,
                    user_id=user_id,
                    user_name=user.name,
                    amount=amount
                    )
                )
   

            is_friend = db.query(Friendship).filter(
                or_(
                    and_(
                        Friendship.user_id_1 == current_user.id,
                        Friendship.user_id_2 == user_id
                    ),
                    and_(
                        Friendship.user_id_1 == user_id,
                        Friendship.user_id_2 == current_user.id
                        )
                    )
            ).first()

            #if a financial relationship exist then add user as a friend
            if not is_friend and user_id != current_user.id:
                send_invitation(
                    current_user=current_user,
                    user=user,
                    db=db
            )

            expense.title = data.title
            expense.amount = data.amount
            expense.group_id = None
            expense.paid_by = data.paid_by
            expense.split_type = data.split_type

            db.commit()

    elif new_group != None:
        group_members = db.query(GroupMember).filter(GroupMember.group_id == new_group).all()

        for user_id in split_map.keys():
            if  user_id not in [gm.user_id for gm in group_members]:
                raise HTTPException(status_code=400, detail="Expense has participants who are not members of the group, this can not be allowed")

        for split in expense_splits:
            if split.user_id not in split_map.keys():
                db.delete(split)
                db.commit()

        for user_id, amount in split_map.items():
            user = db.query(User).filter(User.id == user_id).first()

            if user_id in [es.user_id for es in expense_splits]:
                expense_split = db.query(ExpenseSplit).filter(
                    ExpenseSplit.expense_id == expense_id,
                    ExpenseSplit.user_id == user_id
                ).first()
                expense_split.amount = amount

            else:
                db.add(
                    ExpenseSplit(
                    expense_id=expense_id,
                    user_id=user_id,
                    user_name=user.name,
                    amount=amount
                    )
                )

                db.commit()

            is_friend = db.query(Friendship).filter(
                or_(
                    and_(
                        Friendship.user_id_1 == current_user.id,
                        Friendship.user_id_2 == user_id
                    ),
                    and_(
                        Friendship.user_id_1 == user_id,
                        Friendship.user_id_2 == current_user.id
                    )
                )
            ).first()
                        
            #if a financial relationship exist then add user as a friend
            if not is_friend and user_id != current_user.id:
                send_invitation(
                    current_user=current_user,
                    user=user,
                    db=db
                )

        expense.title = data.title
        expense.amount = data.amount
        expense.group_id = new_group
        expense.paid_by = data.paid_by
        expense.split_type = data.split_type

        db.commit() 

    return {"message": "Expense updated successfully", "expense": expense}

        

@router.delete('/delete/{expense_id}')
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
):

    expense = db.query(Expense).filter(Expense.id == expense_id).first()

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    is_batch = db.query(SettlementBatchExpense).filter(SettlementBatchExpense.expense_id == expense_id).first()

    if is_batch:
        batchId = is_batch.batch_id
        all_batch_expenses = (
            db.query(Expense)
            .join(SettlementBatchExpense, 
                  SettlementBatchExpense.expense_id == Expense.id
                )
            .filter(
                SettlementBatchExpense.batch_id == batchId
            ).all()
        )
           
        batch_settlement = (
            db.query(Settlement)
            .join(SettlementBatchSettlement, 
                  SettlementBatchSettlement.settlement_id == Settlement.id
                )
            .filter(
                SettlementBatchSettlement.batch_id == batchId
            ).first()
        )

        for batch_expense in all_batch_expenses:
            splits = db.query(ExpenseSplit).filter(ExpenseSplit.expense_id == batch_expense.id).all()
            for split in splits:
                db.delete(split)

            db.delete(batch_expense)

        db.delete(batch_settlement)
        db.commit()
        
        batch = db.query(SettlementBatch).filter(SettlementBatch.id == batchId).first()
        db.delete(batch)
        db.commit()

    else:
       splits = db.query(ExpenseSplit).filter(ExpenseSplit.expense_id == expense_id).all()
       for split in splits:
           db.delete(split)

       db.delete(expense)
       db.commit()

    return {"message": "Expense deleted successfully"}


            
                 


    


    
    
    
    
    
    
        
   
    