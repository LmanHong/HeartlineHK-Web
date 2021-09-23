import Footer from "../components/Footer.js";
import ConfirmModal from "../components/ConfirmModal.js";
import PopupModal from "../components/PopupModal.js";
import "../styles/Chatroom.css";
import Picker from "emoji-picker-react";
import { useCallback, useEffect, useRef, useState } from "react";
import firebase from "firebase/app";
import "firebase/database";
import "firebase/auth";

const Chatroom = () =>{

    const specialChatMessages = {
        'clientLeft': "您已離開聊天室",
        'volunLeft': "義工已離開聊天室",
        'clientId': "義工已開啟聊天室"
    }

    const recordFormUrl = "https://sprw.io/stt-f768f9";

    const queueRef = firebase.database().ref('chat_queue');
    const assignedRef = firebase.database().ref('room_assigned');
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
                <h3 className="title">警告</h3>
                <p>請在使用我們的服務前仔細閱讀以下條款。若您使用我們的服務，即表示您同意我們的條款。如果您不同意這些條款，則不得使用服務。 您可以在“相關服務”頁面找到其他熱線列表。</p>
                <p>我們的服務不是諮詢服務。 我們不能替代任何專業醫療保健服務或由持牌專業人員提供的任何其他服務。<b>如果您對醫療或心理健康狀況有任何疑問，或者正在經歷醫療上的緊急情況，我們誠摯敦促您尋求醫生或其他合資格執業人士的專業幫助和建議。</b></p>

                <h3 className="title">服務條款</h3>
                <p>
                    <b>Introduction</b><br />
                    <br />
                    Heartline Hong Kong Limited (Company Limited by Guarantee) is founded by a group of university students in Hong Kong. Our goal is to help young people between the ages of 15-24 needing peer support by connecting these individuals with our volunteers for emotional support via calls and text messages in an anonymous, confidential, non-judgemental and non-directive way. The service is free of charge and is available from 7pm to 5am every day in Hong Kong. 
                </p>
                <p>
                    <b>Use of This Service</b><br />
                    <br />
                    Before using or accessing the service provided by Heartline Hong Kong Limited (the ‘Service’), please read the following carefully. <br />
                    <br />
                    By accessing or using the Service, you agree to these Terms of Service (the ‘Terms’). This website will be referred as the ‘Website’; while its social media pages will be referred as its ‘Social Media’.<br />
                    <br />
                    These Terms govern your access and use of the Service and the relationship between you and Heartline Hong Kong Limited. If you have any enquiries regarding these Terms, you may contact us by email at <a href="mailto:heartlinehongkong@gmail.com">heartlinehongkong@gmail.com</a>. If you do not agree to these Terms, you may not use the Service. You may find a list of other hotlines at the page ‘Related Services’.
                </p>
                <p>
                    <b>Modification of Terms and Conditions</b><br />
                    <br />
                    Heartline Hong Kong Limited reserves the right at any time to change (i) the Terms; (ii) this Website or the Service, including terminating, eliminating, supplementing, modifying, adding or discontinuing any content or feature or data or service on or available through this Website or the Service or the hours that they are available; and (iii) the equipment, hardware or software required to use and access this Website or the Service. These Terms may be modified from time to time to make sure that the Service works effectively and in accordance with the law.<br />
                    <br />
                    Any changes will be effective immediately upon posting, which we may provide by any means including, without limitation, posting on the Website. One will be presented with the updated terms every time the service is accessed. Your continued use of this Website or the Service after posting will constitute your acceptance of the revised Terms. Be sure to return to this Website periodically to ensure you are familiar with the most current version of these Terms.
                </p>
                <p>
                    <b>Nature and Use of Information Provided through This Service</b><br />
                    <br />
                    Please be noted that your participation in Heartline Hong Kong Limited does not constitute medical or mental health care or treatment. Heartline Hong Kong Limited’s relationship with you does not constitute an attorney-client relationship, doctor-patient relationship, or any other sort of professional relationships between a licensed professional and a client. Our service is not a substitute for any professional healthcare or any other services provided by licensed professionals. <b><u>If you believe you have any questions regarding a medical or mental health condition or are experiencing a medical emergency, we urge you to seek the advice of licensed professionals, particularly your doctor or other qualified healthcare professionals.</u></b>
                </p>
                <p>
                    <b>Risks of Use of the Service and Limitation of Liability</b><br />
                    <br />
                    You acknowledge that you are using the Website, the Service, and the materials at your own risk. You assume all responsibility and risk for use of this Website, the Service and the materials including without limitation any of the information contained therein. Heartline Hong Kong Limited and any of its volunteers, social worker operators, sponsors or agents will not be liable for any decision made, or results of the decisions made, or actions taken, by you or a third party while, as a result of, or after using the Service, or based on reliance upon the information contained on or provided through Heartline Hong Kong Limited. This includes whether you choose to seek or not seek professional advice, or to modify or terminate specific treatment that you are currently receiving based on the information provided by the Service.<br />
                    <br />
                    The Service is provided on an ‘as is’ basis and ‘as available’ basis. Heartline Hong Kong Limited and its operators expressly disclaim all warranties and conditions of any kind, whether express or implied; and make no warranty or representation that Heartline Hong Kong Limited will (a) meet your requirements; (b) be uninterrupted, timely, secure, error-free, bug-free, virus-free, or accurate; (c) merchantable or fit for a particular purpose; or (d) meet your expectations. The foregoing disclaimers of liability apply to all damages or liability, including those caused by any failure of performance, error, omission, interruption, deletion, defect or delay in operation or transmission, whether for breach of contract, tortious behaviors, including negligence, or any other cause of action. Without limiting the foregoing, in no event shall Heartline Hong Kong Limited or any of its operators be liable for any special, incidental, consequential, indirect damages or other damages whatsoever. Under no circumstances shall Heartline Hong Kong Limited or any related parties be responsible for your use or reliance of any content accessed or otherwise obtained through this Website or the Service.<br />
                </p>
                <p>
                    <b>Indemnification</b><br />
                    <br />
                    You agree to hold us harmless for damages arising out of (a) your breach of these Terms; (b) your violation of the law; (c) claims asserted by third parties that you are in breach of these Terms; (d) information provided by you through the Service; and/or (e) your use of the Service. You agree that you shall be solely liable for any special, incidental, consequential, indirect damages that arise.
                </p>
                <p>
                    <b>Only Lawful Use</b><br />
                    <br />
                    You agree to use the Service only for lawful purposes, and in a manner which does not infringe the rights of, restrict, or inhibit the use and enjoyment of this Website and Service by any third party. Such restriction and inhibition include, and are not limited to, conduct which is unlawful or which may harass or cause distress or inconvenience to any person, the transmission of obscene or offensive materials, and disruption of the normal flow of dialogue while using the Service. We may unilaterally terminate your access to the Service at any time.
                </p>
                <p>
                    <b>Accuracy of Website and Social Media</b><br />
                    <br />
                    Heartline Hong Kong Limited updates the information on this Website and the Social Media periodically. However, Heartline Hong Kong Limited cannot guarantee or accept any responsibility or liability for the accuracy, currency or completeness of the information provided. Heartline Hong Kong Limited may revise, supplement or delete any information, services and/or the resources contained in the Website or the Social Media and reserves the right to make such changes without prior notice to past, current or prospective users.
                </p>
                <p>
                    <b>Third Party Services</b><br />
                    <br />
                    You may contact us through approved third party websites, applications or services (‘Third Party Services’). These Terms only apply to you and Heartline Hong Kong Limited. Heartline Hong Kong Limited is not responsible for, and makes no representations regarding the policies or practices of any Third Party Services. If you contact us through a Third Party Service, you are subject to these Terms as well as the terms and policies of the Third Party Service. We encourage you to review the terms and policies of any Third Party Service you use to contact Heartline Hong Kong Limited. If you do not wish to be subject to a Third Party Service’s terms or policies, please do not contact Heartline Hong Kong Limited through a Third Party Service. Instead, you should contact us by using our web-based chat platform.<br />
                    <br />
                    Links or referrals to Third Party Services may be provided on the Website and made during the Service for your convenience only. The provision of such information or referrals does not imply that Heartline Hong Kong Limited monitors or endorses those websites or services. Heartline Hong Kong Limited does not accept any responsibility for such websites or services and shall not be liable, directly or indirectly, for any damages or loss, caused or alleged to be caused by or in connection with the use or the reliance upon any information, content, goods or services available on or through any third party websites, services or linked resources.<br />
                    <br />
                    Heartline Hong Kong Limited is not responsible for hypertext links from any and all third-party websites to the Website.
                </p>
                <p>
                    <b>Governing Law: International Users</b><br />
                    <br />
                    These Terms and the provision of the Service is governed solely by, and shall be construed according to, the laws of Hong Kong without giving effect to the principles of conflict of law. Heartline Hong Kong Limited and you both consent to the exclusive jurisdiction of the Hong Kong Courts over all matters and disputes arising out of or in connection with the Service.<br />
                    <br />
                    The Service is operated in Hong Kong. If you are located outside of Hong Kong, please be aware that any information you provide will be collected in or transferred to Hong Kong and used in accordance with Hong Kong laws. By using the Service and/or providing us with your information, you consent to such collection, transfer and use.
                </p>
                <p>
                    <b>Severability: Entire Agreement</b><br />
                    <br />
                    If a court finds any provision of these Terms to be invalid or unenforceable, that provision shall be enforced to the maximum extent possible and the remaining Terms shall remain in full force and effect. These Terms constitute the entire agreement between you and Heartline Hong Kong Limited, superseding any other written or oral agreements or understandings.
                </p>
                <p>
                    <b>Privacy Policy</b><br />
                    <br />
                    Heartline Hong Kong Limited recognizes that confidentiality is a crucial part of the Service it offers and, as such, is committed to upholding the principle as outlined in this policy. The following Privacy Policy Statement governs your use of the Website and the Service. Before using the Service, please read the following.<br />
                    <br />
                    ‘Personally Identifiable Information’ is any data or information that can be used to identify you, directly or indirectly, including but not limited to, your full name, location, home address or an online identifier, one or more factors specific to your physical, physiological, mental, economic, cultural or social identity.<br />
                    <br />
                    Volunteers will maintain confidentiality both whilst volunteering and after they cease to volunteer. Thus volunteers who have stopped volunteering with Heartline Hong Kong Limited will still not discuss contents of calls or the identities of other volunteers outside of the Service.<br />
                    <br />
                    Heartline Hong Kong Limited does not collect any Personally Identifiable Information. The Service will be strictly confidential. In the case of instant messaging, calls and emails, more than one volunteer may be involved in the handling of the messages, calls or emails. However, information revealed to Heartline Hong Kong Limited remains confidential within Heartline Hong Kong Limited. Any member or volunteer shall not use, disclose or publish any information with persons within or outside Heartline Hong Kong Limited without explicit permission of the service user. Volunteers are extensively trained about the issues surrounding confidentiality and are aware of this policy. They are required to sign an agreement to uphold this confidentiality policy prior to starting their volunteering activities.<br />
                    <br />
                    Heartline Hong Kong Limited recognizes that external organizations or individuals may request information concerning the general running of Heartline Hong Kong Limited. Heartline Hong Kong Limited will not provide information which may in any way contravene the Privacy Policy and any information provided will not go beyond that specifically requested.<br />
                    <br />
                    <b><u>Individual volunteers would never break confidentiality without explicit permission of the service user unless the volunteer subjectively determines that there is a high risk that the service user would cause harm to the service user himself/herself, or cause harm to a third party. In that case, the volunteer may feel morally obliged to share information obtained during the Service with the appropriate agencies.</u></b>
                </p>
                <p>
                    <b>Legal Disclosure of Information</b><br />
                    <br />
                    In the event of receiving a court order to disclose information surrounding any confidential information (messages, calls, emails or other aspects of the Organization), Heartline Hong Kong Limited is obligated to do so and will comply with the request. Heartline Hong Kong Limited will aim to only disclose information relevant to the court order and will disclose the minimum amount required, but may have to make a full disclosure if ordered. After receiving a court order, Heartline Hong Kong Limited will clarify if a) Heartline Hong Kong Limited is legally allowed to inform the service user; and b) it is possible to contact the service user. Heartline Hong Kong Limited acknowledges that this may not be possible due to the anonymity of our service users, but will make all reasonable attempts to do so if legally permitted.
                </p>
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
            <Footer></Footer>
        </div>
    );
}

export default Chatroom;