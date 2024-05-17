import React, { useEffect, useState } from "react";
import socket from "../../Socket/index";
import ACTIONS from "../../Socket/action";
import { v4 } from "uuid";
import { Link } from "react-router-dom";

const Main = () => {
  const [rooms, updateRooms] = useState([]);
  const [serverInfo, setServerInfo] = useState({ ip: 'localhost', port: 3001 });

  useEffect(() => {
    const handleShareRooms = (data) => {
      if (data.rooms) {
        updateRooms(data.rooms);
      }
      if (data.ip && data.port) {
        setServerInfo({ ip: data.ip, port: data.port });
      }
    };

    socket.on(ACTIONS.SHARE_ROOMS, handleShareRooms);

    return () => {
      socket.off(ACTIONS.SHARE_ROOMS, handleShareRooms);
    };
  }, []);

  

  useEffect(() => {

    const getWebSocketURL = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const { ip, port } = serverInfo;
      return `${protocol}//${ip}:${port}`;
    };

    const socketURL = getWebSocketURL();   
    socket.io.uri = socketURL;
    socket.connect();
  }, [serverInfo]);

  return (
    <div>
      <h1>Available Rooms</h1>
      <ul>
        {rooms.map((roomID) => (
          <li key={roomID}>
            {roomID}
            <Link to={`/room/${roomID}`}>Join Room</Link>
          </li>
        ))}
      </ul>
      <Link to={`/room/${v4()}`}>Create New Room</Link>
    </div>
  );
};

export default Main;
