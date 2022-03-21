import logo from '../img/header/logo_80x80.png';
import '../styles/NavBar.css';
import {Link} from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faGift, faPhone } from '@fortawesome/free-solid-svg-icons';

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
                <a className="nav-menu-btn" onClick={openMobileMenu}><FontAwesomeIcon icon={faBars}/></a>
            </li>
            <li className="nav-item">
                <Link to="/chatroom" className="chat-btn"></Link>
            </li>
            <li className="nav-item">
                <a className="phone-btn" href="tel:+85230016615"><FontAwesomeIcon icon={faPhone}/> 30016615</a>
            </li>
            {false && 
                <li className="nav-item">
                    <Link to="/donation" className="donation-btn"><FontAwesomeIcon icon={faGift}/> 捐款</Link>
                </li>
            }
            
        </ul>

    </nav>
    );
}

export default NavBar;

