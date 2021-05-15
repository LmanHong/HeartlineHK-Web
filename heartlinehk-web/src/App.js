import NavBar from './components/NavBar.js';
import SideMenu from './components/SideMenu.js';
import Home from './pages/Home.js';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App" style={{position: "relative"}}>
        <NavBar/>
        <SideMenu/>
        <Switch>
          <Route path="/">
            <Home/>
          </Route>
        </Switch>
      </div>
    </Router>

  );
}

export default App;
