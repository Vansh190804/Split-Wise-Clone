from fastapi import APIRouter, File, Form, Request, Depends, UploadFile
from sqlalchemy.orm import Session
from starlette.responses import RedirectResponse

from core.db import get_db
from auth.jwt import create_access_token
from auth.dependencies import get_current_user
from auth.oauth import oauth
from models.users import User
from models.authAccount import AuthAccount
import bcrypt

from schemas.schema import UserCreate, Login
from services.storage import supabase

router = APIRouter(prefix='/auth', tags=['auth'])

@router.get('/google/login')
async def google_login(
    request: Request, 
    group_invite: str | None = None,
    friend_invite: str | None = None
):
    request.session["group_invite"] = group_invite
    request.session["friend_invite"] = friend_invite

    redirect_uri = request.url_for("google_callback")

    return await oauth.google.authorize_redirect(
        request,
        redirect_uri,
    )


#google callback
@router.get("/google/callback")
async def google_callback(
    request: Request,
    db: Session = Depends(get_db)
):
     token = await oauth.google.authorize_access_token(request)
     
     groupInvite = request.session.get("group_invite")
     friendInvite = request.session.get("friend_invite")
     
     user_info = token["userinfo"]

     email = user_info["email"]
     name = user_info["name"]
     google_id = user_info["sub"]
     picture = user_info["picture"]

     account = db.query(AuthAccount).filter(
          AuthAccount.provider == "google",
          AuthAccount.provider_user_id == google_id
     ).first()
     
     if account:
        user = db.query(User).filter(User.id == account.user_id).first()

     else:
        user = db.query(User).filter(User.email == email).first()

        if not user: 
           user = User(
               email = email,
               name = name,
               registered = True,
               avatar_url = picture
           )

           db.add(user)
           db.flush()

        else:
            if not user.registered:
               user.registered = True
               user.name =  name

        account = AuthAccount(
            user_id = user.id,
            provider = "google",
            provider_user_id = google_id
        )

        db.add(account)
        db.commit()
        db.refresh(user)

     jwt_token = create_access_token({"sub": str(user.id)})

     url=f"http://localhost:5173/OAuthCompletion?token={jwt_token}"

     if groupInvite:
          url += f"&group_invite={groupInvite}"
     if friendInvite:
          url += f"&friend_invite={friendInvite}"

     print(url)

     return RedirectResponse(url=url)



#register
@router.post('/register')
def register(user: UserCreate, db: Session = Depends(get_db),):
     
     existing_user = db.query(User).filter(User.email == user.email).first()
     hashed_pw = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()

     if existing_user and existing_user.registered: 
          return {"error": "Email already registered"}  

     if existing_user and not existing_user.registered:
          existing_user.name = user.name
          existing_user.registered = True
          db.commit()

          account =AuthAccount(
               user_id = existing_user.id,
               provider = "password",
               password = hashed_pw,
          )

          db.add(account)
          db.commit()

          return {"message": "User registered successfully", "user_id": existing_user.id}
     
     created_user = User(email = user.email, name = user.name, registered = True, avatar_url = None)

     db.add(created_user)
     db.commit()
     db.refresh(created_user)


     account =AuthAccount(
        user_id = created_user.id,
        provider = "password",
        password = hashed_pw
     )

     db.add(account)
     db.commit()

     token = create_access_token({"sub": str(created_user.id)})

     return {"access_token": token, "token_type": "bearer"}



#login
@router.post('/login')
def login(user: Login, db: Session = Depends(get_db)):
     
     existing_user = db.query(User).filter(User.email == user.email).first()
     
     if not existing_user:
        return {"error": "Email not registered"}

     if existing_user and existing_user.registered == False:
        return {"error": "Email not registered. Please register first."}
     
     account_provider = db.query(AuthAccount.provider).filter(
          existing_user.id == AuthAccount.user_id
     ).first()
     
     account = db.query(AuthAccount).filter(
          existing_user.id == AuthAccount.user_id,
          AuthAccount.provider == "password"
     ).first()

     if not account:
          return {"error": f"Use {account_provider} OAuth to login"}
     
     if not bcrypt.checkpw(user.password.encode(), account.password.encode()):
          return {"error": "Incorrect password"}
     
     token = create_access_token({"sub": str(existing_user.id)})

     return {"access_token": token, "token_type": "bearer"}


@router.get('/me')
def get_current_user(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.get('/get_user/{userId}')
def get_user(userId: int, db: Session = Depends(get_db)):
    
    user = db.query(User).filter(User.id == userId).first()

    return user


@router.put('/update')
def update_profile(
    name: str = Form(...),
    email: str = Form(...),
    avatar: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
     current_user.name = name
     current_user.email = email

     if avatar:
          file_data = avatar.file.read()
          path = f"profiles/{current_user.id}/avatar"

          supabase.storage.from_("Images").upload(
             path,
             file_data,
             {
               "content-type": avatar.content_type,
               "upsert": "true"
              }
          )

          avatar_url = supabase.storage.from_("Images").get_public_url(path)
          current_user.avatar_url = avatar_url

     if avatar is None and current_user.avatar_url:
          path = f"profiles/{current_user.id}/avatar"
          supabase.storage.from_("Images").remove([path])
          current_user.avatar_url = None

     db.commit()
     db.refresh(current_user)
     
     return {"message": "Profile updated successfully", "user": current_user}

     
     


    