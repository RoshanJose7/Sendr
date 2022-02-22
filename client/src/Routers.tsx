import { Route, Routes } from "react-router-dom";
import RoomRouter from "./pages/RoomRoutersPage/RoomRouter.pages";
import RoomPage from "./pages/RoomPage/RoomPage.pages";

function Routers() {
  return (
    <Routes>
      <Route path="/" element={<RoomRouter />} />
      <Route path="room/:roomName/" element={<RoomPage />} />
    </Routes>
  );
}

export default Routers;
