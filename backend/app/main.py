import uuid
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .auth import create_access_token, get_current_user
from .config import settings
from .database import Base, engine, get_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Creates missing tables on startup. Fine for now; switch to Alembic once the schema evolves.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Savvily API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Savvily API is running"}


@app.post("/auth/signup", response_model=schemas.AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.create_user(db, user)
    return {"access_token": create_access_token(db_user.id), "user": db_user}


@app.post("/auth/login", response_model=schemas.AuthResponse)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    db_user = crud.authenticate_user(db, credentials.email, credentials.password)
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    return {"access_token": create_access_token(db_user.id), "user": db_user}


@app.get("/users/me", response_model=schemas.UserResponse)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@app.put("/users/me", response_model=schemas.UserResponse)
def update_me(
    profile: schemas.UserProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.update_profile(db, current_user, profile)


# --- Spendings ---


@app.get("/transactions", response_model=list[schemas.TransactionResponse])
def list_transactions(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.list_transactions(db, current_user)


@app.post("/transactions", response_model=schemas.TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction: schemas.TransactionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.create_owned(db, models.Transaction, current_user, **transaction.model_dump())


@app.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: uuid.UUID,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    crud.delete_owned(db, models.Transaction, transaction_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Savings goals ---


@app.get("/goals", response_model=list[schemas.GoalResponse])
def list_goals(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.list_goals(db, current_user)


@app.post("/goals", response_model=schemas.GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal: schemas.GoalCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.create_goal(db, current_user, goal)


@app.patch("/goals/{goal_id}/contribute", response_model=schemas.GoalResponse)
def contribute_to_goal(
    goal_id: uuid.UUID,
    contribution: schemas.GoalContribution,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.contribute_to_goal(db, goal_id, current_user, contribution.amount)


@app.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: uuid.UUID,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    crud.delete_owned(db, models.Goal, goal_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Wishlist ---


@app.get("/wishlist", response_model=list[schemas.WishItemResponse])
def list_wishlist(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.list_wishlist(db, current_user)


@app.post("/wishlist", response_model=schemas.WishItemResponse, status_code=status.HTTP_201_CREATED)
def create_wish_item(
    item: schemas.WishItemCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.create_owned(db, models.WishItem, current_user, **item.model_dump())


@app.patch("/wishlist/{item_id}", response_model=schemas.WishItemResponse)
def update_wish_item(
    item_id: uuid.UUID,
    update: schemas.WishItemUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.set_bought(db, item_id, current_user, update.bought)


@app.delete("/wishlist/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wish_item(
    item_id: uuid.UUID,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    crud.delete_owned(db, models.WishItem, item_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
