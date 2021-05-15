import Footer from "../components/Footer.js";
import "../styles/Home.css";

const Home = () =>{
    return (
        <div className="home">
            <div className="carousel">
                <div className="carousel-track-container">
                    <ul className="carousel-track">
                        <li className="carousel-slide"></li>
                        <li className="carousel-slide"></li>
                        <li className="carousel-slide"></li>
                    </ul>
                </div>
                <div className="carousel-nav">
                    <button className="carousel-indicator"></button>
                    <button className="carousel-indicator"></button>
                    <button className="carousel-indicator"></button>
                </div>
            </div>
            <Footer></Footer>
        </div>
    );
}

export default Home;