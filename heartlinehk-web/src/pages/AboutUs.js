import logo from "../img/Pages/2 關於我們/b.PNG";
import anonymity from "../img/Pages/2 關於我們/c.PNG";
import confidentiality from "../img/Pages/2 關於我們/e.PNG";
import nonjudgemental from "../img/Pages/2 關於我們/h.PNG";
import nondirective from "../img/Pages/2 關於我們/j.PNG";
import Footer from "../components/Footer.js";
import "../styles/AboutUs.css";
import { useEffect } from "react";

const AboutUs = () =>{

    useEffect(()=>{
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }, []);

    return (
        <div className="about-us">
            <div className="main-text">
                <img src={logo} alt={logo} className="logo" />
                <h1>關於我們</h1>
                <p>HeartlineHK由一群大學生發起，希望爲受情緒困擾的香港青少年提供一個傾訴的空間。我們的義工受過專業訓練，會在每晚7pm至翌日7am致力聆聽和支援朋輩。我們相信有效的聆聽和對話能疏導求助者的情緒，讓對方感到被理解和被關懷，從而避免負面情緒的積壓。讓我們合力為心理健康帶來正面的幫助！</p>
            </div>

            <div className="principles-container">
                <h1 className="sub-title">四大原則</h1>
                <ul className="principles-list">
                    <li className="principle">
                        <img src={anonymity} alt={anonymity} />
                        <p className="name" style={{backgroundColor: "rgba(152, 209, 196, 0.3)"}} >匿名 (anonymity)</p>
                        <p className="description">求助者無需提供任何個人資料，以確保隱私。</p>
                    </li>
                    <li className="principle">
                        <img src={confidentiality} alt={confidentiality} />
                        <p className="name" style={{backgroundColor: "rgba(245, 211, 190, 0.8)"}}>保密 (confidentiality)</p>
                        <p className="description">對話内容絕對保密，亦不會被留底。</p>
                    </li>
                    <li className="principle">
                        <img src={nonjudgemental} alt={nonjudgemental} />
                        <p className="name" style={{backgroundColor: "rgba(223, 229, 237, 0.8)"}}>不批判 (non judgmental)</p>
                        <p className="description">我們的角色是聆聽者，對話期間不會説教或批判求助者。</p>
                    </li>
                    <li className="principle">
                        <img src={nondirective} alt={nondirective} />
                        <p className="name" style={{backgroundColor: "rgba(252, 237, 187, 0.8)"}}>非指導性 (non directive)</p>
                        <p className="description">我們希望能陪伴求助者尋找解決方法，而不會直接給予建議。</p>
                    </li>
                </ul>
            </div>

            <div className="how-to-use-container">
                <h1 className="sub-title">如何使用服務</h1>
                <ul className="use-cases-list">
                    <li>情緒低落？</li>
                    <li>需要陪伴？</li>
                    <li>想找人傾訴？</li>
                </ul>
                <div className="methods-container">
                    <p>你可以選擇</p>
                    <ul className="methods-list">
                        <li><span>按右上角的按鈕</span>和我們的義工對話或</li>
                        <li>致電我們的<span>熱線</span>號碼(xxxxxxxx)</li>
                    </ul>
                    <p>如果想知道更多心理學資訊和了解我們的最新消息，請關注我們的社交平台。(<a href="https://www.facebook.com/heartlinehongkong">Facebook</a>/<a href="https://www.instagram.com/heartlinehk/">Instagram</a>: heartlinehk)</p>
                </div>
            </div>

            <Footer></Footer>
        </div>
    );
}

export default AboutUs;