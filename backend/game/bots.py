import random
import threading
import time

def start_bot(game_manager, socketio, room_id, bot_id):
    def run():
        while True:
            time.sleep(random.uniform(0.4, 1.2))

            room = game_manager.rooms.get(room_id)
            if not room:
                break

            room["players"][bot_id]["count"] += 1

            socketio.emit("player_update", {
                "user_id": bot_id,
                "count": room["players"][bot_id]["count"]
            }, room=room_id)

            if room["players"][bot_id]["count"] >= 100:
                socketio.emit("game_end", {"winner": bot_id}, room=room_id)
                break

    threading.Thread(target=run).start()