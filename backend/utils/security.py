from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

def hash_password(password):
    return bcrypt.generate_password_hash(password).decode("utf-8")

def check_password(hash_pw, password):
    return bcrypt.check_password_hash(hash_pw, password)