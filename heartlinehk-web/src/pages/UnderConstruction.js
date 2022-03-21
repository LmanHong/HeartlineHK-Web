import Footer from '../components/Footer.js';
import '../styles/UnderConstruction.css';

const UnderConstruction = () =>{
    return(
        <div className="under-construction">
            <div className="main-text">
                <i className="fa fa-exclamation-circle"></i>
                <p>我們正在積極籌備捐款事宜，敬請期待。</p>
            </div>
        </div>
    );
}

export default UnderConstruction;