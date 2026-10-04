import uuid
from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """JSON uses camelCase (firstName) like the Angular front; Python uses snake_case (first_name)."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class UserCreate(CamelModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(CamelModel):
    email: EmailStr
    password: str


MaritalStatus = Literal["single", "married", "divorced", "widowed"]


class UserProfileUpdate(CamelModel):
    profession: str | None = Field(default=None, max_length=100)
    marital_status: MaritalStatus | None = None
    kids: int | None = Field(default=None, ge=0, le=20)
    birthday: date | None = None
    salary: float | None = Field(default=None, ge=0)


class UserResponse(UserProfileUpdate):
    id: uuid.UUID
    first_name: str
    last_name: str
    email: EmailStr


class AuthResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Spendings ---

Category = Literal["housing", "food", "transport", "shopping", "health", "leisure", "bills", "salary", "other"]
TransactionType = Literal["expense", "income"]


class TransactionCreate(CamelModel):
    label: str = Field(min_length=1, max_length=100)
    category: Category
    type: TransactionType
    amount: float = Field(gt=0)
    date: date


class TransactionResponse(TransactionCreate):
    id: uuid.UUID


# --- Savings goals ---


class GoalCreate(CamelModel):
    name: str = Field(min_length=1, max_length=100)
    target: float = Field(gt=0)
    saved: float = Field(default=0, ge=0)
    deadline: date | None = None


class GoalResponse(GoalCreate):
    id: uuid.UUID


class GoalContribution(CamelModel):
    # Positive to add money, negative to withdraw.
    amount: float


# --- Wishlist ---

Priority = Literal["high", "medium", "low"]


class WishItemCreate(CamelModel):
    name: str = Field(min_length=1, max_length=100)
    price: float = Field(gt=0)
    priority: Priority = "medium"


class WishItemUpdate(CamelModel):
    bought: bool


class WishItemResponse(WishItemCreate):
    id: uuid.UUID
    bought: bool
