from flask import Blueprint, request, jsonify
from models import User, db
from utils.security import hash_password, check_password
from flask_jwt_extended import create_access_token

auth_bp = Blueprint("auth", __name__)

# SIGNUP
@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json

    user = User(
        email=data["email"],
        password_hash=hash_password(data["password"])
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "user created"})


# LOGIN
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json

    user = User.query.filter_by(email=data["email"]).first()

    if user and check_password(user.password_hash, data["password"]):
        token = create_access_token(identity=user.id)
        return jsonify({"token": token})

    return jsonify({"error": "invalid credentials"}), 401


# GUEST MODE
@auth_bp.route("/guest", methods=["POST"])
def guest():
    token = create_access_token(identity="guest")
    return jsonify({"token": token, "guest": True})