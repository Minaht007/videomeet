const path = require("path");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const ACTIONS = require('./src/Socket/action')
const {version, validate} = require('uuid')

const Port = process.env.Port || 3001;

// возвращение всех комнат чата, которые есть

const getClientRooms = () => {
  const { rooms } = io.sockets.adapter;
  return Array.from(rooms.keys()).filter(roomID => validate(roomID) && version(roomID));
};

// Клиент видит комнату и подключается к ней
const shareRoomsInfo = () => {
  io.emit(ACTIONS.SHARE_ROOMS, { rooms: getClientRooms() });
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
        const {rooms} = socket

        Array.from(rooms).forEach(roomID => {
            const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || [])

            clients.forEach(clientID => {
                io.to(clientID).emit(ACTIONS.REMOVE_PEER, {
                    peerID: socket.id
                })
                socket.emit(ACTIONS.REMOVE_PEER, {
                    peerID: clientID,
                })
            })

            socket.leave(roomID)
        })
        shareRoomsInfo()
    }

    socket.on(ACTIONS.LEAVE, leaveRoom)
    socket.on('disconnecting', leaveRoom )

    socket.on(ACTIONS.RELAY_SDP, ({peerID, sessionDescription}) => {
        oninput.to(peerID.emit(ACTIONS.SESSION_DESCRIPTION, {
            peerID:socket.id,
            sessionDescription
        }))
    })
    socket.on(ACTIONS.RELAY_ICE, ({peerID, iceCandidate}) => io.to(peerID).emit(ACTIONS.ICE_CANDIDATE, {
        peerID:socket.id,
        iceCandidate,
    }))
});

server.listen(Port, () => {
  console.log("Server Started");
});
