import { useEffect, useRef, useState } from "react";
import socket from "../../Socket/index";
import ACTIONS from "../../Socket/action";
import { useNavigate } from "react-router"
import { v4 } from "uuid";
import { Link } from "react-router-dom";

const Main = () => {
  const [rooms, updateRooms] = useState([]);
  const rootNode = useRef();
  const navigate = useNavigate()

  useEffect(() => {
    const handleShareRooms = (data) => {
      if (rootNode.current) {
        updateRooms(data.rooms || []);
      }
    };

    socket.on(ACTIONS.SHARE_ROOMS, handleShareRooms);

    return () => {
      socket.off(ACTIONS.SHARE_ROOMS, handleShareRooms);
    };
  }, []);

  return (
    <div>
      <h1>Available Rooms</h1>
      <ul>
        {rooms.map((roomID) => (
          <li key={roomID}>
            {roomID}
            <button onClick={() => navigate.pushState(`/roomID`)}>Join Room</button>
            {/* <Link to={`/room/${roomID}`}>Join Room</Link> */}
          </li>
        ))}
      </ul>
      <Link to={`/room/${v4()}`}>Create New Room</Link>
      {/* onClick={() => navigate.pushState(`/room/${v4}`)} */}
    </div>
  );
};

export default Main;

// onClick={() => navigate.pushState(`/roomID`)}
