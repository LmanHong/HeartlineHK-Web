import Footer from "../components/Footer.js";
import ConfirmModal from "../components/ConfirmModal.js";
import PopupModal from "../components/PopupModal.js";
import "../styles/Chatroom.css";
import Picker from "emoji-picker-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {Link} from "react-router-dom";
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import "firebase/compat/auth";

const Chatroom = () =>{

    const specialChatMessages = {
        'clientLeft': "您已離開聊天室",
        'volunLeft': "義工已離開聊天室",
        'clientId': "義工已開啟聊天室"
    }

    const recordFormUrl = "https://sprw.io/stt-f768f9";

    const queueRef = firebase.database().ref('chat_queue');
    const assignedRef = firebase.database().ref('chat_assigned');
    const disconnectRef = firebase.database().ref('disconnect_time');
    const typingRef = firebase.database().ref('typing_status');

    const messageContainerDiv = useRef(null);
    const [currentVolun, setCurrentVolun] = useState(sessionStorage.getItem('heartlinehk-currentVolun'));
    const [chatLog, setChatLog] = useState([]);
    const [isInQueue, setIsInQueue] = useState(false);
    const [isDisconnected, setIsDisconnected] = useState(false);
    const [isEnqueuing, setIsEnqueuing] = useState(false);
    const [isDequeuing, setIsDequeuing] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [isEndingChat, setIsEndingChat] = useState(false);
    const [isVolunTyping, setIsVolunTyping] = useState(false);
    const [isUserTyping, setIsUserTyping] = useState(false);
    const [isPickerOpened, setIsPickerOpened] = useState(false);
    const [isTandCChecked, setIsTandCChecked] = useState(false);
    const [isTandCRead, setIsTandCRead] = useState(false);
    const [isEnglishTandC, setIsEnglishTandC] = useState(false);
    
    //Callback for handling new chat messages
    const handleChatLogChanges = (snapshot)=>{
        let tmpChatLog = [];
        console.log(snapshot.val());
        if (snapshot.val() != null){
            for (const chatId in snapshot.val()) tmpChatLog.push({
                'chatId': chatId,
                'uid': snapshot.val()[chatId]['uid'],
                'time': snapshot.val()[chatId]['time'],
                'msg': snapshot.val()[chatId]['msg'],
                'spc': snapshot.val()[chatId]['spc']
            });
        }
        console.log(tmpChatLog);
        setChatLog(tmpChatLog);
    };

    //Callback for handling room assigned changes
    const handleRoomAssignedChanges = (snapshot)=>{
        let currentUser = firebase.auth().currentUser;
        if (snapshot.val() != null){
            if (snapshot.val() == "volunLeft"){
                //End Chat if volunteer has left
                console.log("Volunteer Left!");
                setIsInQueue(false);
                endChat();
            }else{
                console.log("Room Assigned!");
                //Remove queue entry when room is assigned
                queueRef.child(currentUser.uid).remove();
                queueRef.child(currentUser.uid).onDisconnect().cancel();
                //Subscribe to chatroom changes
                setupChatroomListener(true);
                setIsInQueue(false);
            }
        }
    };

    //Callback for handling disconnect/reconnect changes
    const handleConnectionChanges = (snapshot)=>{
        let currentUser = firebase.auth().currentUser;
        if (currentUser){
            if (snapshot.val() === true){
                setIsDisconnected(false);
                if (disconnectRef){
                    disconnectRef.child(currentUser.uid).remove();
                    disconnectRef.child(currentUser.uid).onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
                    console.log('OnDisconnect listener is set!');
                }else console.error('ERROR: Disconnect Reference is not available!');
            }else{
                setIsDisconnected(true);
                console.log("Warning: Client is now disconnected!");
            }
        }else console.error('ERROR: Current User is null!');
    };

    //Callback for handling typing status changes
    const handleTypingStatusChanges = (snapshot)=>{
        console.log(snapshot.val());
        setIsVolunTyping(snapshot.val());
    }

    const setupChatroomListener = async (fromRoomAssignedHandler=false)=>{
        try{
            let currentUser = firebase.auth().currentUser;
            //Check if the required database reference is available
            if (!assignedRef) throw new ReferenceError("Room Assigned reference not available!");
            else if (!typingRef) throw new ReferenceError("Typing Stattus reference not available!");
            //Check if the current user is null
            else if (currentUser === null) throw new Error("CurrentUser is null!");
            else{
                //Check if a volunteer is assigned to the current user (i.e. having an ongoing chat)
                let assignedSnapshot = await assignedRef.child(currentUser.uid).once('value');
                let assignedVolun = assignedSnapshot.val();
                if (assignedVolun === null) throw new Error(`No volunteer is assigned to user ${currentUser.uid}!`);
                else if (assignedVolun === "volunLeft"){
                    sessionStorage.removeItem('heartlinehk-currentVolun');
                    await assignedRef.child(currentUser.uid).remove();
                    alert("Previous chat was ended by volunteer!");
                    throw new Error("Previous chat was ended by volunteer!");
                }else{
                    //Unsubscribe to previous chatroom listener if previous assigned volunteer exists
                    let previousAssignedVolun = sessionStorage.getItem('heartlinehk-currentVolun');
                    if (previousAssignedVolun != null){
                        firebase.database().ref(`chat_log/${previousAssignedVolun}`).off('value');
                        typingRef.child(previousAssignedVolun).off('value');
                    }

                    //Subscribe to the chatroom listener
                    firebase.database().ref(`chat_log/${assignedVolun}`).on('value', handleChatLogChanges);

                    //Subscribe to room assigned listener
                    if (!fromRoomAssignedHandler) assignedRef.child(currentUser.uid).on('value', handleRoomAssignedChanges);

                    //Subscribe to connection listener
                    firebase.database().ref('.info/connected').on('value', handleConnectionChanges);

                    //Subscribe to volunteer's typing status listener
                    typingRef.child(assignedVolun).on('value', handleTypingStatusChanges);

                    //Set the current volunteer
                    sessionStorage.setItem('heartlinehk-currentVolun', assignedVolun);
                    console.log("Subscribed to chatroom listener!");
                    setCurrentVolun(assignedVolun);
                    setIsTandCRead(true);
                }
            }
        }catch(error){
            console.error("ERROR: "+error.message);
        }
    };

    const enqueueChat = async (e) =>{
        try{
            //Check if the user is already euqueuing
            if (isEnqueuing) throw new Error("Already enqueuing!");
            setIsEnqueuing(true);

            let currentUser = firebase.auth().currentUser;
            let localCurrentVolun = (currentVolun?currentVolun:sessionStorage.getItem('heartlinehk-currentVolun'));

            //Check if all database references are available
            if (!queueRef){
                setIsEnqueuing(false);
                throw new ReferenceError("Chat Queue reference not available!");
            }else if (!assignedRef){
                setIsEnqueuing(false);
                throw new ReferenceError("Room Assigned reference not available!");
            }
            //Check if current volunteer is already set
            else if (localCurrentVolun != null){
                setIsEnqueuing(false);
                throw new Error("CurrentVolun is already set!");
            }
            //Check if current user is null
            else if (currentUser === null){
                setIsEnqueuing(false);
                throw new Error("CurrentUser is null!");
            }else{
                //Check if the user is in chat queue
                let localIsInQueue = (await queueRef.child(currentUser.uid).once('value')).val();
                if (localIsInQueue != null){
                    setIsDequeuing(false);
                    throw new Error("Already in Chat Queue!");
                }

                //Enqueue to Chat Queue
                let enqueueTransaction = await queueRef.child(currentUser.uid).transaction((queueClient)=>{
                    if (queueClient != null){
                        console.error("ERROR: Queue Client is not Null!");
                        return;
                    }else{
                        return({
                            'status': "inQueue",
                            'time': firebase.database.ServerValue.TIMESTAMP
                        });
                    }
                });
                if (enqueueTransaction.error){
                    setIsEnqueuing(false);
                    throw new Error(enqueueTransaction.error);
                }else if (!enqueueTransaction.committed){
                    setIsEnqueuing(false);
                    throw new Error("Enqueue Transaction Aborted!");
                }
                setIsInQueue(true);

                //Dequeue when client disconnects
                await queueRef.child(currentUser.uid).onDisconnect().remove();

                //Subscribe to listener of the room assigned changes
                assignedRef.child(currentUser.uid).on('value', handleRoomAssignedChanges);

                //End of procedure of enqueuing
                setIsEnqueuing(false);
            }
        }catch(error){
            console.error("ERROR: "+error.message);
        }
    };

    const dequeueChat = async (e) =>{
        try{
            //Check if the user is already dequeuing
            if (isDequeuing) throw new Error("Already dequeuing!");
            setIsDequeuing(true);

            let currentUser = firebase.auth().currentUser;
            let localCurrentVolun = (currentVolun?currentVolun:sessionStorage.getItem('heartlinehk-currentVolun'));


            //Check if all database references are available
            if (!queueRef){
                setIsDequeuing(false);
                throw new ReferenceError("Chat Queue reference not available!");
            }else if (!assignedRef){
                setIsDequeuing(false);
                throw new ReferenceError("Room Assigned reference not available!");
            }
            //Check if a chat is ongoing
            else if (localCurrentVolun != null){
                setIsDequeuing(false);
                throw new Error("CurrentVolun is already set!");
            }
            //Check if currentUser is null
            else if (currentUser === null){
                setIsDequeuing(false);
                throw new Error("CurrentUser is null!");
            }else{
                //Check if the user is in chat queue
                let localIsInQueue = (await queueRef.child(currentUser.uid).once('value')).val();
                if (localIsInQueue === null){
                    setIsDequeuing(false);
                    throw new Error("Not in Chat Queue!");
                }

                //Dequeue at Chat Queue
                await queueRef.child(currentUser.uid).remove();
                await queueRef.child(currentUser.uid).onDisconnect().cancel();

                //Unsubscribe to listener of room assigned changes
                assignedRef.child(currentUser.uid).off('value');
                
                //Reset the in-queue status
                setIsInQueue(false);

                //End of procedure of dequeuing
                setIsDequeuing(false);
            }
        }catch(error){
            console.error("ERROR: "+error.message);

        }
    };

    const endChat = async (e)=>{
        try{
            //Check if a chat is already ending
            if (isEndingChat) throw new Error("A chat is already ending!");
            setIsEndingChat(true);

            let currentUser = firebase.auth().currentUser;
            let localCurrentVolun = (currentVolun?currentVolun:sessionStorage.getItem('heartlinehk-currentVolun'));

            //Check if a chat is ongoing
            if (localCurrentVolun === null){
                setIsEndingChat(false);
                throw new Error("CurrentVolun is null!");
            }
            //Check if current user is null
            else if (currentUser === null){
                setIsEndingChat(false);
                throw new Error("CurrentUser is null!");
            }
            //Check if all databse references are available
            else if (!firebase.database().ref(`chat_log/${currentVolun}`)){
                setIsEndingChat(false);
                throw new ReferenceError("Chatroom reference not available!");
            }else if (!assignedRef){
                setIsEndingChat(false);
                throw new ReferenceError("Room Assigned reference not available!");
            }else if (!typingRef){
                setIsEndingChat(false);
                throw new ReferenceError("Typing Staus reference not available!");
            }else{
                //Check if the volunteer has left the chat
                let assignedSnapshot = await assignedRef.child(currentUser.uid).once('value');
                const isVolunLeft = (assignedSnapshot.val() === 'volunLeft');

                if (!isVolunLeft){
                    //If the volunteer hasn't left, send a special message of "clientLeft" to chat
                    let specialMessage = await firebase.database().ref(`chat_log/${localCurrentVolun}`).push();
                    await specialMessage.set({
                        'uid': currentUser.uid,
                        'time': firebase.database.ServerValue.TIMESTAMP,
                        'spc': "clientLeft"
                    });
                }else{
                    //If the volunteer has left, push a special message of "volunLeft" to the local copy of the chat
                    let tmpChatLog = chatLog;
                    console.log(chatLog);
                    console.log(tmpChatLog);
                    tmpChatLog.push({
                        'chatId': 'volundisconnect',
                        'uid': localCurrentVolun,
                        'time': Date.now(),
                        'spc': 'volunLeft'
                    });
                    setChatLog(tmpChatLog);
                }

                //Delete the room assigned
                await assignedRef.child(currentUser.uid).remove();

                //Delete typing staus
                await typingRef.child(currentUser.uid).remove();

                //Unsubscribe to Chatroom changes
                firebase.database().ref(`chat_log/${localCurrentVolun}`).off('value');

                //Unsubscribe to connection listener
                firebase.database().ref('.info/connected').off('value');

                //Unsubscribe to typing sttatus listener
                typingRef.child(localCurrentVolun).off('value');

                //Reset the current volunteer
                sessionStorage.removeItem('heartlinehk-currentVolun');
                setCurrentVolun(null);

                //Delete anonymous user
                firebase.auth().currentUser.delete();

                //Stop last login timer
                if ("loginTimer" in window) clearInterval(window.loginTimer);

                //Open popup modal for chat record form
                document.getElementById('recordform-modal').classList.add("opened");

                //End of procedure of ending a chat
                setIsEndingChat(false);
            }
        }catch(error){  
            console.error("ERROR: "+error.message);
        }
    };

    const toggleEnqueueDequeue = async ()=>{
        let localCurrentVolun = (currentVolun?currentVolun:sessionStorage.getItem('heartlinehk-currentVolun'));
        if (firebase.auth().currentUser && localCurrentVolun === null && isTandCChecked){
            if (isInQueue){
                setIsTandCRead(false);
                await dequeueChat();
            }else{
                setIsTandCRead(true);
                await enqueueChat();
            } 
        }
    };

    const sendChatMessage = async (e)=>{
        e.preventDefault();
        try{
            //Check if a message is already sending
            if (isSendingMessage) throw new Error("Already sending a message!");
            else if (isDisconnected) throw new Error("User is disconnected!");
            setIsSendingMessage(true);

            let currentUser = firebase.auth().currentUser;
            let localCurrentVolun = (currentVolun?currentVolun:sessionStorage.getItem('heartlinehk-currentVolun'));

            //Check if a chat is ongoing
            if (localCurrentVolun === null){
                setIsSendingMessage(false);
                throw new Error("Current Volunteer is null!");
            }
            //Check if current user is null
            else if (currentUser === null){
                setIsSendingMessage(false);
                throw new Error("Current User is null!");
            }
            //Check if the message to be sent is empty
            let messageToBeSent = document.getElementById('msg-input').value;
            if (messageToBeSent == null || messageToBeSent == ""){
                setIsSendingMessage(false);
                throw new Error("Message to be sent is empty!");
            }
            else if (!firebase.database().ref(`chat_log/${localCurrentVolun}`)){
                setIsSendingMessage(false);
                throw new ReferenceError("Chatroom reference not available!");
            }else if (!typingRef){
                setIsSendingMessage(false);
                throw new ReferenceError("Typing Status reference not available!");
            }else{
                //Send the message to chatroom
                let newMessageRef = await firebase.database().ref(`chat_log/${localCurrentVolun}`).push();
                let newMessageTransaction = await newMessageRef.transaction((newMessage)=>{
                    if (newMessage === null){
                        return {
                            'uid': currentUser.uid,
                            'time': firebase.database.ServerValue.TIMESTAMP,
                            'msg': messageToBeSent
                        };
                    }else{
                        console.error("ERROR: New Message is not null!");
                        return;
                    }
                });
                if (newMessageTransaction.error){
                    setIsSendingMessage(false);
                    throw new Error(newMessageTransaction.error);
                }else if (!newMessageTransaction.committed){
                    setIsSendingMessage(false);
                    throw new Error("New Message Transaction Aborted!");
                }

                //Rese the typing status
                setIsUserTyping(false);
                await typingRef.child(currentUser.uid).set(false);

                //Clear the message input
                document.getElementById('msg-input').value = "";
                console.log("Message sent!");

                setIsSendingMessage(false);
            }
        }catch (error){
            console.error("ERROR: "+error.message);
        }
    };

    //Function for changing the typing status of current user on database
    const changeTypingStatus = (e)=>{
        if (currentVolun){
            const currentlyTyping = (e.target.value != "");
            if (currentlyTyping != isUserTyping){
                if (typingRef){
                    setIsUserTyping(currentlyTyping);
                    typingRef.child(firebase.auth().currentUser.uid).set(currentlyTyping);
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
            if (isConfirmed) endChat();
            modalContainerDiv.classList.remove("opened");
        }else console.error("ERROR: Parent Element is not an end chat modal!");
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

    //Function for toggling the emoji picker
    const toggleEmojiPicker = ()=>{
        if (isPickerOpened) setIsPickerOpened(false);
        else setIsPickerOpened(true);
    }

    //Function for toggling T&C Checked
    const toggleTandCChecked = (e)=>{
        setIsTandCChecked(e.target.checked);
    }

    const getFormattedDateString = (msec) =>{
        let targetDate = new Date(msec);
        let hourString = (targetDate.getHours()<10?"0"+targetDate.getHours().toString():targetDate.getHours().toString());
        let minuteString = (targetDate.getMinutes()<10?"0"+targetDate.getMinutes().toString():targetDate.getMinutes().toString());
        let monthString = (targetDate.getMonth()<9?"0"+(targetDate.getMonth()+1).toString():(targetDate.getMonth()+1).toString());
        let dayString = (targetDate.getDate()<10?"0"+targetDate.getDate().toString():targetDate.getDate().toString());

        return (hourString+":"+minuteString+", "+dayString+"/"+monthString);
    };


    useEffect(()=>{
        console.log("Chatroom mounted!");
        //Login anonymously
        //Note that if an anonymous user is already logged in, 
        //this signin will return the old anonymous user
        firebase.auth().signInAnonymously()
            .then(async (userCredential)=>{
                const currentUid = firebase.auth().currentUser.uid;
                //Clear any unnecessary items in Web Storage
                let i = 0;
                while (i != localStorage.length){
                    if (localStorage.key(i) != `heartlinehk-${currentUid}`){
                        console.log(localStorage.key(i));
                        localStorage.removeItem(localStorage.key(i));
                    }else i = i+1;
                }
                //If no valid last login time or the last login time is more than 10 minutes ago,
                //the old anonymous user should be deleted
                const lastLoginTime = Number(localStorage.getItem(`heartlinehk-${currentUid}`));
                const currentTime = Date.now();
                if (isNaN(lastLoginTime) || ((currentTime - lastLoginTime) > 600000)){
                    localStorage.removeItem(`heartlinehk-${currentUid}`);
                    await typingRef.child(currentUid).remove();
                    await disconnectRef.child(currentUid).remove();
                    await firebase.auth().currentUser.delete();
                    //Re-signin a new anonymous user
                    await firebase.auth().signInAnonymously();
                }

                //Set Timer to update the last login time every 3 seconds
                if ("loginTimer" in window) clearInterval(window.loginTimer);
                window.loginTimer = setInterval(()=>{
                    if (firebase.auth().currentUser != null){
                        console.log('Changing Last Login Time of '+firebase.auth().currentUser.uid);
                        localStorage.setItem(`heartlinehk-${firebase.auth().currentUser.uid}`, Date.now());
                    }else console.log('Warning: Last Login Time not updated as no user logged in!');
                }, 3000);
                //Setup Chatroom Listener (if the user has unfinished chat)
                setupChatroomListener(false);
            })
            .catch((error)=>{
                console.error("ERROR: "+error.message);
            });

        return ()=>{
            console.log("Chatroom Unmounted!");
            const localCurrentVolun = (currentVolun?currentVolun:sessionStorage.getItem('heartlinehk-currentVolun'));

            //Stop last login timer
            if ("loginTimer" in window) clearInterval(window.loginTimer);

            //Dequeue if user is in queue 
            if (firebase.auth().currentUser != null) dequeueChat();

            //Unsubscribe to chatroom listener and connection listener if user is in chat
            if (firebase.auth().currentUser != null && localCurrentVolun != null){
                firebase.database().ref(`chat_log/${localCurrentVolun}`).off('value');
                firebase.database().ref('.info/connected').off('value');
                typingRef.child(localCurrentVolun).off('value');
            }
        };
    }, []);

    useEffect(()=>{
        //Update the look of connecting messages in Signal style
        if (messageContainerDiv.current){
            let messagesList = messageContainerDiv.current.children;
            for (let i=0; i<messagesList.length; i++){
                if (!messagesList[i].classList.contains("special")){
                    let lastMessage = (i == 0?"None":(messagesList[i-1].classList.contains("left")?"Left":"Right"))
                    let nextMessage = (i == messagesList.length-1?"None":(messagesList[i+1].classList.contains("left")?"Left":"Right"))
                    let currentMessage = (messagesList[i].classList.contains("left")?"Left":"Right")
                    if (lastMessage == currentMessage){
                        if (currentMessage == "Left") messagesList[i].style.borderTopLeftRadius = "0.3rem";
                        else messagesList[i].style.borderTopRightRadius = "0.3rem";
                    }
                    if (nextMessage == currentMessage){
                        if (currentMessage == "Left") messagesList[i].style.borderBottomLeftRadius = "0.3rem";
                        else messagesList[i].style.borderBottomRightRadius = "0.3rem";
                    }
                }
            }
        }
    });

    useEffect(()=>{
        //Scrolling to latest message
        if (chatLog.length > 0){
            messageContainerDiv.current.scrollTo(0, messageContainerDiv.current.scrollHeight);
        }
    }, [chatLog]);

    return (
        <div className="chatroom">

            <div className="main-text">
                <h1>聊天室</h1>
                <p>你好，歡迎進入HeartlineHK聊天室，我們每天由7pm至5am提供服務。<span>我們堅守匿名、保密、不批判、非指導性的四大原則，請放心和我們聊天。</span></p>
            </div>
            {!isTandCRead &&
            <div className="t-and-c-container">
                <div className="toggle-lang-container">
                    <p>英文和中文版本若有任何模糊不清或歧義之處，一概以英文版本爲準。</p>
                    <button className="toggle-lang-btn" onClick={()=>{setIsEnglishTandC(!isEnglishTandC)}}>{(isEnglishTandC?"切換至中文服務條款":"Switch to English T&C")}</button>
                </div>
                <h3 className="title">警告</h3>
                <p><b><u>使用Heartline Hong Kong Limited提供的服務(“服務”)，即表示您同意我們的服務條款(“條款”)。請在使用我們的服務前仔細閱讀條款。</u></b>如果您不同意這些條款，則不得使用服務。 您可以在“<Link to="/related-services">相關服務</Link>”頁面找到其他熱線列表。</p>
                <p><b><u>我們的服務不是諮詢服務。Heartline Hong Kong Limited及其提供的服務不能替代任何醫療保健或由持牌的專業人員提供的服務。如果您對任何醫療或精神健康狀況有任何疑慮、疑問或問題，或者正在經歷醫療上的緊急情況，我們誠摯敦促您尋求持牌的專業人員(尤其是醫生或其他合資格醫護人員)的專業幫助和意見。您完全理解並同意如果您未能尋求該等專業幫助或意見，Heartline Hong Kong Limited無須負上或承擔任何責任。</u></b></p>
                {!isEnglishTandC && 
                <>
                    <h3 className="title">服務條款</h3>
                    <p>
                        <b>簡介</b><br/>
                        <br/>
                        Heartline Hong Kong Limited(擔保有限公司)是由一群香港大學生創立的非牟利的慈善團體。 我們希望幫助15至24 歲需要同伴支持的年輕人，並透過電話和即時短信的渠道連繫他們與我們的義工，以匿名、保密、非批判性和非指導性的方式，獲得情感上的支持和陪伴。在營運變動(定義如下)所限下，有關服務在每天晚上 7 點至凌晨 5 點(香港時間UTC/GMT+8)免費提供。
                    </p>
                    <p>
                        <b>使用本服務之條件</b><br/>
                        <br/>
                        在使用或訪問服務之前，請仔細閱讀以下條款。<br/>
                        <br/>
                        使用或訪問服務即表示您同意這些條款。本網站將被稱為“網站”，其社交媒體頁面將被稱為“社交媒體”。<br/>
                        <br/>
                        這些條款規限您使用和訪問服務，以及您與Heartline Hong Kong Limited 之間的關係。這些條款以英文起草及翻譯爲中文。英文和中文版本若有任何模糊不清或歧義之處，一概以英文版本爲準。<br/>
                        <br/>
                        這些條款可能會不時更改。任何條款的修改在發布後立即生效。我們可以通過任何方式發布修改後的條款，包括但不限於在網站上發布。在您每次訪問服務時，我們都會顯示最新的條款。您繼續使用本網站、服務或社交媒體，即表示您接受當時最新的條款。<br/>
                        <br/>
                        如果您對這些條款有任何疑問，您可以發送電子郵件至 <a href="mailto:heartlinehongkong@gmail.com">heartlinehongkong@gmail.com</a> 與我們聯繫。 如果您不同意這些條款，則不得使用服務。 您可以在“相關服務”頁面找到其他熱線列表。
                    </p>
                    <p>
                        <b>營運變動</b><br/>
                        <br/>
                        Heartline Hong Kong Limited有權隨時對服務、本網站或社交媒體，以及使用和訪問服務、本網站或社交媒體所需的設備、硬件或軟件作出任何修改、改進、變更、降級或其他更改(“營運變動”)。為免生疑問，營運變動亦包括終止、消除、補充、修改、添加或中斷服務、本網站或社交媒體上或通過服務、本網站或社交媒體提供的任何內容、功能、數據或服務。<br/>
                        <br/>
                        您理解及承認有關營運變動可能對服務、本網站或社交媒體的質量造成干擾、延遲或產生負面影響。
                    </p>
                    <p>
                        <b>本服務提供的資訊之性質和用途</b><br/>
                        <br/>
                        您承認及理解使用服務、本網站或社交媒體均不構成醫療或精神健康上的護理或治療。Heartline Hong Kong Limited 與您的關係不構成律師與當事人關係、醫護與病人關係，或任何其他持牌專業人士與當事人之間的的專業關係。<b><u>Heartline Hong Kong Limited及其提供的服務不能替代任何醫療保健或由持牌的專業人士提供的任何服務。如果您對任何醫療或心理健康狀況有任何疑慮、疑問或問題，或者正在經歷醫療緊急情況，我們敦促您尋求持牌專業人員(尤其是醫生或其他合資格醫護專業人士)的專業幫助和意見。您完全理解並同意如果您未能尋求該等專業幫助和意見，Heartline Hong Kong Limited並不會負上或承擔任何責任。</u></b>
                    </p>
                    <p>
                        <b>知識產權</b><br/>
                        <br/>
                        任何在服務、本網站和社交媒體的知識產權(定義如下)、權益和所有權在任何時候均屬於Heartline Hong Kong Limited的專有財產。“知識產權”包括(但不限於)專利(包括小專利、實用證書和實用新型)、設計(無論是否能夠註冊)、版權(包括計算機軟件的權利)、數據庫、商標、標誌和服務標記、商號和商業名稱(無論這些名稱是否已註冊及包括任何此類事物的註冊申請)，以及與上述任何各項類似或具有同等或類似效果位於世界各地的一切保護形式或保護權。
                    </p>
                    <p>
                        <b>使用服務的風險和法律責任的限度</b><br/>
                        <br/>
                        您瞭解並同意使用本網站、服務和資料的風險由您自己承擔。 您承擔使用本網站、服務和資料(包括但不限於其中包含的任何資訊)的所有責任和風險。 Heartline Hong Kong Limited 及任何其義工、社工營運機構、贊助商或代理人(合稱“義工”)將不對您或第三方因使用Heartline Hong Kong Limited的服務，或在使用服務後，或基於依賴Heartline Hong Kong Limited 包含或通過Heartline Hong Kong Limited提供的資訊，而作出的任何決定或決定的結果或採取的行動負責。 這包括您是否選擇尋求專業意見，或者是否根據服務提供的資訊更改或終止您正在接受的某項特定治療。<br/>
                        <br/>
                        本服務是在“原樣”和“可用”的基礎上提供的。Heartline Hong Kong Limited、其代理人及義工明確否認任何形式的保證和條件(不論明示或暗示)；並且不保證或陳述 Heartline Hong Kong Limited 將 (a) 滿足您的要求； (b) 不間斷、及時、安全、無錯誤、無病毒或準確； (c) 可銷售或適合特定用途；或 (d) 滿足您的期望。上述免責聲明適用於所有損害或法律責任，包括因操作或傳輸的任何失敗、錯誤、遺漏、中斷、刪除、缺陷或延遲而導致的損害或法律責任，無論是由於違反合同(包括根據任何彌償保障)、侵權行為，包括疏忽及失實陳述，或任何其他訴訟因由。在不限制上述規定的情況下，在任何情況下，Heartline Hong Kong Limited 或其任何營運商均不對任何直接的、特殊的、偶然的、財務性的、後果性的、間接的、懲罰性或懲戒性的損害或任何其他損失承擔任何責任。在任何情況下，Heartline Hong Kong Limited或任何關聯方均不對您使用或依賴通過本網站或服務接觸或以其他方式獲得的任何內容承擔或負上責任。
                    </p>
                    <p>
                        <b>彌償保證</b><br/>
                        <br/>
                        您同意使Heartline Hong Kong免受因以下事由而造成的損失承擔責任： (a) 您違反這些條款； (b) 您的違法行為； (c) 第三方聲稱您違反了這些條款； (d) 您在使用服務過程中提供的資訊； 和/或 (e) 您使用服務。 您同意您獨自因任何直接的、特殊的、偶然的、財務性的、後果性的、間接的、懲罰性或懲戒性的損害或任何其他損失承擔全部責任。
                    </p>
                    <p>
                        <b>僅合法使用</b><br/>
                        <br/>
                        您同意僅出於合法目的使用本服務，並且不會侵犯、限制或禁止任何第三方使用和享用本網站、服務或社交媒體的權利。 此類限制和禁止包括但不限於:非法行為或可能騷擾或對任何人造成困擾或不便的行為，傳輸淫褻或令人反感的資料，以及干擾使用服務時的正常對話流程。 我們保留隨時單方面終止您訪問服務的權利。
                    </p>
                    <p>
                        <b>網站和社交媒體的準確性</b><br/>
                        <br/>
                        Heartline Hong Kong Limited 會定期更新本網站和社交媒體上的資訊。 然而，Heartline Hong Kong Limited 不能保證或對所提供資訊的準確性、時效性或完整性的負上任何責任或義務。Heartline Hong Kong Limited 可修改、補充或刪除本網站或社交媒體中包含的任何資訊、服務和/或資源，並保留進行此類更改的權利，且無須事先另行通知過去、當前或潛在用戶。
                    </p>
                    <p>
                        <b>第三方之服務</b><br/>
                        <br/>
                        您可以通過經批准的第三方網站、應用程序或服務(“第三方服務”)來聯絡我們。 這些條款僅適用於您和Heartline Hong Kong Limited。 Heartline Hong Kong Limited 不對任何第三方服務的政策或做法負責，也不對其作任何陳述。 如果您通過第三方服務與我們聯繫，您將受這些條款以及第三方服務的條款和政策約束。 我們鼓勵您查閱用於聯絡Heartline Hong Kong Limited 的任何第三方服務的條款和政策。 如果您不希望受第三方服務條款或政策的約束，請不要通過第三方服務聯絡 Heartline Hong Kong Limited，而您應該通過我們建基於網絡的聊天平台與我們聯絡。<br/>
                        <br/>
                        網站上在提供服務期間的第三方服務連結或轉介僅為方便您而已。您承認Heartline Hong Kong Limited並無監察或認可第三方服務或該等服務所提供的任何資訊或轉介。<br/>
                        <br/>
                        Heartline Hong Kong Limited 對此類網站或服務不承擔或負上任何責任，也不對因使用或依賴任何第三方網站、服務或鏈接資源上可供使用或提供的資訊、內容、商品或服務而造成或聲稱造成或與之相關的任何損害或損失承擔直接或間接的法律責任。<br/>
                        <br/>
                        Heartline Hong Kong Limited 對任何及所有第三方網站連接到本網站的超連結均不承擔任何責任。
                    </p>
                    <p>
                        <b>適用法律</b><br/>
                        <br/>
                        這些條款和服務的提供僅受香港法律管轄，並應根據香港法律(除了法律衝突原則)進行解釋。 Heartline Hong Kong Limited 和您均同意香港法院對因條款及服務引起或與條款及服務有關的所有事項和爭議擁有專屬管轄權。<br/>
                        <br/>
                        服務在香港營運。 如果您位於香港境外，請注意您提供的任何資訊將在香港收集或轉移到香港並根據香港法律使用。 使用服務和/或向我們提供您的資訊，即表示您同意此種收集、轉移和使用。
                    </p>
                    <p>
                        <b>可分割性協議</b><br/>
                        <br/>
                        如果法院認定這些條款的任何規定無效或不可執行，則應盡最大可能執行該規定，其餘條款應保持完全有效。 這些條款構成您與 Heartline Hong Kong Limited 之間的完整協議，取代任何其他書面或口頭協議或理解。
                    </p>
                    <p>
                        <b>私隱政策及保密義務</b><br/>
                        <br/>
                        Heartline Hong Kong Limited 認同保密是其提供的服務的重要組成部分，故致力於維護本政策中概述的保密原則。以下私隱政策聲明規範您對本網站、服務和社交媒體的使用。使用本服務前，請閱讀以下內容。<br/>
                        <br/>
                        Heartline Hong Kong Limited承諾遵守與處理個人身份資料有關的所有適用法律。“個人身份資料”是指可用於直接或間接識別您身份的任何數據或資料，包括但不限於您的全名、位置、家庭住址或在線標識符、一項或多項關於您的生理、心理、經濟、文化或社會身份的具體因素。<br/>
                        <br/>
                        本服務將嚴格保密。Heartline Hong Kong Limited的任何會員或志願工作者及義工不得使用、披露或發布任何保密資料。保密資料是指：(i) 屬於您的個人資料，您合理地預期此類資料將會保密及不打算將此類資料透露給公眾，及 (ii) 以一種明確表明擬對此類資料保密的方式傳達此類資料。<br/>
                        <br/>
                        <b><u>儘管有上述規定，Heartline Hong Kong Limited 或義工可以在下列情況下披露保密資料：(i) 在法律或任何監管或政府機構要求的範圍內或出於任何司法程序的目的；(ii) 向其專業顧問披露；(iii) 如果該資料並非由於 Heartline Hong Kong Limited 或義工的過失而進入公共領域，且披露的範圍應以進入公共領域者爲限；(iv) 在您已事先同意披露的範圍内；(v) 如果Heartline Hong Kong Limited或義工獨自認爲您對您自己或第三方造成傷害的風險較高及可以預見。</u></b>在法律允許的範圍內，Heartline Hong Kong Limited 將盡合理努力通知您有關任何保密資料的披露事宜。您承認由於我們服務用戶的匿名性質，我們可能無法作出此類通知。<br/>
                        <br/>
                        義工已接受有關保密問題的廣泛培訓，並了解此政策。他們必須在開始志願活動之前簽署協議以維護此保密政策。在回覆即時訊息、電話和電子郵件時，可能會涉及多於一名義工。<br/>
                        <br/>
                        <u>服務終止後，“私隱政策”及“保密義務”下所載的條款及義務將繼續適用。</u>義工應在服務期間及停止提供義工服務後履行保密義務。 因此，已停止向 Heartline Hong Kong Limited 提供義工服務的義工仍然不得在服務之外討論電話內容。
                    </p>
                </>}
                {isEnglishTandC && 
                <>
                    <h3 className="title">Terms and Conditions</h3>
                    <p>
                        <b>Introduction</b><br />
                        <br />
                        Heartline Hong Kong Limited (Company Limited by Guarantee) is founded by a group of university students in Hong Kong. Our goal is to help young people between the ages of 15-24 needing peer support by connecting these individuals with our volunteers for emotional support via calls and text messages in an anonymous, confidential, non-judgemental and non-directive way. The Service is free of charge. Subject to any Operational Change (defined below), the Service is available from 7 p.m. to 5 a.m. (Hong Kong time UTC/GMT+8) every day. 
                    </p>
                    <p>
                        <b>Use of This Service</b><br />
                        <br />
                        Before using or accessing the Service, please read the following carefully.<br />
                        <br />
                        By using or accessing the Service, you agree to the Terms. This website will be referred as the ‘Website’; while its social media pages will be referred as its ‘Social Media’.<br />
                        <br />
                        The Terms govern your use and access of the Service and the relationship between you and Heartline Hong Kong Limited. The Terms are drafted in English and translated into Chinese. In the event of any ambiguity or discrepancy between the English and Chinese versions, the terms in English shall prevail.<br />
                        <br />
                        The Terms may be modified from time to time. Any modifications to the Terms will be effective immediately upon posting, which we may provide by any means including, without limitation, posting on the Website. You will be presented with the most up-to-date Terms every time you access the Service. Your continued use of this Website, the Service or the Social Media will constitute your acceptance of the most up-to-date Terms at the time.<br />
                        <br />
                        If you have any enquiries regarding these Terms, you may contact us by email at <a href="mailto:heartlinehongkong@gmail.com">heartlinehongkong@gmail.com</a>. If you do not agree to these Terms, you must not use the Service. You may find a list of other hotlines at the page ‘Related Services’.
                    </p>
                    <p>
                        <b>Operational Change</b><br />
                        <br />
                        Heartline Hong Kong Limited reserves the right at any time to make any modification, improvement, alteration, degradation or other change to the Service, Website or Social Media as well as the equipment, hardware or software required to use and access the Service, Website or Social Media (an ‘Operational Change’). For the avoidance of doubt, Operational Change also includes terminating, eliminating, supplementing, modifying, adding or discontinuing any content or feature or data or service on or available through the Service, Website or Social Media.<br />
                        <br />
                        You understand and acknowledge such Operational Change may cause disruption, delay, or have an adverse effect on the quality of the Service, Website or Social Media.
                    </p>
                    <p>
                        <b>Nature and Use of Information Provided through This Service</b><br />
                        <br />
                        You acknowledge and understand that the use of Service, Website or the Social Media does not constitute medical or mental health care or treatment. Heartline Hong Kong Limited’s relationship with you does not constitute an attorney-client relationship, doctor-patient relationship, or any other sort of professional relationships between a licensed professional and a client. <b><u>Heartline Hong Kong Limited and the Service are not a substitute for any services provided by any healthcare or licensed professionals. If you have any concerns, doubts or questions regarding any medical or mental health condition or are experiencing a medical emergency, we urge you to seek the advice of licensed professionals, particularly your doctor or other qualified healthcare professionals. You fully understand and agree that Heartline Hong Kong Limited will not be liable or bear any responsibility if you fail to seek such advice.</u></b>
                    </p>
                    <p>
                        <b>Intellectual Property Rights</b><br />
                        <br />
                        Any Intellectual Property Rights (as defined below), interests and title in the Service, Website and Social Media shall at all times remain the exclusive property of Heartline Hong Kong Limited. ‘Intellectual Property Rights’ include (but are not limited to) rights in patents (including petty patents, utility certificates and utility models), designs (whether or not capable of registration), copyrights (including rights in computer software), database rights, trade marks, signs and service marks, trade and business names, (whether or not any of these is registered and including applications for registration of any such thing) and all rights or forms of protection of a similar nature or having equivalent or similar effect to any of the foregoing which may subsist anywhere in the world.
                    </p>
                    <p>
                        <b>Risks of Use of the Service and Limitation of Liability</b><br />
                        <br />
                        You acknowledge that you are using the Website, the Service, and the materials at your own risk. You assume all responsibility and risk for use of this Website, the Service and the materials including without limitation any of the information contained therein. Heartline Hong Kong Limited and any of its volunteers, social worker operators, sponsors or agents (collectively, the ‘Volunteers’) will not be liable for any decision made, or results of the decisions made, or actions taken, by you or a third party while, as a result of, or after using the Service, or based on reliance upon the information contained on or provided through Heartline Hong Kong Limited. This includes whether you choose to seek or not seek professional advice, or to modify or terminate specific treatment that you are currently receiving based on the information provided by the Service. <br />
                        <br />
                        The Service is provided on an ‘as is’ basis and ‘as available’ basis. Heartline Hong Kong Limited, its agents and the Volunteers expressly disclaim all warranties and conditions of any kind, whether express or implied; and make no warranty or representation that Heartline Hong Kong Limited will (a) meet your requirements; (b) be uninterrupted, timely, secure, error-free, bug-free, virus-free, or accurate; (c) merchantable or fit for a particular purpose; or (d) meet your expectations. The foregoing disclaimers of liability apply to all damages or liability, including those caused by any failure of performance, error, omission, interruption, deletion, defect or delay in operation or transmission, whether for breach of contract (including under any indemnity), tortious acts, including negligence and misrepresentation, or any other cause of action. Without limiting the foregoing, in no event shall Heartline Hong Kong Limited or any of its operators be liable for any direct, special, incidental, financial, consequential, indirect, punitive, or exemplary damages or any other losses. Under no circumstances shall Heartline Hong Kong Limited or any related parties be responsible or liable for your use or reliance of any content accessed or otherwise obtained through this Website or the Service.
                    </p>
                    <p>
                        <b>Indemnification</b><br />
                        <br />
                        You agree to hold us harmless for damages arising out of (a) your breach of these Terms; (b) your violation of the law; (c) claims asserted by third parties that you are in breach of these Terms; (d) information provided by you through the Service; and/or (e) your use of the Service. You agree that you shall be solely liable for any direct, special, incidental, financial, consequential, indirect, punitive, or exemplary damages or any other losses that arise.
                    </p>
                    <p>
                        <b>Only Lawful Use</b><br />
                        <br />
                        You agree to use the Service only for lawful purposes, and in a manner which does not infringe the rights of, restrict, or inhibit the use and enjoyment of this Website, Service or Social Media by any third party. Such restriction and inhibition include, and are not limited to, conduct which is unlawful or which may harass or cause distress or inconvenience to any person, the transmission of obscene or offensive materials, and disruption of the normal flow of dialogue while using the Service. We reserve the right to unilaterally terminate your access to the Service at any time.
                    </p>
                    <p>
                        <b>Accuracy of Website and Social Media</b><br />
                        <br />
                        Heartline Hong Kong Limited updates the information on this Website and the Social Media periodically. However, Heartline Hong Kong Limited cannot guarantee or accept any responsibility or liability for the accuracy, currency or completeness of the information provided. Heartline Hong Kong Limited may revise, supplement or delete any information, services and/or the resources contained in the Website or the Social Media and reserves the right to make such changes without prior notice to past, current or prospective users.
                    </p>
                    <p>
                        <b>Third Party Services</b><br />
                        <br />
                        You may contact us through approved third party websites, applications or services (‘Third Party Services’). These Terms only apply to you and Heartline Hong Kong Limited. Heartline Hong Kong Limited is not responsible for, and makes no representations regarding the policies or practices of any Third Party Services. If you contact us through a Third Party Service, you are subject to these Terms as well as the terms and policies of the Third Party Service. We encourage you to review the terms and policies of any Third Party Service you use to contact Heartline Hong Kong Limited. If you do not wish to be subject to a Third Party Service’s terms or policies, please do not contact Heartline Hong Kong Limited through a Third Party Service. Instead, you should contact us by using our web-based chat platform. <br />
                        <br />
                        You may contact us through approved third party websites, applications or services (‘Third Party Services’). These Terms only apply to you and Heartline Hong Kong Limited. Heartline Hong Kong Limited is not responsible for, and makes no representations regarding the policies or practices of any Third Party Services. If you contact us through a Third Party Service, you are subject to these Terms as well as the terms and policies of the Third Party Service. We encourage you to review the terms and policies of any Third Party Service you use to contact Heartline Hong Kong Limited. If you do not wish to be subject to a Third Party Service’s terms or policies, please do not contact Heartline Hong Kong Limited through a Third Party Service. Instead, you should contact us by using our web-based chat platform. <br />
                        <br />
                        Heartline Hong Kong Limited does not assume or accept any responsibility for such websites or services and shall not be liable, directly or indirectly, for any damages or loss, caused or alleged to be caused by or in connection with the use or the reliance upon any information, content, goods or services available on or through any third party websites, services or linked resources. <br />
                        <br />
                        Heartline Hong Kong Limited is not responsible for hypertext links from any and all third-party websites to the Website.
                    </p>
                    <p>
                        <b>Governing Law </b><br />
                        <br />
                        The Terms and the provision of the Service are governed solely by, and shall be construed according to, the laws of Hong Kong without giving effect to the principles of conflict of laws. Heartline Hong Kong Limited and you both consent to the exclusive jurisdiction of the Hong Kong Courts over all matters and disputes arising out of or in connection with the Terms and the Service. <br />
                        <br />
                        The Service is operated in Hong Kong. If you are located outside of Hong Kong, please be aware that any information you provide will be collected in or transferred to Hong Kong and used in accordance with Hong Kong laws. By using the Service and/or providing us with your information, you consent to such collection, transfer and use.
                    </p>
                    <p>
                        <b>Severability: Entire Agreement</b><br />
                        <br />
                        If a court finds any provision of these Terms to be invalid or unenforceable, that provision shall be enforced to the maximum extent possible and the remaining Terms shall remain in full force and effect. These Terms constitute the entire agreement between you and Heartline Hong Kong Limited, superseding any other written or oral agreements or understandings.
                    </p>
                    <p>
                        <b>Privacy Policy and Confidentiality Obligation</b><br />
                        <br />
                        Heartline Hong Kong Limited recognizes that confidentiality is a crucial part of the Service it offers and, as such, is committed to upholding the principle as outlined in this policy. The following Privacy Policy Statement governs your use of the Website, Service and Social Media. Before using the Service, please read the following. <br />
                        <br />
                        Heartline Hong Kong Limited undertakes to comply with all applicable law relating to the processing of Personally Identifiable Information. ‘Personally Identifiable Information’ is any data or information that can be used to identify you, directly or indirectly, including but not limited to, your full name, location, home address or an online identifier, one or more factors specific to your physical, physiological, mental, economic, cultural or social identity. <br />
                        <br />
                        The Service will be strictly confidential. Any member or volunteer of Heartline Hong Kong Limited and the Volunteers shall not use, disclose or publish any Confidential Information. Confidential Information means: (i) information that is personal to you, that you reasonably expect such information to be private and that you do not intend such information to be imparted to the general public and (ii) information that is communicated in a manner which makes it clear that such information is intended to be confidential. <br />
                        <br />
                        <b><u>Notwithstanding the above, Heartline Hong Kong Limited or the Volunteers may disclose Confidential information (i) if and to the extent required by law [or by any regulatory or governmental body] or for the purpose of any judicial proceeding; (ii) to its professional advisors; (iii) if and to the extent that the information has come into the public domain through no fault of Heartline Hong Kong Limited or the Volunteers; (iv) if and to the extent that you have given prior consent to the disclosure; (v) if, in the sole opinion of Heartline Hong Kong Limited or a Volunteer, that there is a high and foreseeable risk that you will cause harm to yourself or to a third party.</u></b> To the extent permitted by the law, Heartline Hong Kong Limited will make reasonable efforts to notify you of any disclosure of Confidential Information. You acknowledge that such notification may not be possible due to the anonymity of our service users. <br />
                        <br />
                        Volunteers are extensively trained about the issues surrounding confidentiality and are aware of this policy. They are required to sign an agreement to uphold this confidentiality policy prior to starting their volunteering activities. In the case of instant messaging, calls and emails, more than one of the Volunteers may be involved in the handling of the messages, calls or emails. <br />
                        <br />
                        <b><u>The terms and obligations under ‘Privacy Policy and Confidentiality obligation’ shall continue to apply after the termination of the Service.</u></b> Volunteers will maintain confidentiality both whilst volunteering and after they cease to volunteer. Thus Volunteers who have stopped volunteering with Heartline Hong Kong Limited will still not discuss contents of calls outside of the Service. 
                    </p>
                </>}
                <input type="checkbox" name="t-and-c-checkbox" id="t-and-c-checkbox" onClick={toggleTandCChecked}/>
                <label htmlFor="t-and-c-checkbox">本人已細閱並同意以上服務條款</label>
                <button className="start-chat-btn" disabled={!isTandCChecked} onClick={toggleEnqueueDequeue}>開始聊天</button>
            </div>
            }
            {isTandCRead && 
            <div className="chat-container">
                <PopupModal modalId={"recordform-modal"} iframeSrc={recordFormUrl}></PopupModal>
                <ConfirmModal modalId={"endchat-modal"} confirmText={"你確定要結束對話嗎？"} formSubmitHandler={endChatFormHandler}></ConfirmModal>
                {currentVolun && <button type="button" name="endchat-btn" id="endchat-btn" onClick={()=>{document.getElementById("endchat-modal").classList.add("opened")}}><span className="material-icons">cancel</span></button>}
                <div ref={messageContainerDiv} className="messages-container">
                    {isDisconnected &&
                        <div className="loader">
                            <div className="spinning-circle"></div>
                            <p className="connecting-text">重新連線中…</p>
                        </div>
                    }
                    {isInQueue && 
                        <div className="loader">
                            <div className="spinning-circle"></div>
                            <p className="queuing-text">正在等待義工，請不要關閉或刷新視窗</p>
                        </div>
                    }
                    {chatLog.length > 0 && chatLog.map((val, idx)=>{
                        let currentUser = (firebase.auth().currentUser?firebase.auth().currentUser:chatLog[0]['spc']);
                        return(
                            <p key={val['chatId']} className={"message "+(val['spc']?"special":(val['uid'] === currentUser.uid?"right":"left"))}>
                                {(val['msg']?val['msg']:(specialChatMessages[val['spc']]?specialChatMessages[val['spc']]:specialChatMessages['clientId']))}
                                <span>{getFormattedDateString(val['time'])}</span>
                            </p>
                        );
                    })}
                </div>
                <form className="input-container" onSubmit={sendChatMessage}>
                    {isVolunTyping && 
                        <p className="typing-msg">義工正在輸入...</p>
                    }
                    <button type="button" name="emoji-btn" id="emoji-btn" onClick={toggleEmojiPicker}><span className="material-icons">emoji_emotions</span></button>
                    <input type="text" name="msg-input" id="msg-input" placeholder="按此對話…" onInput={changeTypingStatus}  onChange={changeTypingStatus} onPaste={changeTypingStatus} onCut={changeTypingStatus} onSelect={changeTypingStatus}/>
                    <button type="submit" name="submit-btn" id="submit-btn"><span className="material-icons">send</span></button>
                </form>
                {isPickerOpened && <Picker onEmojiClick={emojiPickerHandler}></Picker>}
                <p className="short-description">感謝你的留言，我們會根據留言的先後次序，儘快回覆你。</p>
            </div>
            }
        </div>
    );
}

export default Chatroom;