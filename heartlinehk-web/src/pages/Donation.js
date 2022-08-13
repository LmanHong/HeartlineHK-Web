import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCcStripe } from '@fortawesome/free-brands-svg-icons';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Loading from '../components/Loading.js';
import Footer from '../components/Footer.js';
import DonationCSS from '../styles/Donation.module.css';

const DONATION_TYPE = {
    ONE_TIME: 'one-time',
    MONTHLY: 'monthly'
};

const Donation = ()=>{

    const [donationType, setDonationType] = useState(DONATION_TYPE.MONTHLY);
    const [isVariableAmountRequired, setIsVariableAmountRequired] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const createCheckoutSession = httpsCallable(getFunctions(), 'createCheckoutSession');

    const handleDonationForm = async (e)=>{
        e.preventDefault();
        const donationTypeValue = e.target.querySelector('input[name="donation-type"]:checked').value;
        const donationAmountValue = e.target.querySelector('input[name="donation-amount"]:checked').value;

        if (createCheckoutSession){
            try{
                setIsLoading(true);
                let result = await createCheckoutSession({
                    donationType: donationTypeValue,
                    donationAmount: (donationAmountValue === 'variable'?e.target.querySelector('#variable-amount-input').value:donationAmountValue)
                });
                window.location = result.data.redirectUrl;
            }catch(error){
                console.error("ERROR: "+error.message);
                alert(error.message);
            }
            setIsLoading(false);
        }

    }

    return (
    <>
        <form className={DonationCSS.donation} onSubmit={handleDonationForm}>
            {isLoading && <Loading/>}
            <div className={DonationCSS.mainText}>
                <h1>捐款</h1>
                <p>HeartlineHK是一個非牟利的慈善團體，你的捐款將全數用於義工招募和舉辦義工培訓工作坊，以及推廣精神健康。支持我們，一同為改善年輕人的心理健康出一分力吧！</p>
            </div>
            <div className={DonationCSS.donationTypeContainer}>
                <input type="radio" name="donation-type" id="donation-type-monthly" value={DONATION_TYPE.MONTHLY} defaultChecked={true} required onClick={(e)=>setDonationType(DONATION_TYPE.MONTHLY)}/>
                <label htmlFor="donation-type-monthly">每月定期捐款</label>
                <input type="radio" name="donation-type" id="donation-type-one-time" value={DONATION_TYPE.ONE_TIME} defaultChecked={false} onClick={(e)=>setDonationType(DONATION_TYPE.ONE_TIME)}/>
                <label htmlFor="donation-type-one-time">一次性捐款</label>
            </div>
            <div className={DonationCSS.amountContainer}>
                <h1>金額</h1>
                <input type="radio" name="donation-amount" id="donation-amount-50" value="50" defaultChecked={true} required onClick={(e)=>{if (document.querySelector('#variable-amount-input') !== null) document.querySelector('#variable-amount-input').value = ""; setIsVariableAmountRequired(false)}}/>
                <label htmlFor="donation-amount-50">HKD<span>50</span></label>
                <input type="radio" name="donation-amount" id="donation-amount-100" value="100" defaultChecked={false} onClick={(e)=>{if (document.querySelector('#variable-amount-input') !== null) document.querySelector('#variable-amount-input').value = ""; setIsVariableAmountRequired(false)}}/>
                <label htmlFor="donation-amount-100">HKD<span>100</span></label>
                <input type="radio" name="donation-amount" id="donation-amount-200" value="200" defaultChecked={false} onClick={(e)=>{if (document.querySelector('#variable-amount-input') !== null) document.querySelector('#variable-amount-input').value = ""; setIsVariableAmountRequired(false)}}/>
                <label htmlFor="donation-amount-200">HKD<span>200</span></label>
                {donationType === DONATION_TYPE.MONTHLY && <>
                    <input type="radio" name="donation-amount" id="donation-amount-500" value="500" defaultChecked={false} onClick={(e)=>{if (document.querySelector('#variable-amount-input') !== null) document.querySelector('#variable-amount-input').value = ""; setIsVariableAmountRequired(false)}}/>
                    <label htmlFor="donation-amount-500">HKD<span>500</span></label> 
                </>}
                {donationType === DONATION_TYPE.ONE_TIME && <>
                    <input type="radio" name="donation-amount" id="donation-amount-variable" value="variable" defaultChecked={false} onClick={(e)=>document.querySelector('#variable-amount-input').focus()}/>
                    <label htmlFor="donation-amount-variable">HKD
                        <input type="number" name="variable-amount" id="variable-amount-input" min={30} step={0.5} placeholder="(自定)" required={isVariableAmountRequired} onFocus={()=>{document.querySelector('#donation-amount-variable').checked = true; setIsVariableAmountRequired(true)}}/>
                        <label htmlFor="variable-amount-input">最少HKD30</label>
                    </label>
                </>}
            </div>
            <button type="submit" className={DonationCSS.payment}><FontAwesomeIcon icon={faCcStripe}/> 網上付款</button>
        </form>
    </>
    );
}

export default Donation;