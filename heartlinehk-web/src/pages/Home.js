import carouselimg1 from "../img/Pages/1 主頁/a1.png";
import carouselimg2 from "../img/Pages/1 主頁/a2.png";
import carouselimg3 from "../img/Pages/1 主頁/a3.png";
import leftdecoration from "../img/Pages/1 主頁/e.PNG";
import aboutus from "../img/Pages/1 主頁/h.PNG";
import supportus from "../img/Pages/1 主頁/g.PNG";
import chatroom from "../img/Pages/1 主頁/chat button.PNG";
import Footer from "../components/Footer.js";
import "../styles/Home.css";
import { useEffect, useState } from "react";
import {Link} from "react-router-dom";

const Home = () =>{

    const [carouselImageHeight, setCarouselImageHeight] = useState(500);

    const moveToSlide = (targetIndex) =>{
        //Move carousel to the slide with targetIndex
        let carouselIndicators = document.querySelectorAll('.carousel-indicator');
        let carouselSlides = document.querySelectorAll('.carousel-slide');
        let currentSlide = document.querySelector('.carousel-slide.selected');
        let currentIndex = -1;
        carouselSlides.forEach((slide, index) =>{
            if (slide === currentSlide) currentIndex = index;
        });

        if (targetIndex >= 0 && targetIndex < carouselSlides.length && currentSlide !== carouselSlides[targetIndex]){
            console.log(carouselSlides[targetIndex].style.left); 
            carouselSlides.forEach((slide, index)=>{
                slide.style.transform = `translateX(-${carouselSlides[targetIndex].style.left})`;
            });
            carouselIndicators[currentIndex].classList.remove('selected');
            carouselIndicators[targetIndex].classList.add('selected');
            currentSlide.classList.remove('selected');
            carouselSlides[targetIndex].classList.add('selected');
        }
    }

    const moveCarousel = (e) =>{
        //Move carousel on carousel indicator click 
        let carouselIndicators = document.querySelectorAll('.carousel-indicator');
        carouselIndicators.forEach((indicator, index)=>{
            if (indicator === e.target) moveToSlide(index);
        });
    }

    useEffect(()=>{
        const resizeWindow = () => {
            let aspectRatio = 1.7775;
            let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            let imgWidth = Math.min(0.8*vw, 889);
            let imgHeight = imgWidth / aspectRatio;
            if (vw <= 576) imgHeight = vw / aspectRatio;
            setCarouselImageHeight(imgHeight);
        }
        resizeWindow();
        window.addEventListener('resize', resizeWindow);

        if ("carouselTimer" in window) clearInterval(window.carouselTimer);
        window.carouselTimer = setInterval(()=>{
            let carouselSlides = document.querySelectorAll('.carousel-slide');
            let currentIndex = -1;
            carouselSlides.forEach((slide, index) =>{
                if (slide.classList.contains("selected")) currentIndex = index;
            });
            moveToSlide((currentIndex+1)%carouselSlides.length);
        }, 10000);

        return () =>{
            clearInterval(window.carouselTimer);
            window.removeEventListener('resize', resizeWindow);
        }
    }, []);

    return (
        <div className="home">
            <div className="carousel" style={{height: (carouselImageHeight + 12)}}>
                <div className="carousel-track-container" style={{height: carouselImageHeight}}>
                    <ul className="carousel-track" style={{height: carouselImageHeight}}>
                        <li className="carousel-slide selected" style={{left: "0"}}>
                            <img src={carouselimg1} alt={carouselimg1} className="carousel-image" />
                            <p className="super-text" >我們是</p>
                            <p className="main-text" >一班大學生</p>
                        </li>
                        <li className="carousel-slide" style={{left: "100%"}}>
                            <img src={carouselimg2} alt={carouselimg2} className="carousel-image" />
                            <p className="super-text" >我們是</p>
                            <p className="main-text" >一個推廣心理健康的機構</p>
                        </li>
                        <li className="carousel-slide" style={{left: "200%"}}>
                            <img src={carouselimg3} alt={carouselimg3} className="carousel-image" />
                            <p className="super-text" >我們是</p>
                            <p className="main-text" >一個聽你傾訴的平台</p>
                        </li>
                    </ul>
                </div>
                <div className="carousel-nav">
                    <button className="carousel-indicator selected" onClick={moveCarousel}></button>
                    <button className="carousel-indicator" onClick={moveCarousel}></button>
                    <button className="carousel-indicator" onClick={moveCarousel}></button>
                </div>
            </div>
            <div className="descriptions-container">
                <div className="dialog1">
                    <p>你好嗎,</p>
                    <p>想找找你</p>
                </div>
                <div className="dialog2">
                    <p>嗯,碰巧我也是</p>
                </div>
                <div className="dialog3">
                    <p>你好不好，也不要緊</p>
                    <p>這樣巧合，你按進了這裏</p>
                    <p>我們這群大學生，也在這兒</p>
                    <p>關注精神健康，關心你</p>
                </div>
            </div>
            <div className="learn-more-container">
                <h1 className="sub-title">了解更多...</h1>
                <div className="learn-more-links">
                    <Link to="/about-us" className="link">
                        <img src={aboutus} alt={aboutus} className="link-image" />
                        <p className="link-text">關於我們</p>
                    </Link>
                    <Link to="/" className="link">
                        <img src={chatroom} alt={chatroom} className="link-image" />
                        <p className="link-text">聯天室</p>
                    </Link>
                    <Link to="/support-us" className="link">
                        <img src={supportus} alt={supportus} className="link-image" />
                        <p className="link-text">支持我們</p>
                    </Link>
                </div>
            </div>
            <Footer></Footer>
        </div>
    );
}

export default Home;