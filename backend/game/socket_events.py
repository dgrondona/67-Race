from flask import request
from flask_socketio import emit, join_room, leave_room
from game.manager import GameManager

def _norm_room_id(room_id):
    return (room_id or "").strip().upper()

def register_socket_events(socketio):
    game_manager = GameManager()
    socket_to_user = {}

    @socketio.on("connect")
    def handle_connect():
        print("CLIENT CONNECTED")
        emit("socket_connected", {"socket_id": request.sid})

    @socketio.on("disconnect")
    def handle_disconnect():
        user = socket_to_user.pop(request.sid, None)
        if not user:
            return
        room_id = user["room_id"]
        user_id = user["user_id"]
        room = game_manager.remove_player(room_id, user_id)
        if room:
            emit("room_state", game_manager.get_room_state(room_id), room=room_id)

    @socketio.on("host_lobby")
    def handle_host_lobby(data):
        room_id = _norm_room_id(data.get("room_id"))
        user_id = str(data.get("user_id"))
        username = data.get("username") or f"user_{user_id}"
        if not room_id or not user_id:
            emit("room_error", {"message": "room_id and user_id are required"})
            return
        join_room(room_id)
        room, err = game_manager.create_room(room_id, user_id, username)
        if err:
            emit("room_error", {"message": err})
            return
        socket_to_user[request.sid] = {"room_id": room_id, "user_id": user_id}
        emit("room_state", game_manager.get_room_state(room_id), room=room_id)

    @socketio.on("join_lobby")
    def handle_join_lobby(data):
        room_id = _norm_room_id(data.get("room_id"))
        user_id = str(data.get("user_id"))
        username = data.get("username") or f"user_{user_id}"
        if not room_id or not user_id:
            emit("room_error", {"message": "room_id and user_id are required"})
            return
        join_room(room_id)
        room, err = game_manager.add_player(room_id, user_id, username)
        if err:
            emit("room_error", {"message": err})
            return
        socket_to_user[request.sid] = {"room_id": room_id, "user_id": user_id}
        emit("room_state", game_manager.get_room_state(room_id), room=room_id)

    @socketio.on("peek_room")
    def handle_peek_room(data):
        room_id = _norm_room_id(data.get("room_id"))
        info = game_manager.peek_room(room_id)
        emit("room_peek", {"room_id": room_id, **info})

    @socketio.on("close_lobby")
    def handle_close_lobby(data):
        room_id = _norm_room_id(data.get("room_id"))
        user_id = str(data.get("user_id"))
        if not room_id or not user_id:
            emit("room_error", {"message": "room_id and user_id are required"})
            return
        ok, err = game_manager.close_lobby(room_id, user_id)
        if err:
            emit("room_error", {"message": err})
            return
        emit("lobby_closed", {"room_id": room_id}, room=room_id)
        for sid in list(socket_to_user.keys()):
            info = socket_to_user.get(sid)
            if info and info.get("room_id") == room_id:
                del socket_to_user[sid]

    @socketio.on("gesture_detected")
    def handle_gesture(data):
        room_id = _norm_room_id(data.get("room_id"))
        user_id = str(data.get("user_id"))
        increment = int(data.get("count", 1))
        if not room_id or not user_id:
            emit("room_error", {"message": "room_id and user_id are required"})
            return
        room, _winner, race_just_finished = game_manager.add_gesture(room_id, user_id, increment)
        emit("room_state", game_manager.get_room_state(room_id), room=room_id)
        if race_just_finished:
            emit("race_finished", game_manager.get_room_state(room_id), room=room_id)

    @socketio.on("start_race")
    def handle_start_race(data):
        room_id = _norm_room_id(data.get("room_id"))
        user_id = str(data.get("user_id"))
        if not room_id or not user_id:
            emit("room_error", {"message": "room_id and user_id are required"})
            return
        room, error = game_manager.start_race(room_id, user_id)
        if error:
            emit("room_error", {"message": error})
            return
        emit("race_started", game_manager.get_room_state(room_id), room=room_id)
        emit("room_state", game_manager.get_room_state(room_id), room=room_id)

    @socketio.on("leave_lobby")
    def handle_leave_lobby(data):
        room_id = _norm_room_id(data.get("room_id"))
        user_id = str(data.get("user_id"))
        if not room_id or not user_id:
            emit("room_error", {"message": "room_id and user_id are required"})
            return
        leave_room(room_id)
        room = game_manager.remove_player(room_id, user_id)
        socket_to_user.pop(request.sid, None)
        if room:
            emit("room_state", game_manager.get_room_state(room_id), room=room_id)