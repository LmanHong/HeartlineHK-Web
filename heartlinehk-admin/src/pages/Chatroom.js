import Loading from "../components/Loading.js";
import ConfirmModal from "../components/ConfirmModal.js";
import DropdownModal from "../components/DropdownModal.js";
import NoticeModal from "../components/NoticeModal.js";
import Picker from "emoji-picker-react";
import "../styles/Chatroom.css";
import newClientSound from "../sound/pristine-609.mp3"
import firebase from "firebase/compat/app";
import { getDatabase, child, runTransaction, ref, update, set, get } from 'firebase/database';
import "firebase/compat/auth";
import "firebase/compat/database";
import "firebase/compat/functions";
import { useEffect, useState, useRef } from "react";
import { useDatabaseList, SORT_ORDERS } from '../hooks/useDatabase.js';
import { useCall, ASSIGNED_STATUS } from "../hooks/useCall.js";
import { REQUEST_STATUS, useChat } from "../hooks/useChat.js";

const Chatroom = (props) =>{

    const stockPhrases = {
        'opening': "你好，我哋係Heartline HK，你可以叫我XXX。今晚上到嚟係咪有嘢想同我哋傾吓？",
        'ending': "多謝你信任我哋搵我哋傾偈呀，歡迎您日後有需要嘅時候再次搵我哋！喺您閂咗個對話視窗之後系統會自動彈一份問卷畀你，麻煩你幫手答幾條問題，話俾我哋知有咩要改善嘅地方！再見～"
    };
    const specialChineseChars = ['啲','咁','嗰','咗','喺','係','哋','唔','咩','咪','嘅','㗎','喎','嘢','嚟','囉','乜','叻','呢','啱','睇','諗','噏','嘥','晒','咋','瞓','唞','氹','攰','俾','閂','呀','啦','冧','晏','嬲','喇'];
    const specialChatMessages = {
        'clientLeft': "使用者已離開聊天室",
        'volunLeft': "義工已離開聊天室",
        'clientId': "義工已開啟聊天室"
    };

    
    const [callQueue, callCurrrntClient, callAssignedStatus, callTimeElapsed, isCallLoading, callError, startNewCall, endCall] = useCall(props.currentUser);
    const [
        chatQueue, 
        chatLog, 
        chatCurrentClient, 
        chatAssignedStatus, 
        isClientTyping, 
        disconnectedAt, 
        transferrableVolun,
        incomingTransferRequest, 
        outgoingTransferRequest, 
        isChatLoading, 
        chatError, 
        startNewChat, 
        endChat, 
        sendChatMessage, 
        createOutgoingTransferRequest, 
        cancelOutgoingTransferRequest,
        resolveIncomingTransferRequest,
    ] = useChat(props.currentUser);

    // Firebase Database object
    const database = getDatabase();
    //Volunteer Preferred Name database reference
    const preferredNameRef = ref(database, 'preferred_names');
    //Typing Status database reference
    const typingRef = ref(database, 'typing_status');
    //Refernce of the Message container div 
    const messageContainerDiv = useRef(null);
    // Chat and Call Unified Queue list
    const [uniQueue, setUniQueue] = useState([]);
    //Preferred Name of the transfer chat initiator
    const [transferFromVolun, setTransferFromVolun] = useState(null);
    //Flag indicating the chat queue container is shown full screen (in smaller screen devices)
    const [isQueueOpened, setIsQueueOpened] = useState(false);
    //Flag indicating the current user is typing
    const [isUserTyping, setIsUserTyping] = useState(false);
    //Flag indicating the emoji picker is opened
    const [isPickerOpened, setIsPickerOpened] = useState(false);
    //Flag indicating if there are unread messages from client
    const [isUnreadMsgExist, setIsUnreadMsgExist] = useState(false);



    //Function for changing the typing status of current user on database
    const changeTypingStatus = (e)=>{
        if (chatCurrentClient){
            const currentlyTyping = (e.target.value != "");
            if (currentlyTyping != isUserTyping){
                if (typingRef){
                    setIsUserTyping(currentlyTyping);
                    set(child(typingRef, props.currentUser.uid), currentlyTyping);
                }else console.error("ERROR: Typing Status reference not available!");
            }
        }
    }

    //Callback for handling the form submission of end chat confirmation modal
    const endChatFormHandler = (e)=>{
        e.preventDefault();
        const modalContainerDiv = e.target.parentElement.parentElement;
        if (modalContainerDiv.id === "endchat-modal"){
            const isConfirmed = (e.target.className === "confirm-btn");
            if (isConfirmed){
                if (chatCurrentClient !== null) endChat();
                else endCall();
            } 
            modalContainerDiv.classList.remove("opened");
        }else console.error("ERROR: Parent Element is not an end chat modal!");
    }

    //Callback for handling the form submission of start chat confirmation modal
    const startChatFormHandler = (e)=>{
        e.preventDefault();
        const modalContainerDiv = e.target.parentElement.parentElement;
        if (modalContainerDiv.id === "startchat-modal"){
            const isConfirmed = (e.target.className === "confirm-btn");
            if (isConfirmed){
                if (callCurrrntClient === null){
                    toggleQueue();
                    startNewChat();
                }else console.error("ERROR: Call Client is not null!");
            }
            modalContainerDiv.classList.remove("opened");
        }else console.error("ERROR: Parent Element is not a start chat modal!");
    }

    //Callback for handling the form submission of start call confirmation modal
    const startCallFormHandler = (e)=>{
        e.preventDefault();
        const modalContainerDiv = e.target.parentElement.parentElement;
        if (modalContainerDiv.id === "startcall-modal"){
            const isConfirmed = (e.target.className === "confirm-btn");
            if (isConfirmed){
                if (chatCurrentClient === null){
                    toggleQueue();
                    startNewCall();
                }else console.error("ERROR: Chat Client is not null!");
            }
            modalContainerDiv.classList.remove("opened");
        }else console.error("ERROR: Parent Element is not a start call modal!");
    }

    //Callback for handling the form submission of the transfer chat dropdown modal
    const trasnferChatFormHandler = async (e)=>{
        e.preventDefault();
        const modalContainerDiv = e.target.parentElement.parentElement;
        if (modalContainerDiv.id === "transferchat-modal"){
            const isConfirmed = (e.target.className === "confirm-btn");
            if (isConfirmed){
                const targetVolunId = document.querySelector('#volun-dropdown-list').value;
                console.log("Target: "+document.querySelector('#volun-dropdown-list').value);
                createOutgoingTransferRequest(targetVolunId);
            }
            modalContainerDiv.classList.remove("opened");
        }else console.error("ERROR: Parent Element is not a transfer chat modal!");
    }

    //Callback for handling the form submission of the transfer request from initiated volunteer
    const resolveRequestFormHandler = async (e)=>{
        e.preventDefault();
        const modalContainerDiv = e.target.parentElement.parentElement;
        if (modalContainerDiv.id === "transferrequest-modal"){
            const isConfirmed = (e.target.className === "confirm-btn");
            if (isConfirmed) resolveIncomingTransferRequest(REQUEST_STATUS.ACCEPTED);
            else resolveIncomingTransferRequest(REQUEST_STATUS.REJECTED);
            setTransferFromVolun(null);
            modalContainerDiv.classList.remove("opened");
        }else console.error("ERROR: Parent Element is not a transfer request modal!");
    }

    //Callback for handling the form submission of the waiting transfer notice modal
    const cancelTransferFormHandler = async (e)=>{
        e.preventDefault();
        const modalContainerDiv = e.target.parentElement.parentElement;
        if (modalContainerDiv.id === "waitingtransfer-modal"){
            cancelOutgoingTransferRequest();
            modalContainerDiv.classList.remove("opened");
        }else console.error("ERROR: Parent Element is not a waiting transfer modal!");
    }

    //Callback for handling selection of emoji in the emoji picker
    const emojiPickerHandler = (e, emojiObject)=>{
        console.log(emojiObject.emoji);
        const msgInput = document.querySelector(".chatroom .chat-container .input-container #msg-input");
        let originalMsgStart = msgInput.value.substring(0, msgInput.selectionStart);
        let originalMsgEnd = msgInput.value.substring(msgInput.selectionEnd, msgInput.value.length);
        if (msgInput.selectionStart === 0 && msgInput.selectionEnd === 0){
            originalMsgStart = msgInput.value;
            originalMsgEnd = "";
        }
        msgInput.value = originalMsgStart + emojiObject.emoji + originalMsgEnd;
        msgInput.focus();
        msgInput.setSelectionRange(originalMsgStart.length+2, originalMsgStart.length+2);
    }

    //Callback for handling selection of special chinese character
    const specialCharHandler = (e)=>{
        const specialChar = e.target.innerHTML;
        console.log(specialChar);
        const msgInput = document.querySelector(".chatroom .chat-container .input-container #msg-input");
        let originalMsgStart = msgInput.value.substring(0, msgInput.selectionStart);
        let originalMsgEnd = msgInput.value.substring(msgInput.selectionEnd, msgInput.value.length);
        if (msgInput.selectionStart === 0 && msgInput.selectionEnd === 0){
            originalMsgStart = msgInput.value;
            originalMsgEnd = "";
        }
        msgInput.value = originalMsgStart + specialChar + originalMsgEnd;
        msgInput.focus();
        msgInput.setSelectionRange(originalMsgStart.length+1, originalMsgStart.length+1);
    }

    //Callback for handling selection of stock phrase
    const stockPhraseHandler = async (e)=>{
        let stockPhrase = stockPhrases[e.target.value];
        const preferredNameSnapshot = await get(child(preferredNameRef, props.currentUser.uid));
        const preferredName = (preferredNameSnapshot.exists?preferredNameSnapshot.val():null);
        const msgInput = document.querySelector(".chatroom .chat-container .input-container #msg-input");
        if (e.target.value === 'opening' && preferredName){
            const namePos = stockPhrase.indexOf('XXX');
            stockPhrase = stockPhrases[e.target.value].substring(0, namePos) + preferredName['preferredName'] + stockPhrases[e.target.value].substring(namePos+3, stockPhrases[e.target.value].length);
        }
        msgInput.value = stockPhrase;
        msgInput.focus()
        msgInput.setSelectionRange(stockPhrase.length+1, stockPhrase.length+1);
    }

    //Function for toggling between Queue and Chat on screen (in smaller screen devices)
    const toggleQueue = ()=>{
        if (isQueueOpened) setIsQueueOpened(false);
        else setIsQueueOpened(true);
        document.querySelector('.chatroom').classList.toggle("queue-opened");

    }

    //Function for toggling the emoji picker
    const toggleEmojiPicker = ()=>{
        if (isPickerOpened) setIsPickerOpened(false);
        else setIsPickerOpened(true);
    }

    //Function for opening the transfer chat modal
    const openTransferChatModal = async ()=>{
        const modalContainerDiv = document.getElementById("transferchat-modal");
        modalContainerDiv.classList.add("opened");
    }

    //Function for side-scrolling the special chinese character container
    const scrollSpecialChar = (e)=>{
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const charBtnDiv = document.querySelector('.chatroom .chat-container .special-char-container .char-btn-container');
        const arrowButton = (e.target.className === "material-icons"?(e.target.innerHTML === "arrow_back_ios"?"back-arrow":"forward-arrow"):e.target.className);
        if (arrowButton === "back-arrow") charBtnDiv.scrollBy(-(1.3 * rem + 12), 0);
        else if (arrowButton === "forward-arrow") charBtnDiv.scrollBy((1.3 * rem + 12), 0);
    }

    const getFormattedDateString = (msec) =>{
        let targetDate = new Date(msec);
        let hourString = (targetDate.getHours()<10?"0"+targetDate.getHours().toString():targetDate.getHours().toString());
        let minuteString = (targetDate.getMinutes()<10?"0"+targetDate.getMinutes().toString():targetDate.getMinutes().toString());
        let monthString = (targetDate.getMonth()<9?"0"+(targetDate.getMonth()+1).toString():(targetDate.getMonth()+1).toString());
        let dayString = (targetDate.getDate()<10?"0"+targetDate.getDate().toString():targetDate.getDate().toString());

        return (hourString+":"+minuteString+", "+dayString+"/"+monthString);
    };

    const requestNotificationPermission = async (e)=>{
        if (e.target.checked && Notification.permission !== "granted"){
            let newPermission = await Notification.requestPermission();
            console.log(newPermission);
        }
    }

    useEffect(()=>{
        const callNoti = document.querySelector('#call-noti-toggle').checked;
        const chatNoti = document.querySelector('#chat-noti-toggle').checked;
        const notiPermission = ('Notification' in window && Notification.permission === 'granted');
        let newCallNoti = false;
        let newChatNoti = false;
        let callIdx = 0;
        let chatIdx = 0;
        let tmpUniQueue = [];

        console.log(notiPermission);
        
        while (callIdx < callQueue.length || chatIdx < chatQueue.length){
            if (chatIdx >= chatQueue.length || (callIdx < callQueue && callQueue[callIdx]['key']['time'] < chatQueue[chatIdx]['time'])){
                if (notiPermission && callNoti && !newCallNoti){
                    let isUserExist = false;
                    for (let i=0; i<uniQueue.length; i++) if (uniQueue[i].userId === callQueue[callIdx]['key']){
                        isUserExist = true;
                        break;
                    }
                    if (!isUserExist) newCallNoti = true;
                }
                tmpUniQueue.push({
                    'userId': callQueue[callIdx]['key'],
                    'time': callQueue[callIdx]['value']['time'],
                    'type': 'call-client'
                });
                callIdx++;
            }else{
                if (notiPermission && chatNoti && !newChatNoti){
                    let isUserExist = false;
                    for (let i=0; i<uniQueue.length; i++) if (uniQueue[i].userId === chatQueue[chatIdx]['key']){
                        isUserExist = true;
                        break;
                    }
                    if (!isUserExist) newChatNoti = true;
                }
                tmpUniQueue.push({
                    'userId': chatQueue[chatIdx]['key'],
                    'time': chatQueue[chatIdx]['value']['time'],
                    'status': chatQueue[chatIdx]['value']['status'],
                    'type': 'chat-client'
                });
                chatIdx++;
            }
        }
        setUniQueue(tmpUniQueue);
        if (newCallNoti || newChatNoti) 
            new Notification("新對話通知", { 
                icon: "http://localhost:3000/ms-icon-310x310.png", 
                body: (newCallNoti && newChatNoti?"有新文字與語音對話用戶入隊":(newCallNoti?"有新語音對話用戶入隊":"有新文字對話用戶入隊")) 
            });

    }, [callQueue, chatQueue]);


    useEffect(()=>{
        if (messageContainerDiv.current){

            const scrollTop = messageContainerDiv.current.scrollTop;
            const scrollHeight = messageContainerDiv.current.scrollHeight;
            const clientHeight = messageContainerDiv.current.clientHeight;
            const delta = clientHeight * 0.2;

            // Directly scroll to bottom if the message container is near the bottom enough
            if (scrollTop >= scrollHeight - clientHeight - delta) messageContainerDiv.current.scroll({top: scrollHeight - clientHeight, behavior: "smooth"});
            else{
                const lastMsg = messageContainerDiv.current.querySelector('.message:last-child');
                const lastLeftMsg = messageContainerDiv.current.querySelectorAll('.message.left');

                // Show "New Message" button if the lastest message is from the other user,
                // and scroll to bottom if not
                if (lastMsg && lastMsg.classList.contains("left")){
                    setIsUnreadMsgExist(true);
                    let observer = new IntersectionObserver((entries, observer)=>{
                        entries.forEach((entry, idx)=>{
                            if (entry.isIntersecting){
                                setIsUnreadMsgExist(false);
                                observer.unobserve(entry.target);
                            }
                        })
                    });
        
                    observer.observe(lastLeftMsg[lastLeftMsg.length-1]);
                }else messageContainerDiv.current.scroll({top: scrollHeight - clientHeight, behavior: "smooth"});
            }

            
        }
    }, [chatLog, messageContainerDiv]);

    useEffect(()=>{
        if (incomingTransferRequest && incomingTransferRequest['status'] === REQUEST_STATUS.PENDING){
            get(child(preferredNameRef, incomingTransferRequest['from'])).then((snapshot)=>{
                setTransferFromVolun((snapshot.val()?snapshot.val()['preferredName']:incomingTransferRequest['from']));
                document.querySelector('#transferrequest-modal').classList.add('opened');
            });
        }else document.querySelector('#transferrequest-modal').classList.remove('opened');
    }, [incomingTransferRequest]);

    useEffect(()=>{
        if (outgoingTransferRequest){
            document.querySelector('#waitingtransfer-modal').classList.add('opened');
        }else document.querySelector('#waitingtransfer-modal').classList.remove('opened');
    }, [outgoingTransferRequest]);


    return (
        <div className="chatroom">
            <NoticeModal modalId={"waitingtransfer-modal"} noticeText={"正在等待對方接受或拒絕你的轉移對話要求。如要取消請按「確定」。"} formSubmitHandler={cancelTransferFormHandler}></NoticeModal>
            <ConfirmModal modalId={"transferrequest-modal"} confirmText={`義工${transferFromVolun}向你提出轉移對話，你接受嗎？`} formSubmitHandler={resolveRequestFormHandler}></ConfirmModal>
            <DropdownModal modalId={"transferchat-modal"} dropdownId={"volun-dropdown-list"} descriptionText={"請選擇要接手對話的義工。"} dropdownOptions={transferrableVolun} formSubmitHandler={trasnferChatFormHandler}></DropdownModal>
            <ConfirmModal modalId={"endchat-modal"} confirmText={"你確定要結束對話嗎？"} formSubmitHandler={endChatFormHandler}></ConfirmModal>
            <ConfirmModal modalId={"startchat-modal"} confirmText={"你確定要開啟新文字對話嗎？"} formSubmitHandler={startChatFormHandler}></ConfirmModal>
            <ConfirmModal modalId={"startcall-modal"} confirmText={"你確定要開啟新語音對話嗎？請確保你已在'更改個人資料'中更新了你的香港電話號碼，並能於現在用該號碼接聽。"} formSubmitHandler={startCallFormHandler}></ConfirmModal>
            {(isCallLoading || isChatLoading) && <Loading></Loading>}
            {callCurrrntClient === null && 
                <div className="chat-container">
                    {disconnectedAt !== null &&
                        <p className="disconnect-msg">使用者已於{getFormattedDateString(disconnectedAt)}開始離線。</p>
                    }
                    <div ref={messageContainerDiv} className="messages-container">
                        {chatLog.map((val, idx)=>{
                            return(
                                <p key={val['key']} className={"message "+(val['value']['spc']?"special":(chatCurrentClient === null?(val['value']['uid'] === props.currentUser.uid?"right":"left"):(val['value']['uid'] === chatCurrentClient?"left":"right")))}>
                                    {(val['value']['msg']?val['value']['msg']:(specialChatMessages[val['value']['spc']]?specialChatMessages[val['value']['spc']]:specialChatMessages['clientId']))}
                                    <span>{getFormattedDateString(val['value']['time'])}</span>
                                </p>
                            );
                        })}
                    </div>
                    <div className="special-char-container">
                        <button className="back-arrow" onClick={scrollSpecialChar}><span className="material-icons">arrow_back_ios</span></button>
                        <div className="char-btn-container">
                            <button className="stock-phrase" onClick={stockPhraseHandler} value="opening">開始</button>
                            <button className="stock-phrase" onClick={stockPhraseHandler} value="ending">完結</button>
                            {specialChineseChars.map((char, idx)=>{
                                return (
                                    <button key={"spc-char"+idx} className="spc-char" onClick={specialCharHandler}>{char}</button>
                                );
                            })}
                        </div>
                        <button className="forward-arrow" onClick={scrollSpecialChar}><span className="material-icons">arrow_forward_ios</span></button>
                    </div>
                    <form className="input-container" onSubmit={(e)=>{e.preventDefault(); sendChatMessage(e.target.querySelector('#msg-input').value); e.target.querySelector('#msg-input').value = "";}}>
                        {isClientTyping && 
                            <p className="typing-msg">使用者正在輸入...</p>
                        }
                        {isUnreadMsgExist && 
                            <button type="button" className="to-new-msg-btn" onClick={()=>messageContainerDiv.current.scroll({top: messageContainerDiv.current.scrollHeight - messageContainerDiv.current.clientHeight, behavior: "smooth"})}>
                                <span className="material-icons">vertical_align_bottom</span> 新對話信息！
                            </button>
                        }
                        <button type="button" name="emoji-btn" id="emoji-btn" onClick={toggleEmojiPicker}><span className="material-icons">emoji_emotions</span></button>
                        <input type="text" name="msg-input" id="msg-input" placeholder="按此對話…" onInput={changeTypingStatus} onChange={changeTypingStatus} onPaste={changeTypingStatus} onCut={changeTypingStatus} onSelect={changeTypingStatus}/>
                        <button type="submit" name="submit-btn" id="submit-btn"><span className="material-icons">send</span></button>
                    </form>
                    
                    {isPickerOpened && <Picker onEmojiClick={emojiPickerHandler}></Picker>}
                </div>
            }
            {callCurrrntClient != null && 
                <div className="call-container">
                    <span className="material-icons">wifi_calling_3</span>
                    {callAssignedStatus == ASSIGNED_STATUS.CALL_ASSIGNED && <h4 className="call-assigned-status">已安排語音對話，請接聽電話</h4>}
                    {callAssignedStatus == ASSIGNED_STATUS.CALL_ACCEPTED && <h4 className="call-assigned-status">{Math.floor(callTimeElapsed/60)}:{(callTimeElapsed%60 < 10?`0${callTimeElapsed%60}`:callTimeElapsed%60)}</h4>}
                    {callAssignedStatus == ASSIGNED_STATUS.CLIENT_LEFT && <h4 className="call-assigned-status">使用者已離開，可以結束對話</h4>}
                    <textarea placeholder="筆記"></textarea>
                </div>
            }
            <div className="queue-container">
                <p className="main-text"><span className="material-icons">people</span><span className="queue-count">{chatQueue.length}</span></p>
                <div className="clients-container">
                    {uniQueue.map((val, idx)=>{
                        return (
                            <p key={val['userId']} className={val['type']+" queue-client"+(val['type'] === 'chat-client' && val['status'] === 'roomAssigned'?" assigned":"")}>
                                <span className="material-icons">{(val['type'] === 'call-client'?"call":"email")}</span><span className="client-id">{val['userId']}</span>
                                <span className="enqueue-time" date-time={val['time']}>{getFormattedDateString(val['time'])}</span>
                            </p>
                        );
                    })}
                </div>
                <div className="buttons-container">
                    <label htmlFor="call-noti-toggle" className="toggle-switch">
                        <input type="checkbox" name="call-noti-toggle" id="call-noti-toggle" onClick={requestNotificationPermission}/>
                        <span className="slider"></span>
                        新語音通知
                    </label>
                    <label htmlFor="chat-noti-toggle" className="toggle-switch">
                        <input type="checkbox" name="chat-noti-toggle" id="chat-noti-toggle" onClick={requestNotificationPermission}/>
                        <span className="slider"></span>
                        新文字通知
                    </label>
                    <button type="submit" name="trasnsfer-btn" id="transfer-btn" disabled={chatCurrentClient === null || chatAssignedStatus === ASSIGNED_STATUS.CLIENT_LEFT || transferrableVolun.length <= 0}  onClick={openTransferChatModal}>轉移對話</button>
                    <button type="submit" name="start-btn" id="start-btn" disabled={chatCurrentClient !== null || callCurrrntClient !== null || chatQueue.length <= 0 } onClick={()=>{document.getElementById("startchat-modal").classList.add("opened")}}>開始文字對話</button>
                    <button type="submit" name="start-call-btn" id="start-call-btn" disabled={chatCurrentClient !== null || callCurrrntClient !== null || callQueue.length <= 0} onClick={()=>{document.getElementById("startcall-modal").classList.add("opened")}}>開始語音對話</button>
                    <button type="submit" name="end-btn" id="end-btn" disabled={chatCurrentClient == null && callCurrrntClient == null} onClick={()=>{document.getElementById("endchat-modal").classList.add("opened")}}>結束對話</button>
                </div>
            </div>
            <button className="queue-toggle" onClick={toggleQueue}><span className="material-icons">{(isQueueOpened?"chat":"contacts")}</span></button>
        </div>
    );
}

export default Chatroom;