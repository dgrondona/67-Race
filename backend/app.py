import os
from dotenv import load_dotenv
load_dotenv()

from flask import Flask
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from config import Config, get_cors_origins, get_socketio_cors
from db import db, apply_sqlite_user_migrations
from auth.routes import auth_bp
from game.socket_events import register_socket_events
from utils.security import bcrypt

print("APP BOOTING...")

app = Flask(__name__)
app.config.from_object(Config)

# init extensions
db.init_app(app)
bcrypt.init_app(app)
jwt = JWTManager(app)

_cors = get_cors_origins()
if _cors == "*":
    CORS(app, resources={r"/*": {"origins": "*"}})
else:
    CORS(app, origins=_cors)

_sock_cors = get_socketio_cors()
socketio = SocketIO(
    app,
    cors_allowed_origins=_sock_cors,
    async_mode="threading"
)

# register routes
app.register_blueprint(auth_bp, url_prefix="/auth")

# register socket logic
register_socket_events(socketio)


def init_database():
    uri = app.config.get("SQLALCHEMY_DATABASE_URI") or ""
    if uri.startswith("sqlite:///") and not uri.startswith("sqlite:///:memory:"):
        db_path = uri.replace("sqlite:///", "", 1)
        if db_path and not db_path.startswith(":"):
            parent = os.path.dirname(os.path.abspath(db_path))
            if parent:
                os.makedirs(parent, exist_ok=True)
    with app.app_context():
        db.create_all()
        apply_sqlite_user_migrations(app)


init_database()


@app.route("/")
def home():
    return "67 Race Server Running"


if __name__ == "__main__":
    _port = int(os.getenv("PORT", "5000"))
    print("SERVER STARTING ON http://0.0.0.0:%s" % _port)

    socketio.run(
        app,
        host="0.0.0.0",
        port=_port,
        debug=os.getenv("FLASK_DEBUG", "1") == "1",
        use_reloader=False
    )