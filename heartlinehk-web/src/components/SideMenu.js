import menubtn from '../img/menu bar/menu-button.png';
import closemenubtn from '../img/menu bar/cross.PNG';
import offbackground from '../img/menu bar/with pattern.PNG';
import onbackground from '../img/menu bar/with pattern opened.png';
import logo from '../img/header/logo.png';
import flickerbox from '../img/header/flicker-box.gif';
import chatbutton from '../img/menu bar/chat-button-slide-menu.png';
import '../styles/SideMenu.css';
import {Link} from 'react-router-dom';
import {useRef} from 'react';

const SideMenu = () =>{

    const menuContentDiv = useRef();
    const dropdownMenuUL = useRef();

    const openSideMenu = (e) =>{
        menuContentDiv.current.style.animationDuration = "1s";
        menuContentDiv.current.classList.add("opened");
    }

    const closeSideMenu = (e) =>{
        menuContentDiv.current.style.animationDuration = "1s";
        menuContentDiv.current.classList.remove("opened");
    }

    const openMobileDropdownMenu = (e) =>{
        dropdownMenuUL.current.classList.toggle("opened");
    }


    return(
        <div className="side-menu-container">
            <div className="menu-btn-container">
                <a href="#" className="menu-btn" onClick={openSideMenu}>
                    <img src={menubtn} alt={menubtn} />
                </a>
                <img src={offbackground} alt={offbackground} className="background" />
            </div>
            <div ref={menuContentDiv} className="menu-content">
                <div className="menu-nav">
                    <Link to="/" className="nav-logo" onClick={closeSideMenu}>
                        <img src={logo} alt={logo} className="front" />
                        <p className="nav-name">HEARTLINEHK</p>
                    </Link>
                    <ul className="nav-items-container">
                        <li className="nav-item mobile">
                            <a href="#" className="menu-btn fa fa-times" onClick={closeSideMenu}></a>
                        </li>
                        <li className="nav-item">
                            <Link to="/" className="chat-btn" onClick={closeSideMenu}></Link>
                        </li>
                        <li className="nav-item">
                            <a href="#" className="nav-item fa fa-facebook"></a>
                        </li>
                        <li className="nav-item">
                            <a href="#" className="nav-item fa fa-instagram"></a>
                        </li>
                    </ul>
                </div>

                <a href="#" className="menu-btn" onClick={closeSideMenu}>
                    <img src={closemenubtn} alt={closemenubtn}/>
                </a>
                <img src={onbackground} alt={onbackground} className="menu-btn-background" />

                <ul className="menu-links">
                    <li className="link"><Link to="/about-us" onClick={closeSideMenu}>關於我們</Link></li>
                    <li className="link"><Link to="/" onClick={closeSideMenu}>聊天室</Link></li>
                    <li className="link dropdown-trigger">
                        <Link to="/support-us" onClick={closeSideMenu}>支持我們<i className="fa fa-caret-down"></i></Link>
                        <a href="#" className="mobile-dropdown-trigger fa fa-caret-down" onClick={openMobileDropdownMenu}></a>
                        <ul ref={dropdownMenuUL} className="dropdown-menu">
                            <li className="dropdown-link"><Link to={{pathname: "/support-us", hash: "#donation"}} onClick={closeSideMenu}>捐款</Link></li>
                            <li className="dropdown-link"><Link to={{pathname: "/support-us", hash: "#partner"}} onClick={closeSideMenu}>成為合作夥伴</Link></li>
                            <li className="dropdown-link"><Link to="/volunteer-recruit" onClick={closeSideMenu}>成為義工</Link></li>
                        </ul>
                    </li>
                    <li className="link"><Link to="/latest-feed" onClick={closeSideMenu}>最新動態</Link></li>
                    <li className="link"><Link to="/related-services" onClick={closeSideMenu}>相關服務</Link></li>
                    <li className="link"><Link to="/faq" onClick={closeSideMenu}>常見問題</Link></li>
                </ul>
            </div>
        </div>

    );
}

export default SideMenu;