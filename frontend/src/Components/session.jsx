import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Peer from 'peerjs';

const Sessions = () => {
    const [userId, setUserId] = useState(null);
    const [roomId, setRoomId] = useState(10);
    const socketRef = useRef(null);
    const peerRef = useRef(null);
    const userVideoRef = useRef(null);
    const partnerVideoRef = useRef(null);
    const [localStream, setLocalStream] = useState(null);

    useEffect(() => {
        // Initialize socket connection
        socketRef.current = io("http://localhost:5000");

        // Initialize Peer connection
        peerRef.current = new Peer();

        // Listen for Peer connection
        peerRef.current.on('open', id => {
            setUserId(id); // Set userId when Peer connection opens
        });

        // Listen for socket connection
        socketRef.current.on('connect', () => {
            console.log("Connected to socket server");
            if (userId) {
                joinRoom(); // Re-join room when socket connects
            }
        });

        // Listen for incoming calls
        peerRef.current.on('call', call => {
            console.log("Incoming call detected");
            if (localStream) {
                call.answer(localStream);
                call.on('stream', stream => {
                    if (partnerVideoRef.current) {
                        partnerVideoRef.current.srcObject = stream;
                    }
                });
            }
        });

        // Clean up on component unmount
        return () => {
            disconnect();
        };
    }, []);

    useEffect(() => {
        if (userId) {
            joinRoom(); // Call joinRoom when userId is set
        }
    }, [userId]);

    const joinRoom = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);

            if (userVideoRef.current) {
                userVideoRef.current.srcObject = stream; // Display local stream
            }

            if (roomId) {
                socketRef.current.emit('join-room', roomId, userId);
                console.log(`User ${userId} joined room ${roomId}`);
            }
        } catch (err) {
            console.error('Error accessing media devices.', err);
        }
    };

    const disconnect = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop()); // Stop local tracks
        }
        socketRef.current.disconnect(); // Disconnect from socket
        peerRef.current.destroy(); // Destroy Peer connection
        console.log("Disconnected from the session.");
    };

    useEffect(() => {
        socketRef.current.on('user-connected', (userId) => {
            console.log("User connected:", userId);
            if (localStream) {
                const call = peerRef.current.call(userId, localStream);
                call.on('stream', stream => {
                    if (partnerVideoRef.current) {
                        partnerVideoRef.current.srcObject = stream; // Show the remote video stream
                    }
                });
            }
        });

        socketRef.current.on('user-disconnected', (userId) => {
            console.log("User disconnected:", userId);
            // Handle user disconnection (e.g., stop showing their video)
        });
    }, [localStream]);

    return (
        <div className=" font-silkscreen lg:h-[92vh] bg-[#C6E7C6] sm:h-full flex flex-col items-center">
            
            <div className='relative flex justify-center w-screen'>
                <div className='absolute left-0 top-[55%] h-2 lg:w-[22rem] sm:w-[2rem] bg-gradient-to-l from-black to-[#F2CFF2]'/>
                <h1 className='text-[50px] leading-[98px] mt-2' >Let's get to <span className='underline text-transparent bg-clip-text bg-gradient-to-t from-[#F2CFF2] from-20% to-black via-40%'>Yapping!</span></h1>
                <div className='absolute right-0 top-[55%] h-2 lg:w-[22rem] sm:w-[2rem] bg-gradient-to-r from-black to-[#F2CFF2]'/>
            </div>

            <h4 className='text-[20px] underline'>You got connected !!</h4>

            <div className='flex w-[80%] flex-row flex-wrap gap-10 items-center justify-around mt-[4rem]'>

                <div className='relative flex justify-center shadow-xl'>
                    <h4 className="absolute top-[-10%] left-[5%]">My Camera</h4>
                    
                    <video className="h-[22rem] border border-solid border-neutral-200 border-[1rem] rounded-[1rem] shadow-md" ref={userVideoRef} autoPlay muted/>

                    <div className='absolute h-[3rem] w-[60%] rounded-xl bg-white/70 flex flex-row justify-around bottom-10 py-2'> 
                        <img src="/public/5904483.png" alt="" />
                        <img src="/public/4087422.png" alt="" />
                    </div>

                </div>

                <div className='relative flex justify-center shadow-xl'>

                    <h4 className="absolute top-[-10%] left-[5%]">My Partner</h4>

                    <video className="h-[22rem] border border-solid border-white border-[0.8rem] rounded-[1rem]" ref={partnerVideoRef} autoPlay  />

                    <div className='absolute h-[3rem] w-[60%] rounded-xl bg-white/70 flex flex-row justify-around bottom-10 py-2'> 
                        <img src="/public/5904483.png" alt="" />
                        <img src="/public/4087422.png" alt="" />
                    </div>

                </div>
                
            </div>

            <div className='flex flex-row gap-10 mt-10'>
                <button className="p-3 bg-green-200 rounded-xl border border-solid border-2  border-black hover:bg-green-300"  onClick={joinRoom}>Join Room</button>

                <button className='p-3 bg-blue-200 rounded-xl border border-solid border-2 border-black hover:bg-blue-300' onClick={() => window.location.reload()}>Refresh</button>

                <button className="p-3 bg-red-400 rounded-xl border border-solid border-2 border-black hover:bg-red-500" onClick={disconnect}>Disconnect</button>
            </div>
        </div>
    );
};

export default Sessions;
