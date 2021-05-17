import menubtn from '../img/menu bar/menu-button.png';
import offbackground from '../img/menu bar/with pattern.PNG';
import onbackground from '../img/menu bar/with pattern opened.png';
import logo from '../img/header/logo.png';
import flickerbox from '../img/header/flicker-box.gif';
import chatbutton from '../img/menu bar/chat-button-slide-menu.png';
import '../styles/SideMenu.css';
import {Link} from 'react-router-dom';
import {useState, useRef, useEffect} from 'react';

const SideMenu = () =>{

    const menuContentDiv = useRef();

    const openSideMenu = (e) =>{
        menuContentDiv.current.style.animationDuration = "1s";
        menuContentDiv.current.classList.add("opened");
    }

    const closeSideMenu = (e) =>{
        menuContentDiv.current.style.animationDuration = "1s";
        menuContentDiv.current.classList.remove("opened");
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

                <Link to="/" className="logo" onClick={closeSideMenu}>
                    <img src={logo} alt={logo} className="front" />
                    <img src={flickerbox} alt={flickerbox} className="background" />
                    <p className="name">HEARTLINEHK</p>
                </Link>
                <Link to="/" className="nav-item" onClick={closeSideMenu}>
                    <img src={chatbutton} alt={chatbutton} className="chat-btn" />
                </Link>
                <a href="#" className="nav-item fa fa-instagram"></a>
                <a href="#" className="nav-item fa fa-facebook"></a>


                <a href="#" className="menu-btn" onClick={closeSideMenu}>
                    <img src={menubtn} alt={menubtn}/>
                </a>
                <img src={onbackground} alt={onbackground} className="menu-btn-background" />

                <ul className="menu-links">
                    <li className="link"><Link to="/about-us" onClick={closeSideMenu}>關於我們</Link></li>
                    <li className="link"><Link to="/" onClick={closeSideMenu}>聊天室</Link></li>
                    <li className="link dropdown-trigger">
                        <a href="#">支持我們<i className="fa fa-caret-down"></i></a>
                        <ul className="dropdown-menu">
                            <li className="dropdown-link"><Link to="/" onClick={closeSideMenu}>捐款</Link></li>
                            <li className="dropdown-link"><Link to="/" onClick={closeSideMenu}>成為合作夥伴</Link></li>
                            <li className="dropdown-link"><Link to="/" onClick={closeSideMenu}>成為義工</Link></li>
                        </ul>
                    </li>
                    <li className="link"><Link to="/" onClick={closeSideMenu}>最新動態</Link></li>
                    <li className="link"><Link to="/" onClick={closeSideMenu}>相關服務</Link></li>
                    <li className="link"><Link to="/" onClick={closeSideMenu}>常見問題</Link></li>
                </ul>
            </div>
        </div>

    );
}

export default SideMenu;