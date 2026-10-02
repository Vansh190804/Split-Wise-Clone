from sqlalchemy.orm import Session, aliased
from models.expense_split import ExpenseSplit
from models.expenses import Expense
from models.users import User
from helper_functions.calculate_balances import calculate_balances
from helper_functions.calculate_group_transactions import calculate_group_transactions



def calculate_friend_balance(
    current_user: User, 
    friend_id: int, 
    db: Session
):
    total_balances = {}
    nonGroupExpenses = []

    me = aliased(ExpenseSplit)
    friend = aliased(ExpenseSplit)
    
    non_group_expenses = (
        db.query(Expense, me, friend).
        join(me, 
             Expense.id == me.expense_id).
        join(friend,
             Expense.id == friend.expense_id).
        filter(
             me.user_id == current_user.id,
             friend.user_id == friend_id,
             Expense.group_id == None
        ).all()
    )

    for expense, es, fs in non_group_expenses:
         nonGroupExpenses.append(expense)

    
    transactions, balances, current_user_balances = calculate_balances(
         expenses= nonGroupExpenses,
         group_id = None,
         friend_id = friend_id,
         current_user = current_user,
         db = db
    )

    for user_id, amount in balances.items():
        total_balances[user_id] = ( total_balances.get(user_id, 0) + amount )


    group_transactions = calculate_group_transactions(
        current_user=current_user,
        friend_id=friend_id,
        db=db
    )
    
    for t in group_transactions:
        if(t["from_userid"] == current_user.id and t["to_userid"] == friend_id):
            total_balances[current_user.id] = ( total_balances.get(current_user.id, 0) - t["amount"])
            total_balances[friend_id] = ( total_balances.get(friend_id, 0) + t["amount"])

        elif(t["from_userid"] == friend_id and t["to_userid"] == current_user.id):
            total_balances[current_user.id] = ( total_balances.get(current_user.id, 0) + t["amount"])
            total_balances[friend_id] = ( total_balances.get(friend_id, 0) - t["amount"]) 

    return total_balances