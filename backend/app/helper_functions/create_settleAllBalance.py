from sqlalchemy.orm import Session
from models.users import User
from models.settlementBatchExpense import SettlementBatchExpense
from models.expenses import Expense
from models.expense_split import ExpenseSplit


def create_settle_all_balance(
    group_transactions: list,
    db: Session,
    batchId: int
):
    created_expense = []

    for transaction in group_transactions:

        if transaction["from_userid"] == transaction["to_userid"]:
            continue

        expense = Expense(
            title = "Settle All Balance",
            group_id = transaction["group_id"],
            paid_by = transaction["from_userid"],
            amount = transaction["amount"],
            split_type = "custom"
        )

        db.add(expense)
        db.flush()

        db.add(
            SettlementBatchExpense(
                batch_id = batchId,
                expense_id = expense.id
            )
        )

        db.add_all([
            ExpenseSplit(
                expense_id = expense.id,
                user_id = transaction["from_userid"],
                user_name = db.query(User.name).filter(User.id == transaction["from_userid"]).scalar(),
                amount = 0
            ),

            ExpenseSplit(
                expense_id = expense.id,
                user_id = transaction["to_userid"],
                user_name = db.query(User.name).filter(User.id == transaction["to_userid"]).scalar(),
                amount = transaction["amount"]
            )
        ])

        db.commit()

        created_expense.append(expense)

    return created_expense