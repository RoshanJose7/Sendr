import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.styles.scss";

function HomePage() {
  const navigate = useNavigate();
  const roomNameRef = useRef<HTMLInputElement | null>(null);
  const userNameRef = useRef<HTMLInputElement | null>(null);

  function JoinRoom() {
    const roomName = roomNameRef.current?.value;
    const userName = userNameRef.current?.value;

    if (roomName && userName) return navigate(`/room/${roomName}/${userName}`);
    console.error("Both Room Name and User Name is required!");
  }

  return (
    <main id="home-page">
      <div id="home-page-content">
        <input ref={userNameRef} type="text" placeholder="User Name" />
        <input
          ref={roomNameRef}
          style={{ marginTop: "10px" }}
          type="text"
          placeholder="Room Name"
        />

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

export default HomePage;
