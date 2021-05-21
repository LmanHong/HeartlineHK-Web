import NavBar from './components/NavBar.js';
import SideMenu from './components/SideMenu.js';
import Home from './pages/Home.js';
import AboutUs from './pages/AboutUs.js';
import SupportUs from './pages/SupportUs.js';
import VolunteerRecruit from './pages/VolunteerRecruit.js';
import RelatedServices from './pages/RelatedServices.js';
import FAQ from './pages/FAQ.js';
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
          <Route exact path="/support-us">
            <SupportUs/>
          </Route>
          <Route exact path="/volunteer-recruit">
            <VolunteerRecruit/>
          </Route>
          <Route exact path="/faq">
            <FAQ/>
          </Route>
          <Route exact path="/related-services">
            <RelatedServices/>
          </Route>
        </Switch>
      </div>
    </Router>

  );
}

export default App;
