import { useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { Avatar } from '@mui/material';
import logo from "../img/logo/logo_80x80.png";
import "../styles/NavBar.css";
import { getAuth } from "firebase/auth";
import { getDatabase, ref } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import { useObjectVal } from "react-firebase-hooks/database";

const NavBar = (props) =>{

    const firebaseAuth = getAuth();
    const firebaseDB = getDatabase();
    const [currentUser] = useAuthState(firebaseAuth);
    const [supervisors] = useObjectVal(ref(firebaseDB, 'supervisors'));
    const [preferredNames] = useObjectVal(ref(firebaseDB, 'preferred_names'));

    const menuNav = useRef();
    const navBackgroundDiv = useRef();

    const isSupervisor = useMemo(() => {
        if (currentUser && supervisors){
            return (supervisors[currentUser.uid] !== undefined)
        }
        return false;
    }, [supervisors, currentUser]);
    const preferredName = useMemo(() => {
        if (currentUser && preferredNames && preferredNames[currentUser.uid]){
            const userPreferredName = preferredNames[currentUser.uid];
            return userPreferredName["firstName"] + " "+ userPreferredName["lastName"];
        }
        return "";
    }, [preferredNames, currentUser]);
    const avatarBgColor = useMemo(() => "#"+Math.floor(Math.random()*16777215).toString(16), [])
    const avatarAbbrev = useMemo(() => {
        if (preferredName){
            return preferredName.split(' ')[0][0] + preferredName.split(' ')[1][0];
        }
        return "";
    }, [preferredName])

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
                <Avatar sx={{ bgcolor: avatarBgColor, width: '75%', height: '75%', mx: 'auto' }}>{avatarAbbrev}</Avatar>
                <a className="username">{preferredName}</a>
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