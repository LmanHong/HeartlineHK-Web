import menubtn from '../img/menu bar/menu-button.png';
import closemenubtn from '../img/menu bar/cross.PNG';
import offbackground from '../img/menu bar/with-pattern.svg';
import onbackground from '../img/menu bar/with-pattern-opened.svg';
import logo from '../img/header/logo.png';
import '../styles/SideMenu.css';
import {Link} from 'react-router-dom';
import {useEffect, useRef, useState} from 'react';

const SideMenu = () =>{

    const menuWavePaths = [
        "M0,64L24,80C48,96,96,128,144,154.7C192,181,240,203,288,202.7C336,203,384,181,432,160C480,139,528,117,576,122.7C624,128,672,160,720,149.3C768,139,816,85,864,96C912,107,960,181,1008,213.3C1056,245,1104,235,1152,213.3C1200,192,1248,160,1296,160C1344,160,1392,192,1416,208L1440,224L1440,320L1416,320C1392,320,1344,320,1296,320C1248,320,1200,320,1152,320C1104,320,1056,320,1008,320C960,320,912,320,864,320C816,320,768,320,720,320C672,320,624,320,576,320C528,320,480,320,432,320C384,320,336,320,288,320C240,320,192,320,144,320C96,320,48,320,24,320L0,320Z",
        "M0,256L21.8,213.3C43.6,171,87,85,131,64C174.5,43,218,85,262,101.3C305.5,117,349,107,393,122.7C436.4,139,480,181,524,202.7C567.3,224,611,224,655,234.7C698.2,245,742,267,785,234.7C829.1,203,873,117,916,106.7C960,96,1004,160,1047,208C1090.9,256,1135,288,1178,256C1221.8,224,1265,128,1309,90.7C1352.7,53,1396,75,1418,85.3L1440,96L1440,320L1418.2,320C1396.4,320,1353,320,1309,320C1265.5,320,1222,320,1178,320C1134.5,320,1091,320,1047,320C1003.6,320,960,320,916,320C872.7,320,829,320,785,320C741.8,320,698,320,655,320C610.9,320,567,320,524,320C480,320,436,320,393,320C349.1,320,305,320,262,320C218.2,320,175,320,131,320C87.3,320,44,320,22,320L0,320Z",
        "M0,96L21.8,106.7C43.6,117,87,139,131,144C174.5,149,218,139,262,154.7C305.5,171,349,213,393,218.7C436.4,224,480,192,524,165.3C567.3,139,611,117,655,128C698.2,139,742,181,785,181.3C829.1,181,873,139,916,128C960,117,1004,139,1047,165.3C1090.9,192,1135,224,1178,234.7C1221.8,245,1265,235,1309,234.7C1352.7,235,1396,245,1418,250.7L1440,256L1440,320L1418.2,320C1396.4,320,1353,320,1309,320C1265.5,320,1222,320,1178,320C1134.5,320,1091,320,1047,320C1003.6,320,960,320,916,320C872.7,320,829,320,785,320C741.8,320,698,320,655,320C610.9,320,567,320,524,320C480,320,436,320,393,320C349.1,320,305,320,262,320C218.2,320,175,320,131,320C87.3,320,44,320,22,320L0,320Z",
        "M0,192L21.8,170.7C43.6,149,87,107,131,85.3C174.5,64,218,64,262,80C305.5,96,349,128,393,160C436.4,192,480,224,524,208C567.3,192,611,128,655,138.7C698.2,149,742,235,785,277.3C829.1,320,873,320,916,272C960,224,1004,128,1047,74.7C1090.9,21,1135,11,1178,26.7C1221.8,43,1265,85,1309,90.7C1352.7,96,1396,64,1418,48L1440,32L1440,320L1418.2,320C1396.4,320,1353,320,1309,320C1265.5,320,1222,320,1178,320C1134.5,320,1091,320,1047,320C1003.6,320,960,320,916,320C872.7,320,829,320,785,320C741.8,320,698,320,655,320C610.9,320,567,320,524,320C480,320,436,320,393,320C349.1,320,305,320,262,320C218.2,320,175,320,131,320C87.3,320,44,320,22,320L0,320Z",
        "M0,320L21.8,282.7C43.6,245,87,171,131,133.3C174.5,96,218,96,262,96C305.5,96,349,96,393,128C436.4,160,480,224,524,224C567.3,224,611,160,655,144C698.2,128,742,160,785,160C829.1,160,873,128,916,144C960,160,1004,224,1047,234.7C1090.9,245,1135,203,1178,170.7C1221.8,139,1265,117,1309,122.7C1352.7,128,1396,160,1418,176L1440,192L1440,320L1418.2,320C1396.4,320,1353,320,1309,320C1265.5,320,1222,320,1178,320C1134.5,320,1091,320,1047,320C1003.6,320,960,320,916,320C872.7,320,829,320,785,320C741.8,320,698,320,655,320C610.9,320,567,320,524,320C480,320,436,320,393,320C349.1,320,305,320,262,320C218.2,320,175,320,131,320C87.3,320,44,320,22,320L0,320Z"
    ];

    const menuContentDiv = useRef();
    const menuContentWave = useRef();
    const dropdownMenuUL = useRef();

    const openSideMenu = (e) =>{
        let wave = menuWavePaths[Math.floor(Math.random()*menuWavePaths.length)];
        menuContentWave.current.setAttribute('d', wave);
        menuContentDiv.current.style.animationDuration = "1.2s";
        menuContentDiv.current.classList.add("opened");
    }

    const closeSideMenu = (e) =>{
        let wave = menuWavePaths[Math.floor(Math.random()*menuWavePaths.length)];
        menuContentWave.current.setAttribute('d', wave);
        menuContentDiv.current.style.animationDuration = "1.2s";
        menuContentDiv.current.classList.remove("opened");
    }

    const openMobileDropdownMenu = (e) =>{
        dropdownMenuUL.current.classList.toggle("opened");
    }

    useEffect(()=>{
        if ("navbarObserver" in window) window.navbarObserver.disconnect();
        let options = {
            rootMargin: "0px 0px 50px 0px"
        };
        const navbarObserver = new IntersectionObserver((entries, observer)=>{
            let sideMenuBtn = document.querySelector('.side-menu-container .menu-btn');
            entries.forEach(entry =>{
                if (!entry.isIntersecting) sideMenuBtn.classList.add('hide-btn');
                else sideMenuBtn.classList.remove('hide-btn');
            });
        }, options);
        navbarObserver.observe(document.querySelector('nav'));
        window.narbarObserver = navbarObserver;
        return () => {window.navbarObserver.disconnect();}
    });


    return(
        <div className="side-menu-container">
            <a className="menu-btn" onClick={openSideMenu}>
                <img src={menubtn} alt={menubtn} />
                <img src={offbackground} alt={offbackground} className="background" />
            </a>

            <div ref={menuContentDiv} className="menu-content">

                <svg  className="menu-content-wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path ref={menuContentWave} className="wave-path" fill="#1a2c43" fill-opacity="1" d={menuWavePaths[0]}></path>
                </svg>

                <div className="menu-nav">
                    <Link to="/" className="nav-logo" onClick={closeSideMenu}>
                        <img src={logo} alt={logo} className="front" />
                        <p className="nav-name">HEARTLINEHK</p>
                    </Link>
                    <ul className="nav-items-container">
                        <li className="nav-item mobile">
                            <a className="nav-menu-btn fa fa-times" onClick={closeSideMenu}></a>
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

                <a className="menu-btn" onClick={closeSideMenu}>
                    <img src={closemenubtn} alt={closemenubtn}/>
                    <img src={onbackground} alt={onbackground} className="background" />
                </a>
                

                <ul className="menu-links">
                    <li className="link"><Link to="/about-us" onClick={closeSideMenu}>關於我們</Link></li>
                    <li className="link"><Link to="/" onClick={closeSideMenu}>聊天室</Link></li>
                    <li className="link dropdown-trigger">
                        <Link to="/support-us" onClick={closeSideMenu}>支持我們<i className="fa fa-caret-down"></i></Link>
                        <a className="mobile-dropdown-trigger fa fa-caret-down" onClick={openMobileDropdownMenu}></a>
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