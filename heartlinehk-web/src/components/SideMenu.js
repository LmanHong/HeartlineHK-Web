import menubtn from '../img/menu bar/menu-button.png';
import offbackground from '../img/menu bar/with pattern.PNG';
import onbackground from '../img/menu bar/with pattern opened.png';
import logo from '../img/header/logo.png';
import flickerbox from '../img/header/flicker-box.gif';
import chatbutton from '../img/menu bar/chat-button-slide-menu.png';
import '../styles/SideMenu.css';

const SideMenu = () =>{
    return(
        <div className="side-menu-container">
            <div className="menu-btn-container">
                <a href="#" className="menu-btn">
                    <img src={menubtn} alt={menubtn} />
                </a>
                <img src={offbackground} alt={offbackground} className="background" />
            </div>
            <div className="menu-content">

                <a href="#" className="logo">
                    <img src={logo} alt={logo} className="front" />
                    <img src={flickerbox} alt={flickerbox} className="background" />
                    <p className="name">HEARTLINEHK</p>
                </a>
                <a href="#" className="nav-item">
                    <img src={chatbutton} alt={chatbutton} className="chat-btn" />
                </a>
                <a href="#" className="nav-item fa fa-instagram"></a>
                <a href="#" className="nav-item fa fa-facebook"></a>


                <a href="#" className="menu-btn">
                    <img src={menubtn} alt={menubtn} />
                </a>
                <img src={onbackground} alt={onbackground} className="menu-btn-background" />

                <ul className="menu-links">
                    <li className="link"><a href="#">關於我們</a></li>
                    <li className="link"><a href="#">聊天室</a></li>
                    <li className="link"><a href="#">支持我們</a></li>
                    <li className="link"><a href="#">最新動態</a></li>
                    <li className="link"><a href="#">相關服務</a></li>
                    <li className="link"><a href="#">常見問題</a></li>
                </ul>
            </div>
        </div>

    );
}

export default SideMenu;