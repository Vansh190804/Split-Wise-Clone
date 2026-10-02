from sqlalchemy.orm import aliased
from models.users import User
from models.group_members import GroupMember
from models.group import Group
from models.expenses import Expense
from helper_functions.calculate_balances import calculate_balances
from sqlalchemy.orm import Session



def calculate_group_transactions(
    current_user: User,
    friend_id: int,
    db : Session
):
    friend_transactions = []

    mygroup = aliased(GroupMember)
    friendgroup = aliased(GroupMember)

    groups_shared = (
        db.query(mygroup)
        .join(
            friendgroup,
            mygroup.group_id == friendgroup.group_id
        )
        .filter(
            mygroup.user_id == current_user.id,
            friendgroup.user_id == friend_id
        )
        .all()
    )

    groups = db.query(Group).filter(
        Group.id.in_([g.group_id for g in groups_shared])
    ).all()

    for g in groups:

        group_expenses = (
            db.query(Expense)
            .filter(Expense.group_id == g.id)
            .all()
        )

        transactions, balances, current_user_balances = calculate_balances(
            expenses=group_expenses,
            group_id=g.id,
            friend_id=None,
            current_user=current_user,
            db=db
        )

        for t in transactions:

            if (
                t["from_userid"] == current_user.id
                and t["to_userid"] == friend_id
            ):
                friend_transactions.append({
                    "group_id": g.id,
                    "from_userid": current_user.id,
                    "to_userid": friend_id,
                    "amount": t["amount"]
                })

            elif (
                t["from_userid"] == friend_id
                and t["to_userid"] == current_user.id
            ):
                friend_transactions.append({
                    "group_id": g.id,
                    "from_userid": friend_id,
                    "to_userid": current_user.id,
                    "amount": t["amount"]
                })

    return friend_transactions