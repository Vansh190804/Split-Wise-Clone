from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from core.config import SECRET_KEY, ALGORITHM
from core.db import get_db
from models.users import User

security = HTTPBearer()

def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
):
    print(credentials.credentials)
    
    token = credentials.credentials

    print("Token received in get_current_user:", token) 

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms = [ALGORITHM])

        user_id = payload.get("sub")
        print("Decoded user_id from token:", user_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id ==  int(user_id)).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user
      



    