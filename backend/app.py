from flask import Flask
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from config import Config
from db import db
from auth.routes import auth_bp
from game.socket_events import register_socket_events

print("APP BOOTING...")

app = Flask(__name__)
app.config.from_object(Config)

# init extensions
db.init_app(app)
jwt = JWTManager(app)

CORS(app, origins="*")

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="threading"
)

# register routes
app.register_blueprint(auth_bp, url_prefix="/auth")

# register socket logic
register_socket_events(socketio)


@app.route("/")
def home():
    return "67 Race Server Running"


if __name__ == "__main__":
    with app.app_context():
        db.create_all()

    print("SERVER STARTING ON http://localhost:5000")

    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=True,
        use_reloader=False
    )