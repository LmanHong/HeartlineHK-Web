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
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";

function App() {

  const transferRef = firebase.database().ref('transfer_requests');
  const onlineTimeRef = firebase.database().ref('online_time');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [auth, setAuth] = useState(firebase.auth());

  const handleConnectionChanges = async (snapshot)=>{
    if (auth.currentUser){
      if (snapshot.val() === true){
        if (onlineTimeRef){
          const onlineTimeInfo = (await onlineTimeRef.child(auth.currentUser.uid).once('value')).val();
          const agentUid = sessionStorage.getItem('heartlinehk-agentUid');
          const isReconnected = sessionStorage.getItem('heartlinehk-disconnected');

          if (onlineTimeInfo === null || isReconnected === null){
            await onlineTimeRef.child(auth.currentUser.uid).onDisconnect().remove();
            await onlineTimeRef.child(auth.currentUser.uid).set({
              'uid': agentUid,
              'time': firebase.database.ServerValue.TIMESTAMP
            });
            onlineTimeRef.child(auth.currentUser.uid).off('value');
            onlineTimeRef.child(auth.currentUser.uid).on('value', handleOnlineTimeChanges);
          }else if (onlineTimeRef['uid'] != agentUid){
            document.getElementById('auto-logout-modal').classList.add('opened');
            handleLogout(true);
          }
        }else console.error("ERROR: Online Time Reference not available!");
      }else{
        console.warn("WARNING: Current User is disconnected!");
        sessionStorage.setItem('heartlinehk-disconnected', Date.now());
      }
    }else console.error("ERROR: Current User is null!");
  }

  const handleOnlineTimeChanges = (snapshot)=>{
    if (snapshot.val() != null){
      const loggedInUid = snapshot.val()['uid'];
      const agentUid = sessionStorage.getItem('heartlinehk-agentUid');
      if (loggedInUid != agentUid){
        document.getElementById('auto-logout-modal').classList.add('opened');
        handleLogout(true);
      }
    }
  };

  const handleIncomingTransferChanges = (snapshot)=>{
    if (snapshot.val() != null && snapshot.val()['status'] === 'pending'){
      document.getElementById('transferrequest-notice-modal').classList.add('opened');
    }else document.getElementById('transferrequest-notice-modal').classList.remove('opened');
  }

  const handleLogin = async (e) =>{
    e.preventDefault();
    if (!isLoggingIn){
        setIsLoggingIn(true);
        let currentEmail = document.getElementById('login-email').value;
        let currentPassword = document.getElementById('login-password').value;
        try{
          await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
          await auth.signInWithEmailAndPassword(currentEmail, currentPassword);
          console.log(auth.currentUser);
        }catch (error){
          console.error(error.message);
          alert(error.message);
        }
        setIsLoggingIn(false);
    }else{
      console.error("Already logging in");
      alert("Already logging in!");
    }
  }

  const handleLogout = async (isAutoLogout=false) =>{
    try{
      onlineTimeRef.child(auth.currentUser.uid).off('value');
      firebase.database().ref('.info/connected').off('value');
      onlineTimeRef.child(auth.currentUser.uid).onDisconnect().cancel();
      if (!isAutoLogout) await onlineTimeRef.child(auth.currentUser.uid).remove();
      await auth.signOut();
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

  //Callback for handling form submission of auto logout notice modal
  const autoLogoutFormHandler = (e)=>{
    e.preventDefault();
    const modalContainerDiv = e.target.parentElement.parentElement;
    if (modalContainerDiv.id === "auto-logout-modal") modalContainerDiv.classList.remove("opened");
    else console.error("ERROR: Parent Element is not a logout modal!");
  }

  //Callback for handling form submission of transfer request notice modal
  const transferRequestNoticeFormHandler = (e)=>{
    e.preventDefault();
    const modalContainerDiv = e.target.parentElement.parentElement;
    if (modalContainerDiv.id === "transferrequest-notice-modal") modalContainerDiv.classList.remove("opened");
    else console.error("ERROR: Parent Element is not a transfer request notice modal!");
  }

  //Function for generating short ID
  const generateId = (length)=>{
    let tmpId = "";
    let charType = 0;
    let numOfChar = 26;
    let asciiStart = 97
    for (let i=0; i<length; i++){
      charType = Math.floor(Math.random() * 3);
      numOfChar = (charType === 0 || charType === 1?26:10);
      asciiStart = (charType === 0?97:(charType === 1?65:48));
      tmpId = tmpId + String.fromCharCode(Math.floor(Math.random() * numOfChar) + asciiStart);
    }
    return tmpId;
  };

  useEffect(()=>{
    const authChangeListener = firebase.auth().onAuthStateChanged((user)=>{
      if (user){
        console.log("User is logged in!");
        setCurrentUser(user);
        firebase.database().ref('.info/connected').off('value');
        firebase.database().ref('.info/connected').on('value', handleConnectionChanges);
      }else{
        sessionStorage.removeItem('heartlinehk-disconnected');
        setCurrentUser(null);
      }
    });
    return authChangeListener;
  });

  useEffect(()=>{
    const setViewHeight = ()=>{
      let vh = window.innerHeight * 0.01;
      console.log(vh);
      console.log(window.innerHeight);
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    sessionStorage.setItem('heartlinehk-agentUid', generateId(12));
    setViewHeight();
    window.addEventListener('resize', setViewHeight);
  }, []);

  return (
    <Router>
      <div className="App" style={{width: "100vw", minHeight: "calc(100 * var(--vh, 1vh))", position: "relative", backgroundColor: "rgba(0,0,0,0.05)", display: "flex", flexDirection:"row", overflow: "hidden"}}>
        <NoticeModal modalId={"auto-logout-modal"} noticeText={"由於此帳號已於另一裝置/視窗上登入，此視窗將會登出帳號。"} formSubmitHandler={autoLogoutFormHandler}></NoticeModal>
        {!currentUser && <Login handleLogin={handleLogin}/>}
        {currentUser && 
          <>
          {false && <NoticeModal modalId={"transferrequest-notice-modal"} noticeText={"你收到一個接手對話的邀請，請進入「聊天室」接受或拒絕。"} formSubmitHandler={transferRequestNoticeFormHandler}></NoticeModal>}
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
