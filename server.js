const path = require("path");
const express = require("express");
const http = require("https");
const socketIo = require("socket.io");
const os = require("os");
const { version, validate } = require('uuid');
const ACTIONS = require('./src/Socket/action');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3001;


const getLocalExternalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const iface = interfaces[interfaceName];
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return 'localhost'; // fallback на localhost
};

const IP_ADDRESS = getLocalExternalIP();

// возвращение всех комнат чата, которые есть
const getClientRooms = () => {
  const { rooms } = io.sockets.adapter;
  return Array.from(rooms.keys()).filter(roomID => validate(roomID) && version(roomID));
};

// Клиент видит комнату и подключается к ней
const shareRoomsInfo = () => {
  io.emit(ACTIONS.SHARE_ROOMS, { rooms: getClientRooms(), ip: IP_ADDRESS, port: PORT });
};

io.on("connection", (socket) => {
  shareRoomsInfo();

  socket.on(ACTIONS.JOIN, config => {
    const { room: roomID } = config;
    const { rooms: joinRooms } = socket;

    if (Array.from(joinRooms).includes(roomID)) {
      console.log(`Already joined ${roomID}`);
    } else {
      const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);

      clients.forEach(clientID => {
        io.to(clientID).emit(ACTIONS.ADD_PEER, {
          peerID: socket.id,
          createOffer: false
        });

        socket.emit(ACTIONS.ADD_PEER, {
          peerID: clientID,
          createOffer: true
        });
      });

      socket.join(roomID);
      shareRoomsInfo();
    }
  });

  // Логика выхода
  const leaveRoom = () => {
    const { rooms } = socket;

    Array.from(rooms).forEach(roomID => {
      const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);

      clients.forEach(clientID => {
        io.to(clientID).emit(ACTIONS.REMOVE_PEER, {
          peerID: socket.id
        });
        socket.emit(ACTIONS.REMOVE_PEER, {
          peerID: clientID,
        });
      });

      socket.leave(roomID);
    });
    shareRoomsInfo();
  };

  socket.on(ACTIONS.LEAVE, leaveRoom);
  socket.on('disconnecting', leaveRoom);
});

server.listen(PORT, () => {
  console.log(`Server started on ${IP_ADDRESS}:${PORT}`);
});
