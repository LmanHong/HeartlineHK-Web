import "../styles/Footer.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedin, faFacebookSquare, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faChevronUp } from "@fortawesome/free-solid-svg-icons";

const Footer = () =>{

    const scrollToTop = () =>{
        let topNavBar = document.querySelector('nav.nav-container');
        topNavBar.scrollIntoView({behavior: "smooth"});
    }

    return (
        <footer className="footer-container">
            <a className="back-top-btn" onClick={scrollToTop}><FontAwesomeIcon icon={faChevronUp}/></a>
            <div className="left-column">
                <div className="sponsor">
                    <p>捐助機構︰</p>
                    <p><a href="https://www.icsd-global.org">International Chamber of Sustainable Development</a></p>
                    <p>CUHK Psy-connection Award</p>
                </div>
                <a href="#" className="terms-and-conditions">條款和條件</a>
                <p className="copyright">&copy; 2021 Heartline HK</p>
            </div>
            <div className="right-column">
                <a href="https://www.linkedin.com/company/mentalsos/" className="footer-item"><FontAwesomeIcon icon={faLinkedin}/></a>
                <a href="https://www.facebook.com/heartlinehongkong" className="footer-item"><FontAwesomeIcon icon={faFacebookSquare}/></a>
                <a href="https://www.instagram.com/heartlinehk/" className="footer-item"><FontAwesomeIcon icon={faInstagram}/></a>
                <a href="tel:95074873" className="footer-item telephone" style={{display: "none"}}>熱線:95074873</a>
            </div>
        </footer>
    );
}

export default Footer;