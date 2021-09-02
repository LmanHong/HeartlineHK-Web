import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../img/logo/logo_80x80.png";
import "../styles/NavBar.css";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";

const NavBar = (props) =>{

    const menuNav = useRef();
    const navBackgroundDiv = useRef();
    const [isSupervisor, setIsSupervisor] = useState(false);

    const openNav = ()=>{
        menuNav.current.style.transitionDuration = "0.5s";
        menuNav.current.classList.add("opened");
        navBackgroundDiv.current.classList.add("opened");
    };

    const closeNav = ()=>{
        menuNav.current.style.transitionDuration = "0.5s";
        menuNav.current.classList.remove("opened");
        navBackgroundDiv.current.classList.remove("opened");
    }

    useEffect(()=>{
        firebase.database().ref('supervisors').child(props.currentUser.uid).once('value', (snapshot)=>{
            if (snapshot.val() != null) setIsSupervisor(true);
            else setIsSupervisor(false);
        });
    }, []);

    return (
        <>
        <button className="nav-toggle-btn" onClick={openNav}><span className="material-icons">menu</span></button>

        <nav className="nav-container" ref={menuNav}>
            <a href="#" className="nav-logo">
                <img src={logo} alt={logo} className="front" />
                <p className="nav-name">HEARTLINEHK</p>
            </a>
            <ul className="nav-items-container">
                <li className="nav-item">
                    <Link to="/" className="nav-link" onClick={closeNav}>
                        <span className="material-icons">home</span> 資訊版面
                    </Link>    
                </li>
                <li className="nav-item">
                    <Link to="/chatroom" className="nav-link" onClick={closeNav}>
                        <span className="material-icons">chat</span> 聊天室
                    </Link>
                </li>
                <li className="nav-item">
                    <Link to="/profile-update" className="nav-link" onClick={closeNav}>
                        <span className="material-icons">badge</span> 更改個人資料
                    </Link>
                </li>
                {isSupervisor && 
                <li className="nav-item">
                    <Link to="/supervisor" className="nav-link" onClick={closeNav}>
                        <span className="material-icons">question_answer</span> 管理員版面
                    </Link>
                </li>
                }

            </ul>
            <div className="nav-user" onClick={props.handleLogout}>
                <img src="https://t4.ftcdn.net/jpg/02/34/61/79/360_F_234617921_p1AGQkGyEl8CSzwuUI74ljn6IZXqMUf2.jpg" alt="" />
                <a className="username">{props.currentUser.displayName}</a>
            </div>
        </nav>

        <div ref={navBackgroundDiv} className="nav-background" onClick={closeNav}></div>
        </>
    );
}

export default NavBar;

//                
//
//
//