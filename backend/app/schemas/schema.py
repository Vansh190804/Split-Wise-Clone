from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLeave(BaseModel):
    group_id: int
    balance: float
    userToDelete: int | None = None

class Login(BaseModel):
    email: str
    password: str

class GroupCreate(BaseModel):
    name: str
    members: list[dict] | None = None

class ExpenseCreate(BaseModel):
    title: str
    split_between: list[int]
    splits: list[float] | None
    amount: float
    major_group_id: int | None = None
    split_type: str = "equal"
    paid_by: int
    
class SettleMentCreate(BaseModel):
    group_id: int | None = None
    paid_by: int
    paid_to: int
    amount: float

class EmailRequest(BaseModel):
    email: str

class SearchRequest(BaseModel):
    query: str
    selectedMembers: list[dict] | None = None

class SearchFriend(BaseModel):
    query: str
    group_id: int | None = None

class GroupsInvolved(BaseModel):
    groups: list[dict] | None = None

class InviteMember(BaseModel):
    name: str
    email: str




