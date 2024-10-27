from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room
import platform
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

app.config['SECRET_KEY'] = "wubba lubba dub dub"
socketio = SocketIO(app, cors_allowed_origins="*")

session = {}
users_in_room = {}
rooms_sid = {}
names_sid = {}

@app.route("/join", methods=["POST"])
def join():
    data = request.get_json()
    
    display_name = data.get('display_name')
    mute_audio = data.get('audio') 
    mute_video = data.get('video')  
    room_id = 1
    
    session[room_id] = {
        "name": display_name,
        "mute_audio": mute_audio,
        "mute_video": mute_video
    }
    
    return jsonify({
        "room_id": room_id,
        "display_name": session[room_id]["name"],
        "mute_audio": session[room_id]["mute_audio"],
        "mute_video": session[room_id]["mute_video"]
    })

@socketio.on("connect")
def on_connect():
    sid = request.sid
    print("New socket connected", sid)
    print("Session:", session)

@socketio.on("join-room")
def on_join_room(data):
    sid = request.sid
    room_id = data["room_id"]
    print('SID:', sid)
    print('room_id:', room_id)

    if room_id not in session:
        print(f"Error: room_id {room_id} not found in session")
        emit("error", {"message": "Session data for room not found"})
        return

    display_name = session[room_id]["name"]

    join_room(room_id)
    rooms_sid[sid] = room_id
    names_sid[sid] = display_name

    print("[{}] New member joined: {}<{}>".format(room_id, display_name, sid))

    # Emit the new user connection to other members in the room
    emit("user-connect", {"sid": sid, "name": display_name}, broadcast=True, include_self=False, room=room_id)

    if room_id not in users_in_room:
        users_in_room[room_id] = [sid]
        emit("user-list", {"my_id": sid})  # Send own id only
    else:
        usrlist = {u_id: names_sid.get(u_id, "Unknown") for u_id in users_in_room[room_id]}

        emit("user-list", {"list": usrlist, "my_id": sid})
        users_in_room[room_id].append(sid)

        # Notify the new user of existing streams and send offers
        for existing_sid in users_in_room[room_id]:
            if existing_sid != sid:  # Don't send to self
                existing_name = names_sid.get(existing_sid, "Unknown User")
                emit("user-connect", {"sid": existing_sid, "name": existing_name}, room=sid)

    print("\nusers:", users_in_room, "\n")

@socketio.on("disconnect")
def on_disconnect():
    sid = request.sid
    room_id = rooms_sid.get(sid)
    if room_id is None:
        print(f"Error: SID {sid} is not associated with any room.")
        return

    display_name = names_sid.get(sid, "Unknown User")

    print("[{}] Member left: {}<{}>".format(room_id, display_name, sid))
    emit("user-disconnect", {"sid": sid}, broadcast=True, include_self=False, room=room_id)

    if room_id in users_in_room and sid in users_in_room[room_id]:
        users_in_room[room_id].remove(sid)
        if not users_in_room[room_id]:  # Remove room if empty
            users_in_room.pop(room_id)

    rooms_sid.pop(sid, None)
    names_sid.pop(sid, None)

    print("\nusers:", users_in_room, "\n")

@socketio.on("data")
def on_data(data):
    sender_sid = data['sender_id']
    target_sid = data['target_id']
    if sender_sid != request.sid:
        print("[Not supposed to happen!] request.sid and sender_id don't match!!!")

    if data["type"] != "new-ice-candidate":
        print('{} message from {} to {}'.format(data["type"], sender_sid, target_sid))
    socketio.emit('data', data, room=target_sid)

if any(platform.win32_ver()):
    socketio.run(app, debug=True)
