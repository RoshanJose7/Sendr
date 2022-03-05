import { Link } from "react-router-dom";
import "./Navbar.styles.scss";

function NavbarComponent() {
  return (
    <nav>
      <Link to="/">
        <h1>Sendr</h1>
      </Link>
    </nav>
  );
}

export default NavbarComponent;
