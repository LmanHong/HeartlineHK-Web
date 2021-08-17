import { Link } from "react-router-dom";
import logo from "../img/logo/logo_80x80.png";
import "../styles/NavBar.css";

const NavBar = (props) =>{

    return (
        <nav>
            <a href="#" className="nav-logo">
                <img src={logo} alt={logo} className="front" />
                <p className="nav-name">HEARTLINEHK</p>
            </a>
            <ul className="nav-items-container">
                <li className="nav-item">
                    <Link to="/" className="nav-link">
                        <span className="material-icons">home</span> Dashboard
                    </Link>    
                </li>
                <li className="nav-item">
                    <Link to="/chatroom" className="nav-link">
                        <span className="material-icons">chat</span> Chatroom
                    </Link>
                </li>
            </ul>
            <div className="nav-user">
                <img src="https://t4.ftcdn.net/jpg/02/34/61/79/360_F_234617921_p1AGQkGyEl8CSzwuUI74ljn6IZXqMUf2.jpg" alt="" />
                <a href="" className="username" onClick={props.handleLogout}>{props.currentUser.displayName}</a>
            </div>
        </nav>
    );
}

export default NavBar;

