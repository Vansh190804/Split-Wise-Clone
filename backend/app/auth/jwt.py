from jose import jwt
from core.config import SECRET_KEY, ALGORITHM

def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm = ALGORITHM)