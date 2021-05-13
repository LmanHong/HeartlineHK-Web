import logo from '../img/header/logo.png';
import flickerbox from '../img/header/flicker-box.gif';
import chatbutton from '../img/header/chat-button.PNG';
import '../styles/NavBar.css';

const NavBar  = () =>{

    return (
    <nav>
        <a href="#" className="nav-logo">
            <img src={logo} alt={logo} className="front" />
            <img src={flickerbox} alt={flickerbox} className="background" />
            <p className="nav-name">HEARTLINEHK</p>
        </a>
        <a href="#" className="nav-item">
            <img src={chatbutton} alt={chatbutton} className="chat-btn" />
        </a>

    </nav>
    );
}

export default NavBar;

