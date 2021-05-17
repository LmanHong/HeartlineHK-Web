import NavBar from './components/NavBar.js';
import SideMenu from './components/SideMenu.js';
import Home from './pages/Home.js';
import AboutUs from './pages/AboutUs.js';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App" style={{position: "relative", minHeight:"100vh"}}>
        <NavBar/>
        <SideMenu/>
        <Switch>
          <Route exact path="/">
            <Home/>
          </Route>
          <Route exact path="/about-us">
            <AboutUs/>
          </Route>
        </Switch>
      </div>
    </Router>

  );
}

export default App;
