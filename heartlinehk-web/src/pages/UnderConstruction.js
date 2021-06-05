import Footer from '../components/Footer.js';
import '../styles/UnderConstruction.css';

const UnderConstruction = () =>{
    return(
        <div className="under-construction">
            <div className="main-text">
                <i className="fa fa-exclamation-circle"></i>
                <p>我們正在積極籌備、招募義工，預期會於九月正式推出服務。</p>
            </div>

            <Footer></Footer>
        </div>
    );
}

export default UnderConstruction;