import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import ConfirmModal from "./components/ConfirmModal.js";
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

  const onlineTimeRef = firebase.database().ref('online_time');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [auth, setAuth] = useState(firebase.auth());

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
  
          //const onlineTime = (await onlineTimeRef.child(auth.currentUser.uid).once('value')).val();
          //if (onlineTime != null){
          //  await handleLogout();
          //  throw new Error("User already signed in elsewhere");
          //}else{
          //  await onlineTimeRef.child(auth.currentUser.uid).set(firebase.database.ServerValue.TIMESTAMP);

          //}
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

  const handleLogout = async (e) =>{
    try{
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

  useEffect(()=>{
    const authChangeListener = firebase.auth().onAuthStateChanged((user)=>{
      if (user) setCurrentUser(user);
      else setCurrentUser(null);
    });
    return authChangeListener;
  });

  return (
    <Router>
      <div className="App" style={{width: "100vw", minHeight: "100vh", position: "relative", backgroundColor: "rgba(0,0,0,0.05)", display: "flex", flexDirection:"row", overflow: "hidden"}}>
        {!currentUser && <Login handleLogin={handleLogin}/>}
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
