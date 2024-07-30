let userExist = [];

function sendTo(connection, message) {
  connection.send(message);
}

function SocketRouter(io) {
  io.on('connection', function(socket) {
  socket.on('message', function(message) {
      userExist.push({ socketid: socket.id, message: message.id });
  io.to(socket.id).emit("message","ye raha me");
    });

    socket.on('disconnect', function() {
      
      });

  });
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
  
        if (room.connectedUsers.length > 0) {
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
}

module.exports = SocketRouter;
