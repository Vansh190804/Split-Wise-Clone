from models.users import User
from sqlalchemy.orm import Session
from datetime import datetime

def settle_balances(balance_map, db: Session):
    
    transactions = []

    i=0
    j=0

    debtors = []
    creditors = []

    for user_id, amount in balance_map.items():
        if amount < 0:
            debtors.append([user_id, -amount])
        elif amount > 0:
            creditors.append([user_id, amount])

    while i < len(debtors) and j < len(creditors):

        debtor_id, debt = debtors[i]
        creditor_id, credit = creditors[j]

        payment = min(debt, credit)

        fromUser = db.query(User.name).filter(User.id == debtor_id).first()
        ToUser = db.query(User.name).filter(User.id == creditor_id).first()
        
        transactions.append({
            "from_userid": debtor_id,
            "to_userid": creditor_id,
            "from": fromUser.name if fromUser else "Unknown",
            "to": ToUser.name if ToUser else "Unknown",
            "amount": payment,
            "created_at": datetime.utcnow()
        })

        debtors[i][1] -= payment
        creditors[j][1] -= payment

        if debtors[i][1] == 0: i += 1
        if creditors[j][1] == 0: j += 1
    
    return transactions


