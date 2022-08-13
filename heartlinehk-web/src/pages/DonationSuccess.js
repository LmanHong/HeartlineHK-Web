import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Footer from '../components/Footer.js';
import SuccessCSS from '../styles/DonationSuccess.module.css';

const DonationSuccess = ()=>{

    // const { search } = useLocation();
    // const [referenceId, setReferenceId] = useState(null);
    // useEffect(()=>{
    //     const query = search.split('reference_id=');
    //     console.log(query);
    //     if (query.length === 2) setReferenceId(query[1]);
    // }, []);

    return (
        <div className={SuccessCSS.donationSuccess}>
            <h2>多謝你的支持！</h2>
            <p>我們會繼續努力提供服務，<br/>關注年輕人的心理健康。</p>
            <div className={SuccessCSS.backdrop}></div>
            <iframe src="https://giphy.com/embed/WnIu6vAWt5ul3EVcUE" frameBorder="0" className="giphy-embed" allowFullScreen></iframe>
            <Link to="/">返回主頁</Link>
        </div>
    );
};

export default DonationSuccess;