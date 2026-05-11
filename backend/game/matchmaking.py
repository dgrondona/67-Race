import secrets
import threading
import time
from collections import deque

REMATCH_SECONDS = 10
PARTY_SIZE = 5


class MatchmakingManager:
    def __init__(self, game_manager):
        self.gm = game_manager
        self.queue = deque()
        self.lock = threading.Lock()
        self.rematch_timers = {}

    def _gen_mm_room_id(self):
        chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        for _ in range(80):
            rid = "MM" + "".join(secrets.choice(chars) for _ in range(6))
            if rid not in self.gm.rooms:
                return rid
        return "MM" + secrets.token_hex(4).upper()

    def _remove_one_queue_entry(self, user_id, sid=None):
        user_id = str(user_id)
        newq = deque()
        removed = False
        for e in self.queue:
            if not removed and str(e["user_id"]) == user_id and (sid is None or e.get("sid") == sid):
                removed = True
                continue
            newq.append(e)
        self.queue = newq
        return removed

    def remove_sid_from_queue(self, sid):
        with self.lock:
            self.queue = deque(e for e in self.queue if e.get("sid") != sid)
            q_len = len(self.queue)
            q_sids = [e["sid"] for e in self.queue]
        return q_len, q_sids

    def enqueue(self, sid, user_id, username):
        user_id = str(user_id)
        with self.lock:
            self._remove_one_queue_entry(user_id)
            self.queue.append({
                "user_id": user_id,
                "username": username or ("user_%s" % user_id),
                "sid": sid
            })
            lst = list(self.queue)
            total = len(lst)
            pos = next((i + 1 for i, e in enumerate(lst) if e["user_id"] == user_id), total)
        return {"position": pos, "queue_length": total}

    def is_sid_queued(self, sid):
        with self.lock:
            return any(e.get("sid") == sid for e in self.queue)

    def leave_queue(self, sid, user_id):
        user_id = str(user_id)
        with self.lock:
            self._remove_one_queue_entry(user_id, sid=sid)
            q_len = len(self.queue)
            q_sids = [e["sid"] for e in self.queue]
        return q_len, q_sids

    def _mm_rooms_with_space_locked(self):
        out = []
        for rid, room in self.gm.rooms.items():
            if not room.get("is_matchmaking"):
                continue
            if room["status"] not in ("waiting", "finished"):
                continue
            if len(room["players"]) >= self.gm.MAX_PLAYERS:
                continue
            out.append((rid, room))
        out.sort(key=lambda x: (-len(x[1]["players"]), x[0]))
        return out

    def try_flush(self, socketio, socket_to_user, namespace="/"):
        events = []
        with self.lock:
            while True:
                progressed = False
                for rid, room in self._mm_rooms_with_space_locked():
                    while len(room["players"]) < self.gm.MAX_PLAYERS and self.queue:
                        entry = self.queue.popleft()
                        err = self.gm.add_player_mm_slot(rid, entry)
                        if err:
                            self.queue.appendleft(entry)
                            break
                        socket_to_user[entry["sid"]] = {
                            "room_id": rid,
                            "user_id": entry["user_id"]
                        }
                        events.append(("enter_room", entry["sid"], rid))
                        events.append(("match_found", entry["sid"], rid))
                        progressed = True
                    events.append(("room_broadcast", rid))
                    if progressed:
                        break
                if progressed:
                    continue
                if len(self.queue) >= PARTY_SIZE:
                    batch = [self.queue.popleft() for _ in range(PARTY_SIZE)]
                    new_id = self._gen_mm_room_id()
                    self.gm.create_matchmaking_room(new_id, batch)
                    for entry in batch:
                        socket_to_user[entry["sid"]] = {
                            "room_id": new_id,
                            "user_id": entry["user_id"]
                        }
                        events.append(("enter_room", entry["sid"], new_id))
                        events.append(("match_found", entry["sid"], new_id))
                    events.append(("room_broadcast", new_id))
                    continue
                break
            q_len = len(self.queue)
            q_sids = [e["sid"] for e in self.queue]
        for kind, a, b in events:
            if kind == "enter_room":
                try:
                    socketio.server.enter_room(a, b, namespace=namespace)
                except Exception as ex:
                    print("enter_room failed:", ex)
            elif kind == "match_found":
                socketio.emit("match_found", {"room_id": b}, room=a, namespace=namespace)
            elif kind == "room_broadcast":
                socketio.emit(
                    "room_state",
                    self.gm.get_room_state(b),
                    room=b,
                    namespace=namespace
                )
        self._broadcast_queue_state(socketio, q_sids, q_len, namespace)

    def _broadcast_queue_state(self, socketio, sids, queue_length, namespace="/"):
        lst = list(self.queue)
        for sid in sids:
            try:
                pos = None
                for i, e in enumerate(lst):
                    if e["sid"] == sid:
                        pos = i + 1
                        break
                socketio.emit(
                    "matchmaking_queue",
                    {"queue_length": queue_length, "position": pos},
                    room=sid,
                    namespace=namespace
                )
            except Exception:
                pass

    def broadcast_queue_update(self, socketio, namespace="/"):
        with self.lock:
            q_len = len(self.queue)
            q_sids = [e["sid"] for e in self.queue]
        self._broadcast_queue_state(socketio, q_sids, q_len, namespace)

    def cancel_rematch_timer(self, room_id):
        t = self.rematch_timers.pop(room_id, None)
        if t:
            t.cancel()

    def begin_rematch_phase(self, room_id, socketio, socket_to_user, namespace="/"):
        room = self.gm.rooms.get(room_id)
        if not room or not room.get("is_matchmaking"):
            return
        if room.get("rematch_deadline") is not None:
            return
        self.cancel_rematch_timer(room_id)
        room["rematch_deadline"] = time.time() + REMATCH_SECONDS
        room["rematch_choices"] = {str(uid): None for uid in room["players"]}
        room["status"] = "rematch"
        state = self.gm.get_room_state(room_id)
        socketio.emit("room_state", state, room=room_id, namespace=namespace)
        socketio.emit("race_finished", state, room=room_id, namespace=namespace)

        def on_deadline():
            self.resolve_rematch(room_id, socketio, socket_to_user, namespace=namespace)

        t = threading.Timer(float(REMATCH_SECONDS), on_deadline)
        t.daemon = True
        self.rematch_timers[room_id] = t
        t.start()

    def rematch_vote(self, room_id, user_id, continue_playing, socketio, socket_to_user, namespace="/"):
        room = self.gm.rooms.get(room_id)
        if not room or room["status"] != "rematch":
            return None, "not in rematch phase"
        user_id = str(user_id)
        if user_id not in room["players"]:
            return None, "not in this room"
        rc = room.setdefault("rematch_choices", {})
        if rc.get(user_id) is not None:
            return None, "already voted"
        rc[user_id] = "continue" if continue_playing else "leave"
        state = self.gm.get_room_state(room_id)
        socketio.emit("room_state", state, room=room_id, namespace=namespace)
        if all(rc.get(uid) is not None for uid in room["players"]):
            self.cancel_rematch_timer(room_id)
            self.resolve_rematch(room_id, socketio, socket_to_user, namespace=namespace)
        return state, None

    def resolve_rematch(self, room_id, socketio, socket_to_user, namespace="/"):
        self.cancel_rematch_timer(room_id)
        room = self.gm.rooms.get(room_id)
        if not room or room["status"] != "rematch":
            return
        rc = room.get("rematch_choices") or {}
        kicked = []
        for uid in list(room["players"].keys()):
            if rc.get(uid) != "continue":
                pl = room["players"].get(uid)
                sid = pl.get("socket_sid") if pl else None
                kicked.append((uid, sid))
                self.gm.remove_player_only(room_id, uid)
        room.pop("rematch_choices", None)
        room.pop("rematch_deadline", None)
        for uid, sid in kicked:
            if socket_to_user is not None and sid:
                socket_to_user.pop(sid, None)
            if sid:
                try:
                    socketio.server.leave_room(sid, room_id, namespace=namespace)
                except Exception:
                    pass
                socketio.emit("kicked_from_room", {"room_id": room_id}, room=sid, namespace=namespace)
        if not room.get("players"):
            if room_id in self.gm.rooms:
                del self.gm.rooms[room_id]
            socketio.emit("lobby_closed", {"room_id": room_id}, room=room_id, namespace=namespace)
            self.try_flush(socketio, socket_to_user, namespace=namespace)
            return
        room["status"] = "waiting"
        room["winner_id"] = None
        room["started_at"] = None
        room["finished_at"] = None
        for pl in room["players"].values():
            pl["ready"] = False
            pl["count"] = 0
            pl["finished_at"] = None
        state = self.gm.get_room_state(room_id)
        socketio.emit("room_state", state, room=room_id, namespace=namespace)
        self.try_flush(socketio, socket_to_user, namespace=namespace)
