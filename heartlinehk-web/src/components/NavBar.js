import logo from '../img/header/logo_80x80.png';
import '../styles/NavBar.css';
import {Link} from 'react-router-dom';

const NavBar  = (props) =>{

    const openMobileMenu = () =>{
        if (props.menuContentClass){
            let menuContentDiv = document.querySelector(`.${props.menuContentClass}`);
            if (menuContentDiv){
                menuContentDiv.style.animationDuration = "1s";
                menuContentDiv.classList.add('opened');
            }else console.error(`No menu content with ${props.menuContentClass} className found!`);
        } else console.error('No menuContentClass!');
    }

    return (
    <nav className="nav-container">
        <Link to="/" className="nav-logo">
            <img src={logo} alt={logo} className="front" />
            <p className="nav-name">HEARTLINEHK</p>
        </Link>
        <ul className="nav-items-container">
            <li className="nav-item mobile">
                <a className="nav-menu-btn fa fa-bars" onClick={openMobileMenu}></a>
            </li>
            <li className="nav-item">
                <Link to="/chatroom" className="chat-btn"></Link>
            </li>
        </ul>

    </nav>
    );
}

export default NavBar;

