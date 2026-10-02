from fastapi import FastAPI
from core.db import engine, Base
from routes import health, auth, group_route, expense_route, settlement_route, invite_route, friends_route, search
from models import users, group, group_members, expenses, expense_split, friendship
from core.config import SECRET_KEY
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(group_route.router)
app.include_router(expense_route.router)
app.include_router(settlement_route.router)
app.include_router(invite_route.router)
app.include_router(friends_route.router)
app.include_router(search.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key = SECRET_KEY
)


@app.get('/')
def root():
    return {"message": "Splitwise API"}




