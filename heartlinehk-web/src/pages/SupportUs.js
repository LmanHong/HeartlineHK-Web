import donation from '../img/Pages/3 支持我們/b_192x192.png';
import partner from '../img/Pages/3 支持我們/c_192x192.png';
import volunteer from '../img/Pages/3 支持我們/d_192x192.png';
import Footer from '../components/Footer.js';
import '../styles/SupportUs.css';
import {Link} from 'react-router-dom';
import { useEffect } from 'react';

const SupportUs = (props) => {

    useEffect(()=>{
        let hash = window.location.hash;
        console.log(hash);
        if (hash) document.getElementById(hash.substr(1)).scrollIntoView({behavior: "smooth"});
        else {
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        }
    }, []);

    return (
        <div className="support-us">
            <div className="main-text">
                <h1>支持我們</h1>
                <p>HeartlineHK是一個非牟利的慈善團體，需要社會各界人士的支持，以維持及發展服務。我們誠邀你支持本會的工作，讓更多受情緒困擾的年輕人得到適切的幫助。</p>
            </div>
            <ul className="support-methods-container">
                <li className="support-method">
                    <a id="donation"></a>
                    <h1 className="sub-title">捐款</h1>
                    <img src={donation} alt={donation} />
                    <div className="support-detail">
                        <div className="detail-left">
                            <p>所獲的捐款將會用於以下項目:</p>
                            <ol type="1">
                                <li>義工招募和舉辦義工培訓工作坊</li>
                                <li>推廣精神健康項目</li>
                            </ol>
                        </div>
                        <div className="detail-right">
                            <p>捐款金額不論多少，都可以讓不同的人受惠。</p>
                            <p>捐款方法：</p>
                            <ul>
                                <li>
                                    <p>如果你有意支持我們機構，請以電郵查詢捐款詳情。</p>
                                </li>
                                <li style={{display: "none"}}>
                                    <p><span>1. 以銀行轉帳形式捐款</span></p>
                                    <p>銀行名稱：</p>
                                    <p>戶口名稱：</p>
                                </li>
                                <li style={{display: "none"}}>
                                    <p><span>2. 把劃線支票抬頭及郵寄至</span></p>
                                    <p>Call centre address</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </li>
                <li className="support-method">
                    <a id="partner"/>
                    <h1 className="sub-title">合作夥伴</h1>
                    <img src={partner} alt={partner} />
                    <div className="support-detail">
                        <div className="detail-left">
                            <p>我們積極尋求</p>
                            <ol type="1">
                                <li>相關專業人士或志願機構的合作</li>
                                <li>商業或慈善機構的捐助</li>
                            </ol>
                        </div>
                        <div className="detail-right">
                            <p>若你和你的團隊也關注精神健康，有意為年輕人的心理健康帶來正面的幫助，我們誠邀你和你的團隊成為HeartlineHK的合作夥伴。歡迎以電郵聯絡我們：<a href="mailto:heartlinehongkong@gmail.com">Heartlinehongkong@gmail.com</a></p>
                        </div>
                    </div>
                </li>
                <li className="support-method">
                    <h1 className="sub-title">義工招募</h1>
                    <img src={volunteer} alt={volunteer} />
                    <div className="support-detail">
                        <div className="detail-left">
                            <p>成為我們的義工</p>
                            <p><span>以同行者的角色傾聽服務使用者心聲，</span></p>
                            <p><span>為改善年輕人情緒健康出一分力</span></p>
                        </div>
                        <div className="detail-right">
                            <p>義工是我們服務不可或缺的一部分，想知道更多詳情，請按以下連結。</p>
                            <Link to="/volunteer-recruit" className="volunteer-recruit-btn">了解更多</Link>
                        </div>
                    </div>
                </li>
            </ul>
            <p className="contact-text">
                我們衷心感謝你對HeartlineHK的支持，因著你的支持，我們得以提供更完善的情緒支援服務。<br/>
                如有任何查詢，歡迎電郵至<a href="mailto:heartlinehongkong@gmail.com">heartlinehongkong@gmail.com</a>與我們聯絡。
            </p>

            <Footer></Footer>
        </div>
    );
}

export default SupportUs;