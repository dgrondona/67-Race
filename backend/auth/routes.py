import secrets
from sqlalchemy.exc import IntegrityError
from flask import Blueprint, request, jsonify
from models import User, db
from utils.security import hash_password, check_password
from flask_jwt_extended import create_access_token

auth_bp = Blueprint("auth", __name__)

# SIGNUP
@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "username already exists"}), 409

    user = User(
        username=username,
        password_hash=hash_password(password)
    )

    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "username already exists"}), 409

    token = create_access_token(identity=str(user.id))
    return jsonify({
        "message": "user created",
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username
        }
    }), 201


# LOGIN
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400
    user = User.query.filter_by(username=username).first()
    if user and check_password(user.password_hash, password):
        token = create_access_token(identity=str(user.id))
        return jsonify({
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username
            }
        })

    return jsonify({"error": "invalid credentials"}), 401


# GUEST MODE
@auth_bp.route("/guest", methods=["POST"])
def guest():
    guest_id = f"guest_{secrets.token_hex(4)}"
    token = create_access_token(identity=guest_id)
    return jsonify({
        "token": token,
        "guest": True,
        "user": {
            "id": guest_id,
            "username": f"player_{guest_id[-6:]}"
        }
    })
