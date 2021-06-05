import "../styles/Footer.css";

const Footer = () =>{

    const scrollToTop = () =>{
        let topNavBar = document.querySelector('nav');
        topNavBar.scrollIntoView({behavior: "smooth"});
    }

    return (
        <div className="footer-container">
            <a className="back-top-btn fa fa-chevron-up" onClick={scrollToTop}></a>
            <div className="left-column">
                <div className="sponsor">
                    <p>捐助機構︰</p>
                    <p>International Chamber of Sustainable Development</p>
                    <p>CUHK Psy-connection Award</p>
                </div>
                <a href="#" className="terms-and-conditions">條款和條件</a>
                <p className="copyright">&copy; 2021 Heartline HK</p>
            </div>
            <div className="right-column">
                <a href="https://www.linkedin.com/company/mentalsos/" className="footer-item fa fa-linkedin-square"></a>
                <a href="https://www.facebook.com/heartlinehongkong" className="footer-item fa fa-facebook-square"></a>
                <a href="https://www.instagram.com/heartlinehk/" className="footer-item fa fa-instagram"></a>
                <a href="tel:95074873" className="footer-item telephone" style={{display: "none"}}>熱線:95074873</a>
            </div>
        </div>
    );
}

export default Footer;