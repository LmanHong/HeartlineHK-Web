import Footer from '../components/Footer.js';
import '../styles/LatestFeed.css';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/storage';
import { useEffect, useRef, useState } from 'react';

const LatestFeed = () => {

    const MONTH_NAME = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const [database, setDatabase] = useState(firebase.database());
    const [posts, setPosts] = useState([]);
    const [popupIndex, setPopupIndex] = useState(0);
    const [monthSelect, setMonthSelect] = useState([]);
    const [yearSelect, setYearSelect] = useState([]);
    const [categorySelect, setCategorySelect] = useState([]);
    const [currentMonth, setCurrentMonth] = useState("");
    const [currentYear, setCurrentYear] = useState("");
    const [currentCategory, setCurrentCategory] = useState("");

    useEffect(()=>{
        database.ref('ig_posts').once('value').then(async (snapshot)=>{
            console.log(snapshot.val());
            
            let availableYears = [];
            let availableMonths = [];
            let availableCategories = [];
            for (var index in snapshot.val()){
                let date = new Date(snapshot.val()[index].dateTime);
                let category = snapshot.val()[index].category;
                if (!availableMonths.includes(date.getMonth())) availableMonths.push(date.getMonth());
                if (!availableYears.includes(date.getFullYear())) availableYears.push(date.getFullYear());
                if (!availableCategories.includes(category)) availableCategories.push(category);
            }
            availableMonths.sort((a,b)=>a-b);
            availableYears.sort((a,b)=>a-b);
            setPosts(snapshot.val());
            setMonthSelect(availableMonths);
            setYearSelect(availableYears);
            setCategorySelect(availableCategories);
        });
    }, []);

    const selectPosts = (e) =>{
        let changed = e.target.name;

        let monthSelected = document.querySelector('#month-select').value;
        let yearSelected = document.querySelector('#year-select').value;
        let categorySelected = document.querySelector('#category-select').value;
        let postsRef = document.querySelectorAll('.ig-post');

        console.log("Month: "+monthSelected);
        console.log("Year: "+yearSelected);
        console.log("Category: "+categorySelected);

        setCurrentMonth(monthSelected);
        setCurrentYear(yearSelected);
        setCurrentCategory(categorySelected);

        if (monthSelected === '') monthSelected = "All";
        if (yearSelected === '') yearSelected = "All";
        if (categorySelected === '') categorySelected = "All";

        let monthsInYearAndCategorySelected = [];
        let yearsInMonthAndCategorySelected = [];
        let categoriesInMonthAndYearSelected = [];
        postsRef.forEach((post, index) =>{
            let date = new Date(post.lastElementChild.dateTime);
            let category = post.children[2].value;
            if ((yearSelected == "All" || yearSelected == date.getFullYear()) && ((categorySelected == "All" || categorySelected == category)) && !monthsInYearAndCategorySelected.includes(date.getMonth())) monthsInYearAndCategorySelected.push(date.getMonth());
            if ((monthSelected == "All" || monthSelected == date.getMonth()) && ((categorySelected == "All" || categorySelected == category)) && !yearsInMonthAndCategorySelected.includes(date.getFullYear())) yearsInMonthAndCategorySelected.push(date.getFullYear());
            if ((monthSelected == "All" || monthSelected == date.getMonth()) && (yearSelected == "All" || yearSelected == date.getFullYear()) && !categoriesInMonthAndYearSelected.includes(category)) categoriesInMonthAndYearSelected.push(category);
            if ((monthSelected == "All" || monthSelected == date.getMonth()) && (yearSelected == "All" || yearSelected == date.getFullYear()) && ((categorySelected == "All" || categorySelected == category))){
                post.style.display = "inline-block";
            }else{
                post.style.display = "none";
            }
        });
        monthsInYearAndCategorySelected.sort((a,b)=>a-b);
        yearsInMonthAndCategorySelected.sort((a,b)=>a-b);
        setMonthSelect(monthsInYearAndCategorySelected);
        setYearSelect(yearsInMonthAndCategorySelected);
        setCategorySelect(categoriesInMonthAndYearSelected);
    };

    const openPopup = (e) =>{
        let postId = (e.target.id.match('post-')?e.target.id:e.target.parentElement.id);
        let postIndex = postId.substring(postId.indexOf('-')+1, postId.length);
        if (window.innerWidth > 576){
            setPopupIndex(postIndex);
            document.querySelector('.post-popup-container').classList.add('opened');
        }else{
            window.location.href = posts[postIndex].postUrl;
        }
    };

    const closePopup = (e) =>{
        document.querySelector('.post-popup-container').classList.remove('opened');
    }

    useEffect(()=>{
        const images = document.querySelectorAll("[data-src]");

        const imgObserver = new IntersectionObserver((entries, imgObserver)=>{
            entries.forEach((entry)=>{
                if (!entry.isIntersecting) return;
                else{
                    console.log("Intersecting!");
                    const src = entry.target.getAttribute("data-src");
                    if (!src) return;
                    else entry.target.src = src;
                    imgObserver.unobserve(entry.target);
                }
            });
        });

        images.forEach((image)=>{
            imgObserver.unobserve(image);
            if (!image.src) imgObserver.observe(image);
        });
    }, [posts]);

    return (
        <div className="latest-feed">
            <div className="main-text">
                <h1>最新動態</h1>
                <p>如果想知道更加多心理學資訊、成為更好的傾訴對象、或者想投稿分享心事，就追蹤我們的Instagram或Facebook專頁了解更多啦！<br />
                    <a href="https://www.instagram.com/heartlinehk/">IG</a>/<a href="https://www.facebook.com/heartlinehongkong">FB</a>: heartlinehk
                </p>
            </div>
            <div className="date-selector-container">
                <div className="month-select">
                    <select value={currentMonth} name="month" id="month-select" onChange={selectPosts}>
                        <option value="" disabled hidden>月份</option>
                        <option value="All">All</option>
                        {monthSelect.length>0 && monthSelect.map((month, index)=>{
                            return(
                                <option key={"month-"+index} value={month}>{MONTH_NAME[month]}</option>
                            );
                        })}
                    </select>
                </div>
                <div className="year-select">
                    <select value={currentYear} name="year" id="year-select" onChange={selectPosts}>
                        <option value="" disabled hidden>年份</option>
                        <option value="All">All</option>
                        {yearSelect.length>0 && yearSelect.map((year, index)=>{
                            return(
                                <option key={"year"+index} value={year}>{year}</option>
                            );
                        })}
                    </select>
                </div>
                <div className="category-select">
                    <select value={currentCategory} name="category" id="category-select" onChange={selectPosts}>
                        <option value="" disabled selected hidden>主題</option>
                        <option value="All">All</option>
                            {categorySelect.length>0 && categorySelect.map((category, index)=>{
                                return(
                                    <option key={"category"+index} value={category}>{category}</option>
                                );
                            })}
                    </select>
                </div>
            </div>
            {posts.length>0 && 
            <div className="post-popup-container">
                <div className="post-content">
                    <img src={posts[popupIndex].imgUrl} alt={posts[popupIndex].imgUrl} />
                    <div className="post-text">
                        <a href={posts[popupIndex].postUrl}>在Instagram觀看原文</a>
                        <p dangerouslySetInnerHTML={{__html: posts[popupIndex].caption.replaceAll('\n', '<br/>')}}></p>
                    </div>
                </div>
                <div className="overlay" onClick={closePopup}></div>
            </div>
            }

            <div className="ig-posts-container">
                {posts.length>0 && posts.map((post, index)=>{
                    return (
                        <a className="ig-post" id={"post-"+index} key={"post-"+index} style={{display: "inline-block"}} onClick={openPopup}>
                            <img data-src={post.imgUrl}/>
                            <p>{post.caption}</p>
                            <input type="hidden" name="category" value={post.category} />
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