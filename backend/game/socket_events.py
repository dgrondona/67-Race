from flask_socketio import emit, join_room

rooms = {}

def register_socket_events(socketio):

    @socketio.on("connect")
    def handle_connect():
        print("CLIENT CONNECTED")

    @socketio.on("join_room")
    def handle_join(data):
        print("JOIN ROOM:", data)

        room_id = data["room_id"]
        user_id = data["user_id"]

        join_room(room_id)

        if room_id not in rooms:
            rooms[room_id] = {}

        if user_id not in rooms[room_id]:
            rooms[room_id][user_id] = 0

        emit("state_update", rooms[room_id], room=room_id)

    @socketio.on("gesture_detected")
    def handle_gesture(data):
        print("GESTURE:", data)

        room_id = data["room_id"]
        user_id = data["user_id"]

        if room_id not in rooms:
            rooms[room_id] = {}

        if user_id not in rooms[room_id]:
            rooms[room_id][user_id] = 0

        rooms[room_id][user_id] += 1

        print("ROOM STATE:", rooms)

        emit(
            "state_update",
            rooms[room_id],
            room=room_id
        )