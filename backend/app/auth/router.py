from fastapi import APIRouter, HTTPException, status, Depends
from app.auth.models import UserCreate, UserLogin, TokenResponse, UserResponse
from app.auth.utils import hash_password, verify_password, create_access_token, get_current_user
from app.db.mongo import get_user_by_email, create_user, get_user_by_id

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: UserCreate):
    existing = await get_user_by_email(body.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(body.password)
    user = await create_user(
        name=body.name,
        email=body.email,
        hashed_password=hashed,
    )

    token = create_access_token({"sub": user["id"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(**user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin):
    user = await get_user_by_email(body.email)
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user["id"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(**user),
    )


@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)
