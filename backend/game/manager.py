class GameManager:
    def __init__(self):
        self.rooms = {}

    # ─────────────────────────────
    # ROOM SAFETY
    # ─────────────────────────────
    def ensure_room(self, room_id):
        if room_id not in self.rooms:
            self.rooms[room_id] = {
                "players": {},
                "status": "waiting"
            }

    # ─────────────────────────────
    # PLAYER JOIN
    # ─────────────────────────────
    def add_player(self, room_id, user_id):
        self.ensure_room(room_id)

        room = self.rooms[room_id]

        if user_id not in room["players"]:
            room["players"][user_id] = {
                "count": 0
            }

    # ─────────────────────────────
    # GESTURE UPDATE
    # ─────────────────────────────
    def add_gesture(self, room_id, user_id):
        self.ensure_room(room_id)

        room = self.rooms[room_id]

        if user_id not in room["players"]:
            room["players"][user_id] = {
                "count": 0
            }

        room["players"][user_id]["count"] += 1

        return room["players"][user_id]["count"]

    # ─────────────────────────────
    # WIN CONDITION
    # ─────────────────────────────
    def check_winner(self, room_id):
        self.ensure_room(room_id)

        room = self.rooms[room_id]

        for user_id, data in room["players"].items():
            if data["count"] >= 100:
                return user_id

        return None