import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import NavBar from "./components/NavBar.js";
import Chatroom from "./pages/Chatroom.js";
import Dashboard from "./pages/Dashboard.js";
import Login from "./pages/Login.js";
import firebase from "firebase/app";
import "firebase/auth";

function App() {

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

  const handleLogout = async (e) =>{
    try{
      await auth.signOut();
      console.log("Signed out!");
    }catch(error){
      console.error(error.message);
      alert(error.message);
    }
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
          <NavBar currentUser={currentUser} handleLogout={handleLogout}/>
          <Switch>
            <Route exact path="/chatroom">
              <Chatroom currentUser={currentUser}/>
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
