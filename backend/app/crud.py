import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models, schemas
from .auth import hash_password, verify_password


def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.scalar(select(models.User).where(models.User.email == normalize_email(email)))


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    if get_user_by_email(db, user.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")

    db_user = models.User(
        email=normalize_email(user.email),
        hashed_password=hash_password(user.password),
        first_name=user.first_name.strip(),
        last_name=user.last_name.strip(),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> models.User | None:
    user = get_user_by_email(db, email)
    if user is None or not verify_password(password, user.hashed_password):
        return None
    return user


def update_profile(db: Session, user: models.User, profile: schemas.UserProfileUpdate) -> models.User:
    for field, value in profile.model_dump().items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


# --- Spendings, goals, wishlist ---
# Every row belongs to one user: lists are filtered by user_id, and get_owned()
# answers 404 (not 403) for someone else's row, so ids of other users stay hidden.


def get_owned(db: Session, model, item_id: uuid.UUID, user: models.User):
    item = db.get(model, item_id)
    if item is None or item.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
    return item


def create_owned(db: Session, model, user: models.User, **fields):
    item = model(user_id=user.id, **fields)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_owned(db: Session, model, item_id: uuid.UUID, user: models.User) -> None:
    db.delete(get_owned(db, model, item_id, user))
    db.commit()


def list_transactions(db: Session, user: models.User) -> list[models.Transaction]:
    query = select(models.Transaction).where(models.Transaction.user_id == user.id)
    return list(db.scalars(query.order_by(models.Transaction.date.desc())))


def list_goals(db: Session, user: models.User) -> list[models.Goal]:
    return list(db.scalars(select(models.Goal).where(models.Goal.user_id == user.id)))


def create_goal(db: Session, user: models.User, goal: schemas.GoalCreate) -> models.Goal:
    fields = goal.model_dump()
    fields["saved"] = min(goal.saved, goal.target)
    return create_owned(db, models.Goal, user, **fields)


def contribute_to_goal(db: Session, goal_id: uuid.UUID, user: models.User, amount: float) -> models.Goal:
    """Adds (or withdraws, if negative) money, keeping saved between 0 and target."""
    goal = get_owned(db, models.Goal, goal_id, user)
    goal.saved = min(goal.target, max(Decimal(0), goal.saved + Decimal(str(amount))))
    db.commit()
    db.refresh(goal)
    return goal


def list_wishlist(db: Session, user: models.User) -> list[models.WishItem]:
    return list(db.scalars(select(models.WishItem).where(models.WishItem.user_id == user.id)))


def set_bought(db: Session, item_id: uuid.UUID, user: models.User, bought: bool) -> models.WishItem:
    item = get_owned(db, models.WishItem, item_id, user)
    item.bought = bought
    db.commit()
    db.refresh(item)
    return item
