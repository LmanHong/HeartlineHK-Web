import Footer from "../components/Footer.js";
import "../styles/FAQ.css";

const FAQ = () =>{

    const openQuestionBox = (e) =>{
        let questionLI = null;
        if (e.target.classList.contains("question")) questionLI = e.target;
        else questionLI = e.target.parentElement;
        questionLI.classList.toggle("opened");
    }

    return (
        <div className="faq">
            <div className="main-text">
                <h1>常見問題</h1>
                <p>以下是關於我們聆聽服務的常見問題，如有更多疑問，歡迎以電郵方式(<a href="mainto:heartlinehongkong@gmail.com">heartlinehongkong@gmail.com</a>) 或在社交平台 (<a href="#">Facebook</a>/<a href="#">Instagram</a>)聯絡我們。</p>
            </div>
            <ul className="q-and-a-container">
                <li className="question" style={{backgroundColor: "#f6f6f6"}} onClick={openQuestionBox}>
                    <p className="question-text">HeartlineHK 是個甚麼團體？</p>
                    <p className="answer-text">HeartlineHK由一群大學生發起，希望爲受情緒困擾的香港大學生提供一個傾訴的空間。我們的義工受過專業訓練，會在每晚7pm至翌日7am致力聆聽和支援朋輩。我們相信有效的聆聽和對話能疏導求助者的情緒，讓對方感到被理解和被關懷，從而避免負面情緒的積壓。讓我們合力為心理健康帶來正面的幫助！</p>
                </li>
                <li className="question" style={{backgroundColor: "#e6eef6"}} onClick={openQuestionBox}>
                    <p className="question-text">對話過程是否保密？</p>
                    <p className="answer-text">是的，我們承諾會每次對話內容絕對保密，對話後當義工和求助者雙方都關閉頁面後所有內容都不會留底，求助者亦會在對話開始前簽下保密協議和服務條款，以保障義工和求助者雙方。</p>
                </li>
                <li className="question" style={{backgroundColor: "#f6f6f6"}} onClick={openQuestionBox}>
                    <p className="question-text">HeartlineHK的服務同其他輔導服務有甚麼不同之處？</p>
                    <p className="answer-text">我們的義工都是大學生，希望籍此能更切身處地地了解求助者的心情和需要。我們同時亦知道很多時候求助者往往不是需要很專業的治療和建議，反而是一對肯聆聽和諒解的耳朵，因此我們希望能給予求助者一個無壓的環境抒發自己的心聲，從而避免負面情緒的積壓</p>
                </li>
                <li className="question" style={{backgroundColor: "#f6f2ef"}} onClick={openQuestionBox}>
                    <p className="question-text">如何使用HeartlineHK的服務？</p>
                    <p className="answer-text">每晚7pm至翌日7am間，你可以按右上角的按鈕和我們的義工對話，或致電我們的熱線號碼。如果想知道更多心理學資訊和了解我們的最新消息，請關注我們的社交平台！(Facebook/Instagram: heartlinehk)</p>
                </li>
                <li className="question" style={{backgroundColor: "#fffbf4"}} onClick={openQuestionBox}>
                    <p className="question-text">甚麼人可以使用HeartlineHK的服務？</p>
                    <p className="answer-text">我們的主要服務對象為香港的年青人，但也歡迎其他年齡層的求助者。</p>
                </li>
                <li className="question" style={{backgroundColor: "#f6f2ef"}} onClick={openQuestionBox}>
                    <p className="question-text">是否一定需要網絡才能使用服務？</p>
                    <p className="answer-text">是的，現階段線上信息和熱線支援服務均需要網絡才可以使用。</p>
                </li>
                <li className="question" style={{backgroundColor: "#eaf1f1"}} onClick={openQuestionBox}>
                    <p className="question-text">接聽電話和回覆信息的義工是誰？他們有受過專業訓練嗎？</p>
                    <p className="answer-text">義工為大學生，所有義工需在開始服務前接受培訓，培訓的教材均由現正執業的臨床心理學家、輔導員或精神科醫生審閱。</p>
                </li>

            </ul>
            <Footer></Footer>
        </div>
    );
}

export default FAQ;