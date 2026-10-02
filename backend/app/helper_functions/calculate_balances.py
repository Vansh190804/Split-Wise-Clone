from models.expense_split import ExpenseSplit
from models.settlements import Settlement
from sqlalchemy.orm import Session
from helper_functions.settle_balances import settle_balances
from sqlalchemy import and_ , or_


def calculate_balances(expenses, group_id, friend_id, current_user, db : Session):
    balances = {}
    settlements = []

    if group_id is not None:
        for expense in expenses:
           splits = db.query(ExpenseSplit).filter(
              ExpenseSplit.expense_id == expense.id,
           ).all()

           for split in splits:
            
              balances.setdefault(split.user_id, 0)

              balances[split.user_id] -= split.amount

              balances.setdefault(expense.paid_by, 0)

              balances[expense.paid_by] += split.amount

        settlements = db.query(Settlement).filter(Settlement.group_id == group_id).all()

    elif friend_id is not None:

        balances.setdefault(current_user.id, 0)
        balances.setdefault(friend_id, 0)

        for expense in expenses:

            splits = db.query(ExpenseSplit).filter(
                ExpenseSplit.expense_id == expense.id
            ).all()

            if expense.paid_by == current_user.id:

                friend_split = next(
                    (
                        split for split in splits
                        if split.user_id == friend_id
                    ),
                    None
                )

                if friend_split:
                    balances[current_user.id] += friend_split.amount
                    balances[friend_id] -= friend_split.amount

            elif expense.paid_by == friend_id:

                my_split = next(
                    (
                        split for split in splits
                        if split.user_id == current_user.id
                    ),
                    None
                )

                if my_split:
                    balances[current_user.id] -= my_split.amount
                    balances[friend_id] += my_split.amount

            else:
                continue


        settlements = db.query(Settlement).filter(
            Settlement.group_id == None,
            or_(
             and_(
               Settlement.paid_by == current_user.id,
               Settlement.paid_to == friend_id
            ),
            and_(
               Settlement.paid_by == friend_id,
               Settlement.paid_to == current_user.id
            )
          )
        ).all()
    
    for settlement in settlements:
         
         payer = settlement.paid_by
         receiver = settlement.paid_to
         amount = settlement.amount
       
         balances.setdefault(payer, 0)
         balances.setdefault(receiver, 0)

         balances[payer] += amount
         balances[receiver] -= amount 

    balance_map = balances

    transactions = settle_balances(balance_map, db)

    current_user_balances = balances.get(current_user.id, 0)

    return transactions, balances, current_user_balances