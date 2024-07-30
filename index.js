const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config();
// console.log(uuidv4);

// Middleware setup
app.use(express.json());
app.use(cors());

// Database connection
const connectDB = require("./src/config/db");
connectDB();

// Routes
const auth = require("./src/routes/auth");
app.use("/api", auth);

// Root route
app.get("/", (req, res) => {
  res.send("Server Is Running");
});

// Error handling middleware
app.use((err, req, res, next) => {
  // console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Create HTTP server
const server = http.createServer(app);

let connectedUsers = [];
let rooms = [];

app.get("/api/room-exists/:roomId", (req, res) => {
  const { roomId } = req.params;
  // console.log(roomId, rooms);
  const room = rooms.find((room) => room.id === roomId);

  if (room) {
    // Send response that room exists
    if (room.connectedUsers.length > 3) {
      return res.send({ roomExists: true, full: true });
    } else {
      return res.send({ roomExists: true, full: false });
    }
  } else {
    // Send response that room does not exist
    return res.send({ roomExists: false });
  }
});

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  // console.log("user connected with the id", `${socket.id}`);
  socket.on("create-new-room", (data) => {
    createNewRoom(socket, data);
  });
  socket.on("join-room", (data) => {
    joinRoom(socket, data);
  });

  socket.on("conn-signal",(data)=>{
    signalHandler(data,socket)
  })

  socket.on("conn-init", (data) => {
    initializeConnectionHandler(data, socket);
  });

  socket.on("disconnect", () => {
    console.log("disconnect")
    DisconnectUsers(socket);
  });

  socket.on("Shared-screen-large",(data)=>{
    SharingScreenStyle(data,socket)
  })
});

const createNewRoom = (socket, data) => {
  const { identity } = data;
  const roomid = uuidv4(); // Generate a unique room ID
  // console.log(data);
  let newUser = {
    identity,
    socketId: socket.id,
    id: uuidv4(), // Generate a unique user ID
    roomid,
  };
  connectedUsers = [...connectedUsers, newUser];

  let newRoom = {
    id: roomid,
    connectedUsers: [newUser],
  };
  socket.join(roomid);
  rooms = [...rooms, newRoom];
  socket.emit("room-id", { roomid });

  socket.emit("updated-room", { connectedUsers: newRoom.connectedUsers });
  console.log(socket.id)
};

const joinRoom = (socket, data) => {
  let { identity, roomid } = data;
  let newUser = {
    socketId: socket.id,
    roomid: roomid,
    identity: identity,
    id: uuidv4(), // Generate a unique user ID
  };
  const room = rooms.find((x) => x.id === roomid);
  if (room) {
    room.connectedUsers = [...room.connectedUsers, newUser];
    socket.join(roomid);

    connectedUsers = [...connectedUsers, newUser];
    // conn preper for peer js
    room.connectedUsers.forEach(user => {
      if (user.socketId!==socket.id) {
        const data={
          connectedUserId:socket.id
        }
        console.log("working",user.socketId)
        io.to(user.socketId).emit("conn-pre",data)
        
      }
    });
    io.to(roomid).emit("updated-room", { connectedUsers: room.connectedUsers });
  } else {
    socket.emit("error", { message: "Room not found" });
  }
};
const DisconnectUsers = (socket) => {
  const user = connectedUsers.find((user) => user.socketId === socket.id);
  if (user) {
    let room = rooms.find((x) => x.id === user.roomid);
    if (room) {
      room.connectedUsers = room.connectedUsers.filter((x) => x.id !== user.id);
  socket.leave(user.roomid)
  console.log(socket.id,"socket.id")
      if (room.connectedUsers.length > 0) {
        io.to(room.id).emit("user-disconnected", { socketId: socket.id });
        io.to(room.id).emit("updated-room", {
          connectedUsers: room.connectedUsers,
        });
      } else {
     rooms = rooms.filter((x) => x.id !== room.id);
  }
  }
  }
};


const signalHandler=(data,socket)=>{
  const {signal,connectedUserId}=data
  const singnalingData={signal,connectedUserId:socket.id}
  io.to(connectedUserId).emit("conn-signal",singnalingData)

}

const initializeConnectionHandler = (data, socket) => {
  const { connectedUserId } = data;

  const initData = { connectedUserId: socket.id };
  io.to(connectedUserId).emit("conn-init", initData);
};


const SharingScreenStyle=(data,socket)=>{
  const {isScreenSharingActive}=data
  const user = connectedUsers.find((user) => user.socketId === socket.id);
  if (user) {
    let room = rooms.find((x) => x.id === user.roomid);
  if(room){
    room.connectedUsers.forEach(user => {
      if (user.socketId!==socket.id) {
        const data={
          sharedBy:socket.id,
          isScreenSharingActive

        }
        io.to(user.socketId).emit("Shared-screen-large",data)
        
      }
    });

  }
  }

}

console.log(rooms,"r")
// Start the server
const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
  console.log(`Node server listening at http://localhost:${PORT}`);
});
