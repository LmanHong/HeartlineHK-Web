import { BrowserRouter, Switch, Route } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { ref, getDatabase, onDisconnect, serverTimestamp, increment, set } from "firebase/database";
import { browserSessionPersistence, getAuth, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useCallback, useEffect, lazy, Suspense } from "react";
import { useObjectVal } from "react-firebase-hooks/database";

const Login = lazy(() => import('./pages/Login'));
const Supervisor = lazy(() => import('./pages/new/NewSupervisor'));
const Chatroom = lazy(() => import('./pages/Chatroom'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProfileUpdate = lazy(() => import('./pages/ProfileUpdate'));
const ConfirmModal = lazy(() => import('./components/ConfirmModal'));
const NavBar = lazy(() => import('./components/NavBar'));

const App = () => {
    const firebaseAuth = getAuth();
    const firebaseDB = getDatabase();
    const [currentUser, userLoading] = useAuthState(firebaseAuth);
    const [isConnected, connectedLoading] = useObjectVal(ref(firebaseDB, '.info/connected'));

    const handleLogin = useCallback(async (e) => {
        e.preventDefault();
        try{
            const currentEmail = e.target.querySelector('#login-email').value;
            const currentPassword = e.target.querySelector('#login-password').value;
            await setPersistence(firebaseAuth, browserSessionPersistence);
            await signInWithEmailAndPassword(firebaseAuth, currentEmail, currentPassword);
        }catch(error){
            console.error(error.message);
            alert(error.message);
        }
    }, [firebaseAuth, currentUser]);

    const handleLogout = useCallback(async () => {
        try{
            await set(ref(firebaseDB, `online_status/${currentUser.uid}`), {
                'time': serverTimestamp(),
                'deviceCount': increment(-1)
            });
            await signOut(firebaseAuth);
        }catch(error){
            console.error(error.message);
            alert(error.message);
        }
    }, [firebaseAuth, currentUser])

    const logoutFormHandler = useCallback((e) => {
        e.preventDefault();
        const modalContainerDiv = e.target.parentElement.parentElement;
    if (modalContainerDiv.id === "logout-modal"){
        const isConfirmed = (e.target.className === "confirm-btn");
        if (isConfirmed) handleLogout();
        modalContainerDiv.classList.remove("opened");
    }else console.error("ERROR: Parent Element is not a logout modal!");
    }, [handleLogout]);

    useEffect(() => {
        if (!connectedLoading && currentUser){
            if (isConnected) {
                set(ref(firebaseDB, `online_status/${currentUser.uid}`), {
                    'time': serverTimestamp(),
                    'deviceCount': increment(1)
                });
                onDisconnect(ref(firebaseDB, `online_status/${currentUser.uid}`)).set({
                    'time': serverTimestamp(),
                    'deviceCount': increment(-1)
                });
            }
        }
    }, [isConnected, connectedLoading, currentUser]);

    return (
        <Suspense fallback={<p>...</p>}>
            <BrowserRouter>
                <div className="App" style={{width: "100vw", minHeight: "calc(100 * var(--vh, 1vh))", position: "relative", backgroundColor: "rgba(0,0,0,0.05)", display: "flex", flexDirection:"row", overflow: "hidden"}}>
                    {!userLoading && !currentUser && 
                        <Switch>
                            <Route path="/">
                                <Login handleLogin={handleLogin} />
                            </Route>
                        </Switch>
                    }
                    {!userLoading && currentUser &&
                    <>
                        <ConfirmModal modalId={"logout-modal"} confirmText={"你確定要登出嗎？"} formSubmitHandler={logoutFormHandler} />
                        <NavBar handleLogout={()=>{document.getElementById("logout-modal").classList.add('opened')}}/>
                        <Switch>
                            <Route exact path="/chatroom">
                                <Chatroom currentUser={currentUser} />
                            </Route>
                            <Route exact path="/supervisor">
                                <Supervisor />
                            </Route>
                            <Route exact path="/profile-update">
                                <ProfileUpdate currentUser={currentUser} />
                            </Route>
                            <Route exact path="/">
                                <Dashboard currentUser={currentUser} />
                            </Route>
                            <Route path="*">
                                <p>No Match!</p>
                            </Route>
                        </Switch>
                    </>
                    }
                </div>
            </BrowserRouter>
        </Suspense>
    );
}

export default App;