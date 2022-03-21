import donation from '../img/Pages/3 支持我們/b_192x192.png';
import partner from '../img/Pages/3 支持我們/c_192x192.png';
import volunteer from '../img/Pages/3 支持我們/d_192x192.png';
import Footer from '../components/Footer.js';
import '../styles/SupportUs.css';
import {Link} from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/functions';

const SupportUs = (props) => {

    const donationFormRef = useRef();
    const [isDonationExpanded, setIsDonationExpanded] = useState(false);
    const [isMonthlyDonation, setIsMonthlyDonation] = useState(false); 


    const variableAmountFocused = (e)=>{
      document.querySelector(".support-methods-container .donation-container .donation-amount-variable-container input[type='radio']").checked = true;  
    };

    const donationFormHandler = async (e)=>{
        e.preventDefault();
        const amountRadioBtns = donationFormRef.current.querySelectorAll("input[type='radio'][name='donation-amount']");
        const typeRadioBtns = donationFormRef.current.querySelectorAll("input[type='radio'][name='donation-type']");
        let amount = -1;
        let type = "";
        typeRadioBtns.forEach((radio)=>{
            if (radio.checked) type=radio.value;
        });
        amountRadioBtns.forEach((radio)=>{
            if (radio.checked){
                amount = (radio.value != "variable"?radio.value:donationFormRef.current.querySelector("#donation-amount-variable").value);
            }
        });
        try{
            const createCheckoutSession = firebase.functions().httpsCallable('createCheckoutSession');
            let result = await createCheckoutSession({
                'donationType': type,
                'donationAmount': amount
            });
            window.location = result.data.redirectUrl;
        }catch(error){
            console.error("ERROR: "+error.message);

        }
    };

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
                            <Link to="/donation" className="donation-expand-btn">按此捐款</Link>
                            {false && <a className="donation-expand-btn" onClick={()=>{setIsDonationExpanded(!isDonationExpanded)}}>按此捐款</a>}
                        </div>
                    </div>                    
                </li>
                {false && 
                <li className="donation-container">
                    <form ref={donationFormRef} onSubmit={donationFormHandler}>
                        <input type="radio" name="donation-type" id="donation-type-one-time" defaultChecked={true} value="one-time" required onChange={()=>setIsMonthlyDonation(false)}/>
                        <label htmlFor="donation-type-one-time">單次捐款</label>
                        <input type="radio" name="donation-type" id="donation-type-monthly" defaultChecked={false} value="monthly" onClick={()=>setIsMonthlyDonation(true)}/>
                        <label htmlFor="donation-type-monthly">每月捐款</label>
                        <div className="amount-container">
                            <input type="radio" name="donation-amount" id="donation-amount-50hkd" value="50" defaultChecked={true} required/>
                            <label htmlFor="donation-amount-50hkd">HKD$50</label>
                            <input type="radio" name="donation-amount" id="donation-amount-100hkd" value="100" defaultChecked={false}/>
                            <label htmlFor="donation-amount-100hkd">HKD$100</label>
                            <input type="radio" name="donation-amount" id="donation-amount-200hkd" value="200" defaultChecked={false}/>
                            <label htmlFor="donation-amount-200hkd">HKD$200</label>
                            <input type="radio" name="donation-amount" id="donation-amount-500hkd" value="500" defaultChecked={false}/>
                            <label htmlFor="donation-amount-500hkd">HKD$500</label>
                            {!isMonthlyDonation && <>
                                <div className="donation-amount-variable-container">
                                    <input type="radio" name="donation-amount" id="donation-amount-variable-radio" value="variable" defaultChecked={false}/>
                                    <label htmlFor="donation-amount-variable-radio">HKD$</label>
                                    <input type="number" name="donation-amount-variable" id="donation-amount-variable" defaultValue={50} min={50} step={0.5} onFocus={variableAmountFocused}/>
                                </div>
                            </>}
                        </div>
                        <input type="submit" value="立即捐款" />
                    </form>
                </li>
                }
                
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
        </div>
    );
}

export default SupportUs;