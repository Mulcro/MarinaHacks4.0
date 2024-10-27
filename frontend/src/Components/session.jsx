import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const Session = () => {
    const [socket, setSocket] = useState(null);
    const [displayName, setDisplayName] = useState("mulero");
    const [audio, setAudio] = useState(true);
    const [video, setVideo] = useState(true);
    const localStream = useRef(null);
    const localVideoRef = useRef(null); // Ref for the local video element
    const peerConnections = useRef({});

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io("http://localhost:5000");
        setSocket(newSocket);

        // Clean up on component unmount
        return () => {
            newSocket.disconnect();
            if (localStream.current) {
                localStream.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (socket) {
            console.log("Socket connected:", socket.id);

            // Log user list reception
            socket.on("user-list", (data) => {
                console.log("User list received:", data);
            });

            // Log new user joins
            socket.on("user-connect", async (user) => {
                console.log("New user joined:", user);
                // Create a peer connection for the new user and send existing tracks
                await createPeerConnection(user.sid, false);
            });

            // Log user disconnections
            socket.on("user-disconnect", (data) => {
                console.log("User disconnected:", data);
                if (peerConnections.current[data.sid]) {
                    peerConnections.current[data.sid].close();
                    delete peerConnections.current[data.sid];
                }
            });

            // Log any signaling data received
            socket.on("data", handleSignalData);
        }
    }, [socket]);

    const joinSession = async () => {
        try {
            // Capture local video/audio
            localStream.current = await navigator.mediaDevices.getUserMedia({ video, audio });
            console.log("Local stream:", localStream.current);

            // Attach local stream to a video element
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream.current;
            }

            const response = await fetch("http://127.0.0.1:5000/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    display_name: displayName,
                    audio: audio ? 1 : 0,
                    video: video ? 1 : 0,
                }),
            });

            const roomData = await response.json();
            console.log("Joined room:", roomData);

            // Notify all existing users to create peer connections for this new user
            socket.emit("user-list", { room_id: roomData.room_id });
        } catch (error) {
            console.error("Error capturing media:", error);
        }
    };

    const handleSignalData = async (data) => {
        const { sender_id, target_id, type, payload } = data;
        console.log("Received signaling data:", data);

        if (type === "offer") {
            console.log("Received offer from:", sender_id);
            await createPeerConnection(sender_id);
            const peerConnection = peerConnections.current[sender_id];
            await peerConnection.setRemoteDescription(new RTCSessionDescription(payload));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            console.log("Sending answer to:", sender_id);
            socket.emit("data", {
                sender_id: socket.id,
                target_id: sender_id,
                type: "answer",
                payload: answer,
            });
        } else if (type === "answer") {
            console.log("Received answer from:", target_id);
            const peerConnection = peerConnections.current[target_id];
            await peerConnection.setRemoteDescription(new RTCSessionDescription(payload));
        } else if (type === "new-ice-candidate") {
            console.log("Received ICE candidate from:", sender_id);
            const candidate = new RTCIceCandidate(payload);
            peerConnections.current[target_id].addIceCandidate(candidate);
        }
    };

    const createPeerConnection = async (peerId, initiator = false) => {
        console.log(`Creating peer connection for peerId: ${peerId}, initiator: ${initiator}`);
        const peerConnection = new RTCPeerConnection();

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("Sending ICE candidate:", event.candidate);
                socket.emit("data", {
                    sender_id: socket.id,
                    target_id: peerId,
                    type: "new-ice-candidate",
                    payload: event.candidate,
                });
            }
        };

        peerConnection.ontrack = (event) => {
            console.log("Received remote stream:", event.streams[0]);
            const remoteVideo = document.createElement("video");
            remoteVideo.srcObject = event.streams[0];
            remoteVideo.autoplay = true;
            remoteVideo.id = `video-${peerId}`;
            document.body.appendChild(remoteVideo);
        };

        if (localStream.current) {
            localStream.current.getTracks().forEach((track) => {
                peerConnection.addTrack(track, localStream.current);
            });
        }

        if (initiator) {
            const offer = await peerConnection.createOffer();
            console.log("Sending offer:", offer);
            await peerConnection.setLocalDescription(offer);
            socket.emit("data", {
                sender_id: socket.id,
                target_id: peerId,
                type: "offer",
                payload: offer,
            });
        }

        peerConnections.current[peerId] = peerConnection;
    };

    return (
        <div>
            <button className="m-10 border rounded-xl bg-pink-200 p-2" onClick={joinSession}>
                Join Session
            </button>
            <video ref={localVideoRef} autoPlay muted style={{ width: "300px", height: "200px" }} />
        </div>
    );
};

export default Session;
