from flask_socketio import join_room, emit
from game.manager import GameManager
import random

game = GameManager()

def register_socket_events(socketio):

    # ─────────────────────────────
    # JOIN ROOM
    # ─────────────────────────────
    @socketio.on("join_room")
    def join(data):
        room_id = data["room_id"]
        user_id = data["user_id"]

        join_room(room_id)

        game.ensure_room(room_id)
        game.add_player(room_id, user_id)

        emit("state_update", game.rooms[room_id], room=room_id)

    # ─────────────────────────────
    # START GAME (optional for now)
    # ─────────────────────────────
    @socketio.on("start_game")
    def start(data):
        room_id = data["room_id"]

        game.ensure_room(room_id)
        room = game.rooms[room_id]

        room["status"] = "running"

        emit("game_start", {}, room=room_id)

    # ─────────────────────────────
    # GESTURE EVENT (CORE GAME LOOP)
    # ─────────────────────────────
    @socketio.on("gesture_detected")
    def gesture(data):
        room_id = data["room_id"]
        user_id = data["user_id"]

        count = game.add_gesture(room_id, user_id)

        emit("player_update", {
            "user_id": user_id,
            "count": count
        }, room=room_id)

        winner = game.check_winner(room_id)

        if winner:
            emit("game_end", {
                "winner": winner
            }, room=room_id)