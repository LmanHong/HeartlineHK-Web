import NavBar from './components/NavBar.js';
import SideMenu from './components/SideMenu.js';
import Footer from './components/Footer.js';
import Home from './pages/Home.js';
import AboutUs from './pages/AboutUs.js';
import SupportUs from './pages/SupportUs.js';
import Donation from './pages/Donation.js';
import DonationSuccess from './pages/DonationSuccess.js';
import VolunteerRecruit from './pages/VolunteerRecruit.js';
import RelatedServices from './pages/RelatedServices.js';
import FAQ from './pages/FAQ.js';
import LatestFeed from './pages/LatestFeed.js';
import Chatroom from "./pages/Chatroom.js";
import UnderConstruction from './pages/UnderConstruction.js';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import EffectiveCommunication from './pages/EffectiveCommunication.js';

function App() {

  return (
    <Router>
      <div className="App" style={{position: "relative", minHeight:"100vh"}}>
        <NavBar menuContentClass={"menu-content"}/>
        <SideMenu/>
        <Switch>
          <Route exact path="/about-us">
            <AboutUs/>
          </Route>
          <Route exact path="/support-us">
            <SupportUs/>
          </Route>
          <Route exact path="/donation">
            <UnderConstruction />
          </Route>
          <Route exact path="/donation-success">
            <UnderConstruction />
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
          <Route exact path="/latest-feed">
            <LatestFeed/>
          </Route>
          <Route exact path="/chatroom">
            <Chatroom/>
          </Route>
          <Route exact path="/under-construction">
            <UnderConstruction/>
          </Route>
          <Route exact path="/effective-communication">
            <EffectiveCommunication />
          </Route>
          <Route path="/">
            <Home/>
          </Route>
        </Switch>
        <Footer/>
      </div>
    </Router>

  );
}

export default App;
