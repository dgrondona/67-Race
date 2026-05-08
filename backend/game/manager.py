import time

class GameManager:
    TARGET_SCORE = 100
    MAX_PLAYERS = 5

    def __init__(self):
        self.rooms = {}

    def ensure_room(self, room_id):
        if room_id not in self.rooms:
            self.rooms[room_id] = {
                "room_id": room_id,
                "host_id": None,
                "players": {},
                "status": "waiting",
                "winner_id": None,
                "started_at": None,
                "finished_at": None,
                "past_games": []
            }
        else:
            self.rooms[room_id].setdefault("past_games", [])
        return self.rooms[room_id]

    def peek_room(self, room_id):
        if not room_id:
            return {"exists": False, "can_join": False, "status": None}
        room = self.rooms.get(room_id)
        if not room:
            return {"exists": False, "can_join": False, "status": None}
        can_join = room["status"] not in ("racing", "countdown")
        return {
            "exists": True,
            "can_join": can_join,
            "status": room["status"]
        }

    def create_room(self, room_id, host_id, username):
        room = self.ensure_room(room_id)
        room["host_id"] = str(host_id)
        err = self._add_player_to_room(room, host_id, username)
        if err:
            return None, err
        return room, None

    def add_player(self, room_id, user_id, username):
        if room_id not in self.rooms:
            return None, "room not found"
        room = self.rooms[room_id]
        if room["status"] in ("racing", "countdown"):
            return None, "cannot join while a race is starting or in progress"
        err = self._add_player_to_room(room, user_id, username)
        if err:
            return None, err
        return room, None

    def _add_player_to_room(self, room, user_id, username):
        user_id = str(user_id)
        if user_id in room["players"]:
            return None
        if len(room["players"]) >= self.MAX_PLAYERS:
            return "lobby is full (max %s players)" % self.MAX_PLAYERS
        room["players"][user_id] = {
            "user_id": user_id,
            "username": username,
            "count": 0,
            "finished_at": None,
            "ready": False
        }
        return None

    def set_player_ready(self, room_id, user_id, ready):
        if room_id not in self.rooms:
            return None, "room not found"
        room = self.rooms[room_id]
        if room["status"] not in ("waiting", "finished"):
            return None, "cannot change ready right now"
        user_id = str(user_id)
        if user_id not in room["players"]:
            return None, "not in this room"
        room["players"][user_id]["ready"] = bool(ready)
        return room, None

    def validate_start_countdown(self, room_id, starter_id):
        if room_id not in self.rooms:
            return "room not found"
        room = self.rooms[room_id]
        if room["host_id"] != str(starter_id):
            return "only host can start the race"
        if not room["players"]:
            return "no players in room"
        if room["status"] in ("racing", "countdown"):
            return "a race is already starting or running"
        if room["status"] not in ("waiting", "finished"):
            return "cannot start right now"
        for pl in room["players"].values():
            if not pl.get("ready"):
                return "not everyone is ready yet"
        return None

    def begin_countdown(self, room_id):
        room = self.rooms[room_id]
        room["status"] = "countdown"
        return room

    def activate_race(self, room_id):
        room = self.rooms.get(room_id)
        if not room:
            return None, "room not found"
        room["status"] = "racing"
        room["winner_id"] = None
        room["started_at"] = time.time()
        room["finished_at"] = None
        for player in room["players"].values():
            player["count"] = 0
            player["finished_at"] = None
        return room, None

    def remove_player(self, room_id, user_id):
        user_id = str(user_id)
        if room_id not in self.rooms:
            return None
        room = self.rooms[room_id]
        if user_id in room["players"]:
            del room["players"][user_id]
        if room["host_id"] == user_id:
            next_host = next(iter(room["players"]), None)
            room["host_id"] = next_host
        if not room["players"]:
            del self.rooms[room_id]
            return None
        return room

    def close_lobby(self, room_id, host_id):
        room_id = room_id or ""
        host_id = str(host_id)
        room = self.rooms.get(room_id)
        if not room:
            return False, "room not found"
        if room["host_id"] != host_id:
            return False, "only host can close lobby"
        del self.rooms[room_id]
        return True, None

    def add_gesture(self, room_id, user_id, increment=1):
        room = self.ensure_room(room_id)
        user_id = str(user_id)
        if room["status"] != "racing":
            return room, None, False
        if user_id not in room["players"]:
            return room, None, False
        p = room["players"][user_id]
        before_all_done = self._all_players_reached_target(room)
        p["count"] += increment
        if p["count"] >= self.TARGET_SCORE:
            p["count"] = self.TARGET_SCORE
            if p.get("finished_at") is None:
                p["finished_at"] = time.time()
            if room.get("winner_id") is None:
                room["winner_id"] = user_id
        after_all_done = self._all_players_reached_target(room)
        race_just_finished = False
        if room["status"] == "racing" and after_all_done and not before_all_done:
            room["status"] = "finished"
            room["finished_at"] = time.time()
            for pl in room["players"].values():
                pl["ready"] = False
            self._append_past_game(room)
            race_just_finished = True
        winner = room["winner_id"]
        return room, winner, race_just_finished

    def _append_past_game(self, room):
        started = room.get("started_at")
        ended = room.get("finished_at")
        players_snap = []
        for uid, pl in room["players"].items():
            rt = None
            if started and pl.get("finished_at"):
                rt = round(pl["finished_at"] - started, 3)
            rate = 0.0
            if started and pl.get("finished_at") and rt:
                rate = round(pl["count"] / max(rt, 0.001), 3)
            elif started and pl.get("finished_at"):
                rate = round(pl["count"] / max(pl["finished_at"] - started, 0.001), 3)
            players_snap.append({
                "user_id": uid,
                "username": pl["username"],
                "count": pl["count"],
                "race_time_sec": rt,
                "sixty_sevens_per_sec": rate
            })
        idx = len(room.setdefault("past_games", []))
        room["past_games"].append({
            "race_index": idx + 1,
            "started_at": started,
            "finished_at": ended,
            "winner_id": room.get("winner_id"),
            "target_score": self.TARGET_SCORE,
            "players": players_snap
        })

    def _all_players_reached_target(self, room):
        if not room["players"]:
            return False
        for player in room["players"].values():
            if player["count"] < self.TARGET_SCORE:
                return False
        return True

    def check_winner(self, room_id):
        room = self.ensure_room(room_id)
        return room["winner_id"]

    def get_room_state(self, room_id):
        room = self.ensure_room(room_id)
        now = time.time()
        started = room["started_at"]
        players = sorted(
            room["players"].values(),
            key=lambda player: (-player["count"], player["username"])
        )
        out_players = []
        for pl in players:
            row = dict(pl)
            row.setdefault("ready", False)
            if started and room["status"] != "waiting":
                if pl.get("finished_at"):
                    dur = max(pl["finished_at"] - started, 0.001)
                else:
                    dur = max(now - started, 0.001)
                row["sixty_sevens_per_sec"] = round(pl["count"] / dur, 3)
            else:
                row["sixty_sevens_per_sec"] = 0.0
            if started and pl.get("finished_at"):
                row["race_time_sec"] = round(pl["finished_at"] - started, 3)
            else:
                row["race_time_sec"] = None
            out_players.append(row)
        past = list(room.get("past_games") or [])
        return {
            "room_id": room["room_id"],
            "host_id": room["host_id"],
            "status": room["status"],
            "winner_id": room["winner_id"],
            "target_score": self.TARGET_SCORE,
            "max_players": self.MAX_PLAYERS,
            "players": out_players,
            "started_at": room["started_at"],
            "finished_at": room["finished_at"],
            "past_games": past
        }
