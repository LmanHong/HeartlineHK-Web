import Footer from '../components/Footer.js';
import '../styles/RelatedServices.css';

const RelatedServices = () =>{
    return (
        <div className="related-services">
            <div className="main-text">
                <h1>相關服務</h1>
                <p>以下是本地其他線上精神健康支援服務，此名單未能盡錄所有服務，有需要人士宜自行搜尋和選擇適合自己的服務。
                    資料僅供參考，不構成任何建議或推薦。
                </p>
            </div>
            <ul className="services-container">
                <li className="service">
                    <h1>在線文字輔導</h1>
                    <ul>
                        <li>Open Up <br /> 
                            對象：11-35歲青少年及青年
                        </li>
                        <li>輔負得正 <br />
                            對象：年齡不限，歡迎任何受情緒困擾人士使用。
                        </li>
                        <li>夜貓Online <br />
                            對象：24歲以下的青少年
                        </li>
                        <li>uTouch (uTouch Portal/ Whatsapp) <br /> 
                            對象：青少年
                        </li>
                        <li>CHAT窿 <br />
                            對象：需要情緒支援及任何人士 (防止自殺)
                        </li>
                        <li>一微^_^米網上青年支援隊 <br />
                            對象：青少年
                        </li>
                    </ul>
                </li>
                <li className="service">
                    <h1>熱線服務</h1>
                    <ul>
                        <li>香港輔導記心理學會免費輔導熱線 <br />
                            對象：學生、家長及其他需要危機介入服務的人士
                        </li>
                        <li>香港撒瑪利亞防止自殺會 <br />
                            24小時服務；23892222
                        </li>
                        <li>明愛向晴軒 <br />
                            24小時提供家庭危機熱線服務；18288
                        </li>
                        <li>利民會《即時通》精神健康守護同行計劃 <br />  
                            24小時服務；35122626
                        </li>
                        <li>醫院管理局精神健康專線 <br />
                            24小時服務；24667350
                        </li>
                    </ul>
                </li>
                <li className="service">
                    <h1>電郵輔導</h1>
                    <ul>
                        <li>明愛連線Teen地 <br />
                            對象：青少年
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
    );
}

export default RelatedServices;