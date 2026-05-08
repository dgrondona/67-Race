import os

def _parse_origins_env(name, default="*"):
    raw = os.getenv(name, default).strip()
    if raw == "*" or not raw:
        return "*"
    return [o.strip() for o in raw.split(",") if o.strip()]

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt_secret")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

def get_cors_origins():
    return _parse_origins_env("CORS_ORIGINS", "*")

def get_socketio_cors():
    if os.getenv("SOCKETIO_CORS_ORIGINS"):
        return _parse_origins_env("SOCKETIO_CORS_ORIGINS", "*")
    return get_cors_origins()
