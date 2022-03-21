import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import ConfirmModal from "./components/ConfirmModal.js";
import NoticeModal from "./components/NoticeModal.js";
import NavBar from "./components/NavBar.js";
import ProfileUpdate from "./pages/ProfileUpdate.js";
import Supervisor from "./pages/Supervisor.js";
import Chatroom from "./pages/Chatroom.js";
import Dashboard from "./pages/Dashboard.js";
import Login from "./pages/Login.js";
import ResetPassword from "./pages/ResetPassword.js";
import { browserSessionPersistence, getAuth, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getDatabase, child, ref, get, onDisconnect, set, serverTimestamp, remove } from 'firebase/database';
import { useDatabase } from "./hooks/useDatabase.js";
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';


function App() {

  const [onlineTimeRef, oLoading, oError, onlineTime] = useDatabase('online_time');
  const [connectedRef, cLoading, cError, connectedInfo] = useDatabase('.info/connected');
  const [currentUser, setCurrentUser] = useState(null);
  const [auth, setAuth] = useState(getAuth());


  const handleLogin = async (e) =>{
    e.preventDefault();
    try{
      const currentEmail = e.target.querySelector('#login-email').value;
      const currentPassword = e.target.querySelector('#login-password').value;
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, currentEmail, currentPassword);
      sessionStorage.setItem('heartlinehk-loggedIn', Date.now().toString());
      
    }catch(error){
      console.error(error.message);
      alert(error.message);
    }
  }

  const handleLogout = async (isAutoLogout=false) =>{
    try{
      sessionStorage.removeItem('heartlinehk-loggedIn');
      onDisconnect(child(onlineTimeRef, auth.currentUser.uid)).cancel();
      setCurrentUser(null);
      await remove(child(onlineTimeRef, auth.currentUser.uid));
      await signOut(auth);

      console.log("Signed out!");
    }catch(error){
      console.error(error.message);
      alert(error.message);
    }
  }

  //Callback for handling the form submission of logout confirmation modal
  const logoutFormHandler = (e)=>{
    e.preventDefault();
    const modalContainerDiv = e.target.parentElement.parentElement;
    if (modalContainerDiv.id === "logout-modal"){
        const isConfirmed = (e.target.className === "confirm-btn");
        if (isConfirmed) handleLogout();
        modalContainerDiv.classList.remove("opened");
    }else console.error("ERROR: Parent Element is not a logout modal!");
  }

  const getAgentUid = ()=>{
    let agentUid = sessionStorage.getItem('heartlinehk-agentUid');
    if (!uuidValidate(agentUid)){
      console.warn("Invalid Agent UID!");
      agentUid = uuidv4();
      sessionStorage.setItem('heartlinehk-agentUid', agentUid);
    }else console.log("Valid Agent UID!");
    
    return agentUid;
  }


  useEffect(()=>{
    var authChangeListener = onAuthStateChanged(getAuth(), (user)=>{
      if (user){
        console.log("User is logged in!");
        setCurrentUser(user);
      }else{
        console.warn("User is logged out!");
        setCurrentUser(null);
      }
    });

    return authChangeListener;
  });

  useEffect(()=>{
    const isLoggedIn = sessionStorage.getItem('heartlinehk-loggedIn');
    if (currentUser && isLoggedIn){
      if (onlineTime === null || onlineTime[currentUser.uid] === null){
        set(child(onlineTimeRef, currentUser.uid), {
          'uid': getAgentUid(),
          'time': serverTimestamp()
        });
        onDisconnect(child(onlineTimeRef, currentUser.uid)).remove();
      }
    }
    
  }, [currentUser, onlineTime]);

  useEffect(()=>{
    const setViewHeight = ()=>{
      let vh = window.innerHeight * 0.01;
      console.log(vh);
      console.log(window.innerHeight);
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setViewHeight();
    window.addEventListener('resize', setViewHeight);
  }, []);

  return (
    <Router>
      <div className="App" style={{width: "100vw", minHeight: "calc(100 * var(--vh, 1vh))", position: "relative", backgroundColor: "rgba(0,0,0,0.05)", display: "flex", flexDirection:"row", overflow: "hidden"}}>
        {!currentUser && 
          <Switch>
            <Route exact path="/reset-password">
              <ResetPassword/>
            </Route>
            <Route path="/">
              <Login handleLogin={handleLogin} />
            </Route>
          </Switch>
        }
        {currentUser && 
          <>
          <ConfirmModal modalId={"logout-modal"} confirmText={"你確定要登出嗎？"} formSubmitHandler={logoutFormHandler}></ConfirmModal>
          <NavBar currentUser={currentUser} handleLogout={()=>{document.getElementById("logout-modal").classList.add('opened')}}/>
          <Switch>
            <Route exact path="/chatroom">
              <Chatroom currentUser={currentUser}/>
            </Route>
            <Route exact path="/supervisor">
              <Supervisor currentUser={currentUser}/>
            </Route>
            <Route exact path="/profile-update">
              <ProfileUpdate currentUser={currentUser}/>
            </Route>
            <Route path="/">
              <Dashboard currentUser={currentUser}/>
            </Route>
          </Switch>
          </>
        }
      </div>
    </Router>
  );
}

export default App;
