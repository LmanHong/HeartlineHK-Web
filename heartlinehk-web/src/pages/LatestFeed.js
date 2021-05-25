import Footer from '../components/Footer.js';
import '../styles/LatestFeed.css';
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/storage';
import { useEffect, useRef, useState } from 'react';

const LatestFeed = () => {

    const MONTH_NAME = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const [database, setDatabase] = useState(firebase.database());
    const [posts, setPosts] = useState([]);
    const [monthSelect, setMonthSelect] = useState([]);
    const [yearSelect, setYearSelect] = useState([]);

    useEffect(()=>{
        database.ref('ig_posts').once('value').then(async (snapshot)=>{
            console.log(snapshot.val());
            
            let availableYears = [];
            let availableMonths = [];
            for (var index in snapshot.val()){
                let date = new Date(snapshot.val()[index].dateTime);
                if (!availableMonths.includes(date.getMonth())) availableMonths.push(date.getMonth());
                if (!availableYears.includes(date.getFullYear())) availableYears.push(date.getFullYear());
            }
            availableMonths.sort((a,b)=>a-b);
            availableYears.sort((a,b)=>a-b);
            setPosts(snapshot.val());
            setMonthSelect(availableMonths);
            setYearSelect(availableYears);
        });

    }, []);

    const selectPostsByDate = (e) =>{
        let changed = e.target.name;

        let monthSelected = document.querySelector('#month-select').value;
        let yearSelected = document.querySelector('#year-select').value;
        let postsRef = document.querySelectorAll('.ig-post');

        let monthsInYearSelected = [];
        let yearsInMonthSelected = [];
        postsRef.forEach((post, index) =>{
            let date = new Date(post.lastElementChild.dateTime);
            if ((yearSelected == "All" || yearSelected == date.getFullYear()) && !monthsInYearSelected.includes(date.getMonth())) monthsInYearSelected.push(date.getMonth());
            if ((monthSelected == "All" || monthSelected == date.getMonth()) && !yearsInMonthSelected.includes(date.getFullYear())) yearsInMonthSelected.push(date.getFullYear());
            if ((monthSelected == "All" || monthSelected == date.getMonth()) && (yearSelected == "All" || yearSelected == date.getFullYear())){
                post.style.display = "inline-block";
            }else{
                post.style.display = "none";
            }
        });
        monthsInYearSelected.sort((a,b)=>a-b);
        yearsInMonthSelected.sort((a,b)=>a-b);
        setMonthSelect(monthsInYearSelected);
        setYearSelect(yearsInMonthSelected);
    }

    return (
        <div className="latest-feed">
            <div className="main-text">
                <h1>最新動態</h1>
                <p>如果想知道更加多心理學資訊、成為更好的傾訴對象、或者想投稿分享心事，就跟蹤我們的Instagram獲或Facebook專頁了解更多啦！<br />
                    <a href="#">IG</a>/<a href="#">FB</a>: heartlinehk
                </p>
            </div>
            <div className="date-selector-container">
                <div className="month-select">
                    <select name="month" id="month-select" onChange={selectPostsByDate}>
                        <option value="All">All</option>
                        {monthSelect.length>0 && monthSelect.map((month, index)=>{
                            return(
                                <option key={"month-"+index} value={month}>{MONTH_NAME[month]}</option>
                            );
                        })}
                    </select>
                </div>
                <div className="year-select">
                    <select name="year" id="year-select" onChange={selectPostsByDate}>
                        <option value="All">All</option>
                        {yearSelect.length>0 && yearSelect.map((year, index)=>{
                            return(
                                <option key={"year"+index} value={year}>{year}</option>
                            );
                        })}
                    </select>
                </div>

            </div>
            <div className="ig-posts-container">
                {posts.length>0 && posts.map((post, index)=>{
                    return (
                        <a className="ig-post" key={"post-"+index} href={post.postUrl} style={{display: "inline-block"}}>
                            <img src={post.imgUrl}/>
                            <p>{post.caption}</p>
                            <time dateTime={post.dateTime}></time>
                        </a>
                    );
                })}
            </div>
            <Footer></Footer>
        </div>
    );
}

export default LatestFeed;