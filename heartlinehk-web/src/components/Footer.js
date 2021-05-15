import "../styles/Footer.css";

const Footer = () =>{

    const scrollToTop = () =>{
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }

    return (
        <div className="footer-container">
            <a href="#" className="back-top-btn fa fa-chevron-up" onClick={scrollToTop}></a>
            <p className="sponsor">捐助機構︰International Chamber of Sustainable Development</p>
            <a href="#" className="terms-and-conditions">條款和條件</a>
            <p className="copyright">&copy; 2021 Heartline HK</p>
            <a href="#" className="footer-item fa fa-linkedin-square"></a>
            <a href="#" className="footer-item fa fa-facebook-square"></a>
            <a href="#" className="footer-item fa fa-instagram"></a>
            <a href="tel:95074873" className="telephone">熱線:95074873</a>
        </div>
    );
}

export default Footer;