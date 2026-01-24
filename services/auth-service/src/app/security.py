import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def hash_otp(otp: str) -> str:
    # Using password hasher keeps it simple (bcrypt)
    return pwd_context.hash(otp)


def verify_otp(otp: str, otp_hash: str) -> bool:
    return pwd_context.verify(otp, otp_hash)


def _jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET", "")
    if not secret:
        raise RuntimeError("JWT_SECRET is required")
    return secret


def _jwt_algorithm() -> str:
    return os.getenv("JWT_ALGORITHM", "HS256")


def create_access_token(*, user_id: uuid.UUID, role: str, email: str, expires_minutes: int) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=expires_minutes)
    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "role": role,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=_jwt_algorithm())


def decode_access_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, _jwt_secret(), algorithms=[_jwt_algorithm()])


def try_decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return decode_access_token(token)
    except JWTError:
        return None

