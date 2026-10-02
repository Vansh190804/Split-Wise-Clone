from fastapi import HTTPException
import resend
from sqlalchemy.orm import Session
from models.friendship import Friendship
from models.users import User
from models.pendingFriendInvitation import PendingFriendInvitation
from emails.template import render_html_existingUser
import uuid
import os



def send_invitation(
    current_user: User,
    user: User,
    db: Session
):
    db.add(
        Friendship(
            user_id_1 = current_user.id,
            user_id_2 = user.id,
            status = "pending"
        )
    )

    db.commit()
    
    #send invitation via email
    subject = "Splitwise Invitation from " + current_user.name
    token = str(uuid.uuid4())
                    
    htmlForExisting = render_html_existingUser(
        sender_name = current_user.name,
        invite_link = f"http://localhost:5173/friend-invite/{token}"
    )
                    
    try:
        result = resend.Emails.send({
                    "from": os.environ.get("EMAIL_FROM", "Splitwise <onboarding@resend.dev>"),
                    "to": [user.email],
                    "subject": subject,
                    "html": htmlForExisting
                })
                    
        pending_invitation = PendingFriendInvitation(
                sender_id = current_user.id,
                receiver_email =  user.email,
                invite_token = token,
                status = "pending"
            ) 
                    
        db.add(pending_invitation)
        db.commit()
    
    except Exception as e:
        print("Error sending email:", str(e))
        raise HTTPException(status_code=500, detail="Failed to send email")
    