const express = require('express');
const cors = require('cors');
var cookieParser = require('cookie-parser');
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require('uuid');
const io = require("socket.io")(server, {
    cors: {
        origin: 'http://127.0.0.1:5173', // Adjust as needed
        methods: ['GET', 'POST'],
        allowedHeaders: ['my-custom-header'],
        credentials: true // Enable if needed
    }
});
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
    debug: true
});

var corsOptions = {
    origin: 'http://127.0.0.1:5173', // Remove trailing slash
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Middleware for urlencoded data
app.use(express.urlencoded({ extended: true }));

// Middleware for json data
app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use("/peerjs", peerServer);

// Endpoints
io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        socket.userId = userId; // Store userId in the socket object
        console.log(`User: ${userId} has joined the room ${roomId}`);

        setTimeout(() => {
            socket.to(roomId).emit("user-connected", userId);
        }, 1000);
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected");
        // Use the stored userId
        socket.broadcast.emit("user-disconnected", socket.userId);
    });
});

server.listen(5000, () => {
    console.log(`Server is running on port 5000`);
});
