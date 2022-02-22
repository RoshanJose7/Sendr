import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../Socket";

function RoomRouter() {
  const roomNameRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  function JoinRoom() {
    const roomName = roomNameRef.current?.value;

    if (roomName) {
      socket.emit("joinRoom", roomName);
      console.log("Created Room and joined successfully");
      navigate(`/room/${roomName}`);
      return;
    }

    console.error("Room Name Invalid");
  }

  return (
    <main id="rooms-router-page">
      <h1>Rooms Page</h1>

      <div className="center-vertical">
        <input ref={roomNameRef} type="text" placeholder="Room Name" />

        <button
          style={{ marginTop: "30px" }}
          className="btn"
          onClick={JoinRoom}
        >
          Create / Join Room
        </button>
      </div>
    </main>
  );
}

export default RoomRouter;
