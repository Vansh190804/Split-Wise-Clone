from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from operator import or_, and_

from models.friendship import Friendship
from core.db import get_db
from auth.dependencies import get_current_user
from models.users import User
from models.group import Group
from models.group_members import GroupMember
from models.settlements import Settlement
from models.expenses import Expense
from models.expense_split import ExpenseSplit
from models.settlementBatch import SettlementBatch
from models.settlementBatchExpense import SettlementBatchExpense
from models.settlementBatchSettlement import SettlementBatchSettlement
from schemas.schema import SettleMentCreate
from helper_functions.calculate_friend_balance import calculate_friend_balance
from helper_functions.calculate_group_transactions import calculate_group_transactions
from helper_functions.create_settleAllBalance import create_settle_all_balance
from helper_functions.calculate_balances import calculate_balances
from helper_functions.send_invitation import send_invitation
from helper_functions.update_checkpoint import update_settlement_checkpoint
from helper_functions.update_checkpoint import update_group_checkpoint

router = APIRouter(prefix="/settlements", tags=["settlements"])


@router.post("/settle")
def settle_payment(
    data: SettleMentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group_id = data.group_id
    settlement_created = None

    if group_id != None:
        group_members = (
            db.query(GroupMember).filter(GroupMember.group_id == group_id).all()
        )
        user_ids = [member.user_id for member in group_members]

        if data.paid_by not in user_ids or data.paid_to not in user_ids:
            raise HTTPException(
                status_code=400, detail="Recorded members should be part of the group"
            )

        settlement = Settlement(
            group_id=group_id,
            paid_by=data.paid_by,
            paid_to=data.paid_to,
            amount=data.amount,
        )

        db.add(settlement)
        db.commit()
        db.refresh(settlement)

        expenses = db.query(Expense).filter(Expense.group_id == group_id).all()
            
        _,balances,_ =  calculate_balances(expenses, group_id, None, current_user, db)

        is_group_balanced = all(balance == 0 for balance in balances.values())

        if is_group_balanced:
            update_group_checkpoint(
                group_id=group_id,
                db=db
            )

        settlement_created = settlement

    else:
        paid_by = db.query(User).filter(User.id == data.paid_by).first()
        total_balances = calculate_friend_balance(
            current_user=paid_by, friend_id=data.paid_to, db=db
        )

        print("Total Balances:", total_balances)

        total_balances[data.paid_by] = total_balances.get(data.paid_by, 0) + data.amount
        total_balances[data.paid_to] = total_balances.get(data.paid_to, 0) - data.amount

        settlement = Settlement(
            group_id=None,
            paid_by=data.paid_by,
            paid_to=data.paid_to,
            amount=data.amount,
        )

        db.add(settlement)
        db.commit()

        if total_balances[data.paid_by] == 0 and total_balances[data.paid_to] == 0:
            update_settlement_checkpoint(
                user1_id = data.paid_by,
                user2_id = data.paid_to,
                db = db
            )
            
            group_transactions = calculate_group_transactions(
                current_user=paid_by, friend_id=data.paid_to, db=db
            )

            batch = SettlementBatch()
            db.add(batch)
            db.commit()

            db.add(
                SettlementBatchSettlement(
                    batch_id=batch.id,
                    settlement_id=settlement.id
                )
            )

            create_settle_all_balance(
                group_transactions=group_transactions, 
                db=db,
                batchId = batch.id
            )

            new_balances = calculate_friend_balance(
                current_user=paid_by, friend_id=data.paid_to, db=db
            )

            amount = abs(new_balances[data.paid_by])

            if new_balances[data.paid_by] < 0:
                paid_by = data.paid_by
                paid_to = data.paid_to

            elif new_balances[data.paid_by] > 0:
                paid_by = data.paid_to
                paid_to = data.paid_by

            if new_balances[data.paid_by] != 0 and new_balances[data.paid_to] != 0:
                expense = Expense(
                    title="Settle All Balance",
                    group_id=None,
                    paid_by=paid_by,
                    amount=amount,
                    split_type="custom",
                )

                db.add(expense)
                db.flush()

                db.add(
                    SettlementBatchExpense(
                        batch_id=batch.id,
                        expense_id=expense.id
                    )
                )

                db.add_all(
                    [
                        ExpenseSplit(
                            expense_id=expense.id,
                            user_id=paid_by,
                            user_name=db.query(User.name)
                            .filter(User.id == paid_by)
                            .scalar(),
                            amount=0,
                        ),
                        ExpenseSplit(
                            expense_id=expense.id,
                            user_id=paid_to,
                            user_name=db.query(User.name)
                            .filter(User.id == paid_to)
                            .scalar(),
                            amount=amount,
                        ),
                    ]
                )

        settlement_created = settlement

    if settlement_created != None:
        if data.paid_by == current_user.id:
            is_friend = (
                db.query(Friendship)
                .filter(
                    or_(
                        and_(
                            Friendship.user_id_1 == current_user.id,
                            Friendship.user_id_2 == data.paid_to,
                        ),
                        and_(
                            Friendship.user_id_1 == data.paid_to,
                            Friendship.user_id_2 == current_user.id,
                        ),
                    )
                )
                .first()
            )

            if not is_friend and data.paid_to != current_user.id:
              user = db.query(User).filter(User.id == data.paid_to).first()
              send_invitation(current_user=current_user, user=user, db=db)

        elif data.paid_to == current_user.id:
            is_friend = (
              db.query(Friendship)
              .filter(
                or_(
                    and_(
                        Friendship.user_id_1 == current_user.id,
                        Friendship.user_id_2 == data.paid_by,
                    ),
                    and_(
                        Friendship.user_id_1 == data.paid_by,
                        Friendship.user_id_2 == current_user.id,
                    ),
                )
               ).first()
            )

            if not is_friend and data.paid_by != current_user.id:
               user = db.query(User).filter(User.id == data.paid_by).first()
               send_invitation(current_user=current_user, user=user, db=db)

    db.commit()
    return settlement_created


@router.get("/lists/group/{group_id}")
def get_group_settlements(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    response = []

    settlements = db.query(Settlement).filter(Settlement.group_id == group_id).all()

    for s in settlements:
        response.append(
            {
                "id": s.id,
                "group_id": s.group_id,
                "paid_by": s.paid_by,
                "paid_to": s.paid_to,
                "paid_by_name": db.query(User)
                .filter(User.id == s.paid_by)
                .first()
                .name,
                "paid_to_name": db.query(User)
                .filter(User.id == s.paid_to)
                .first()
                .name,
                "amount": s.amount,
                "created_at": s.created_at,
            }
        )

    return response


@router.get("/lists/friend/{friend_id}")
def get_friend_settlements(
    friend_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response = []

    settlements = (
        db.query(Settlement)
        .filter(
            Settlement.group_id == None,
            or_(
                and_(
                    Settlement.paid_by == current_user.id,
                    Settlement.paid_to == friend_id,
                ),
                and_(
                    Settlement.paid_by == friend_id,
                    Settlement.paid_to == current_user.id,
                ),
            ),
        )
        .all()
    )

    for s in settlements:
        response.append(
            {
                "id": s.id,
                "group_id": None,
                "paid_to": s.paid_to,
                "paid_by": s.paid_by,
                "paid_to_name": db.query(User)
                .filter(User.id == s.paid_to)
                .first()
                .name,
                "paid_by_name": db.query(User)
                .filter(User.id == s.paid_by)
                .first()
                .name,
                "amount": s.amount,
                "created_at": s.created_at,
            }
        )

    return response


@router.get("/allSettlements")
def get_all_settlements(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    groups = (
        db.query(Group)
        .join(GroupMember, Group.id == GroupMember.group_id)
        .filter(GroupMember.user_id == current_user.id)
        .all()
    )

    all_settlements = []

    for g in groups:
        settlements = db.query(Settlement).filter(Settlement.group_id == g.id).all()
        for s in settlements:
            all_settlements.append(
                {
                    "id": s.id,
                    "group_id": s.group_id,
                    "paid_by": s.paid_by,
                    "paid_to": s.paid_to,
                    "paid_by_name": db.query(User)
                    .filter(User.id == s.paid_by)
                    .first()
                    .name,
                    "paid_to_name": db.query(User)
                    .filter(User.id == s.paid_to)
                    .first()
                    .name,
                    "amount": s.amount,
                    "group_name": g.name,
                    "created_at": s.created_at,
                }
            )

    friend_settlements = (
        db.query(Settlement)
        .filter(
            Settlement.group_id == None,
            or_(
                Settlement.paid_by == current_user.id,
                Settlement.paid_to == current_user.id,
            ),
        )
        .all()
    )

    for s in friend_settlements:
        all_settlements.append(
            {
                "id": s.id,
                "group_id": None,
                "paid_to": s.paid_to,
                "paid_by": s.paid_by,
                "paid_to_name": db.query(User)
                .filter(User.id == s.paid_to)
                .first()
                .name,
                "paid_by_name": db.query(User)
                .filter(User.id == s.paid_by)
                .first()
                .name,
                "amount": s.amount,
                "group_name": None,
                "created_at": s.created_at,
            }
        )

    return all_settlements


@router.put("/update/{settlement_id}")
def update_settlement(
    settlement_id: int,
    data: SettleMentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    settlement_updated = None

    settlement = db.query(Settlement).filter(Settlement.id == settlement_id).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")

    if data.group_id != None:
        group_members = (
            db.query(GroupMember).filter(GroupMember.group_id == data.group_id).all()
        )
        user_ids = [member.user_id for member in group_members]

        if data.paid_by not in user_ids or data.paid_to not in user_ids:
            raise HTTPException(
                status_code=400, detail="Recorded members should be part of the group"
            )

        settlement.group_id = data.group_id
        settlement.paid_by = data.paid_by
        settlement.paid_to = data.paid_to
        settlement.amount = data.amount

        db.commit()

        expenses = db.query(Expense).filter(Expense.group_id == data.group_id).all()
                    
        _,balances,_ =  calculate_balances(expenses, data.group_id, None, current_user, db)
        
        is_group_balanced = all(balance == 0 for balance in balances.values())
        
        if is_group_balanced:
            update_group_checkpoint(
                group_id=data.group_id,
                db=db
            )

        settlement_updated = settlement

    else:
        settlement.group_id = None
        settlement.paid_by = data.paid_by
        settlement.paid_to = data.paid_to
        settlement.amount = data.amount

        db.commit()

        paid_by = db.query(User).filter(User.id == data.paid_by).first()
        total_balances = calculate_friend_balance(
            current_user=paid_by, friend_id=data.paid_to, db=db
        )

        if total_balances[data.paid_by] == 0 and total_balances[data.paid_to] == 0:
            checkpoint = update_settlement_checkpoint(
                user1_id = data.paid_by,
                user2_id = data.paid_to,
                db = db
            )

            group_transactions = calculate_group_transactions(
                current_user=paid_by, friend_id=data.paid_to, db=db
            )

            batch = SettlementBatch()
            db.add(batch)
            db.flush()

            db.add(
                SettlementBatchSettlement(
                    batch_id=batch.id,
                    settlement_id=settlement.id
                )
            )

            create_settle_all_balance(
                group_transactions=group_transactions, 
                db=db,
                batchId = batch.id
            )

            new_balances = calculate_friend_balance(
                current_user=paid_by, friend_id=data.paid_to, db=db
            )

            amount = abs(new_balances[data.paid_by])

            if new_balances[data.paid_by] < 0:
                paid_by = data.paid_by
                paid_to = data.paid_to

            elif new_balances[data.paid_by] > 0:
                paid_by = data.paid_to
                paid_to = data.paid_by

            if new_balances[data.paid_by] != 0 and new_balances[data.paid_to] != 0:
                expense = Expense(
                    title="Settle All Balance",
                    group_id=None,
                    paid_by=paid_by,
                    amount=amount,
                    split_type="custom",
                )

                db.add(expense)
                db.flush()

                db.add(
                    SettlementBatchExpense(
                        batch_id=batch.id,
                        expense_id=expense.id
                    )
                )

                db.add_all(
                    [
                        ExpenseSplit(
                            expense_id=expense.id,
                            user_id=paid_by,
                            user_name=db.query(User.name)
                            .filter(User.id == paid_by)
                            .scalar(),
                            amount=0,
                        ),
                        ExpenseSplit(
                            expense_id=expense.id,
                            user_id=paid_to,
                            user_name=db.query(User.name)
                            .filter(User.id == paid_to)
                            .scalar(),
                            amount=amount,
                        ),
                    ]
                )

                db.commit()
    
        settlement_updated = settlement

    if settlement_updated != None:
        if data.paid_by == current_user.id:
            is_friend = (
                db.query(Friendship)
                    .filter(
                        or_(
                            and_(
                                Friendship.user_id_1 == current_user.id,
                                Friendship.user_id_2 == data.paid_to,
                            ),
                            and_(
                                Friendship.user_id_1 == data.paid_to,
                                Friendship.user_id_2 == current_user.id,
                            ),
                        )
                    ).first())
        
            if not is_friend and data.paid_to != current_user.id:
                user = db.query(User).filter(User.id == data.paid_to).first()
                send_invitation(current_user=current_user, user=user, db=db)
        
        elif data.paid_to == current_user.id:
            is_friend = (
                db.query(Friendship)
                .filter(
                    or_(
                        and_(
                            Friendship.user_id_1 == current_user.id,
                            Friendship.user_id_2 == data.paid_by,
                        ),
                        and_(
                            Friendship.user_id_1 == data.paid_by,
                            Friendship.user_id_2 == current_user.id,
                        ),
                    )
                ).first())
        
            if not is_friend and data.paid_by != current_user.id:
                user = db.query(User).filter(User.id == data.paid_by).first()
                send_invitation(current_user=current_user, user=user, db=db)

    return settlement_updated


@router.delete("/delete/{settlement_id}")
def delete_settlement(
    settlement_id: int,
    db: Session = Depends(get_db),
):
    settlement = db.query(Settlement).filter(Settlement.id == settlement_id).first()

    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")

    is_batch = db.query(SettlementBatchSettlement).filter(SettlementBatchSettlement.settlement_id == settlement_id).first()
    
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
               
        for batch_expense in all_batch_expenses:
            splits = db.query(ExpenseSplit).filter(ExpenseSplit.expense_id == batch_expense.id).all()
            for split in splits:
                db.delete(split)
            db.delete(batch_expense)
    
        db.delete(settlement)
        db.commit()
            
        batch = db.query(SettlementBatch).filter(SettlementBatch.id == batchId).first()
        db.delete(batch)
        db.commit()

    else:
        db.delete(settlement)
        db.commit()

    return {"detail": "Settlement deleted successfully"}
