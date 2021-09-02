import Loading from "../components/Loading.js";
import ConfirmModal from "../components/ConfirmModal.js";
import Picker from "emoji-picker-react";
import "../styles/Chatroom.css";
import newClientSound from "../sound/pristine-609.mp3"
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import { useEffect, useState, useRef } from "react";

const Chatroom = (props) =>{

    const specialChineseChars = ['啲','咁','嗰','咗','喺','係','哋','唔','咩','咪','嘅','㗎','喎','嘢','嚟','囉','乜','叻','呢','啱','睇','諗','噏','嘥','晒','咋','瞓','唞','氹','攰','俾','閂','呀','啦','冧','晏','嬲','喇'];
    const specialChatMessages = {
        'clientLeft': "使用者已離開聊天室",
        'volunLeft': "義工已離開聊天室",
        'clientId': "義工已開啟聊天室"
    }

    //Chat Queue database reference
    const queueRef = firebase.database().ref('chat_queue');
    //Room Assigned database reference
    const assignedRef = firebase.database().ref('room_assigned');
    //Disconnect Time database reference
    const disconnectRef = firebase.database().ref('disconnect_time');
    //Typing Status database reference
    const typingRef = firebase.database().ref('typing_status');
    //Chatroom database reference
    const chatroomRef = firebase.database().ref(`chat_log/${props.currentUser.uid}`);
    //Chat record Google Form
    const recordFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdsD_qLU51OC9UY0Rrx_Ht52aU0TgPU-LUu5yNp4ta8cYu0yQ/viewform?usp=pp_url";    
    //Chat record Google Form field entries
    const recordFormEntries = {
        'date': "entry.1533999842",
        'startTime': "entry.240218030",
        'endTime': "entry.1133078412"
    }
    //Refernce of the Message container div 
    const messageContainerDiv = useRef(null);
    //Reference of the Client container div;
    const clientContainerDiv = useRef(null);
    //Chat Queue local list copy
    const [clientQueue, setClientQueue] = useState([]);
    //Current Chat Client ID
    const [currentClient, setCurrentClient] = useState(null);
    //Disconnect time of current client
    const [disconnectTime, setDisconnectTime] = useState(null);
    //Chat Log local list copy
    const [chatLog, setChatLog] = useState([]);
    //Flag indicating a start-chat is in progress
    const [isStartingChat, setIsStartingChat] = useState(false);
    //Flag indicating an end-chat is in progress
    const [isEndingChat, setIsEndingChat] = useState(false);
    //Flag indicating a chat message is being sent
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    //Flag indicating the chat queue container is shown full screen (in smaller screen devices)
    const [isQueueOpened, setIsQueueOpened] = useState(false);
    //Flag indicating the current client is typing
    const [isClientTyping, setIsClientTyping] = useState(false);
    //Flag indicating the current user is typing
    const [isUserTyping, setIsUserTyping] = useState(false);
    //Flag indicating the emoji picker is opened
    const [isPickerOpened, setIsPickerOpened] = useState(false);


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

    //Callback for handling Chat Queue changes
    const handleQueueChanges = (snapshot)=>{
        let tmpClientQueue = [];
        let isNewEnqueue = false;
        const oldClientQueue = document.querySelectorAll('.chatroom .queue-container .clients-container .queue-client .client-id');
        console.log(snapshot.val());
        if (snapshot.val() != null){
            for (let userId in snapshot.val()){
                tmpClientQueue.push({
                    'userId': userId,
                    'status': snapshot.val()[userId]['status'],
                    'time': snapshot.val()[userId]['time']
                });
                if (!isNewEnqueue){
                    let isOldEnqueue = false;
                    oldClientQueue.forEach((client)=>{
                        if (client.innerHTML === userId) isOldEnqueue = true;
                    });
                    isNewEnqueue = (!isOldEnqueue);
                }
            }
            for (let i=0; i<tmpClientQueue.length; i++){
                for (let j=0; j<tmpClientQueue.length - i - 1; j++){
                    if (tmpClientQueue[j]['time']>tmpClientQueue[j+1]['time']){
                        let tmp = tmpClientQueue[j];
                        tmpClientQueue[j] = tmpClientQueue[j+1];
                        tmpClientQueue[j+1] = tmp;
                    }
                }
            }
        }
        if (isNewEnqueue){
            let audio = new Audio(newClientSound);
            audio.play();
        }
        console.log(tmpClientQueue);
        setClientQueue(tmpClientQueue);
    }

    //Callback for handling disconnect/reconnect changes
    const handleConnectionChanges = (snapshot)=>{
        setDisconnectTime(snapshot.val());
    };

    //Callback for handling typing status changes
    const handleTypingStatusChanges = (snapshot)=>{
        setIsClientTyping(snapshot.val());
    }

    //Function for setting up chatroom database listeners 
    const setupChatroomListener = async ()=>{
        try{
            queueRef.orderByChild('time').on('value', handleQueueChanges);
            chatroomRef.orderByChild('time').on('value', handleChatLogChanges);
            let localCurrentClient = sessionStorage.getItem('heartlinehk-currentClient');
            let assignedSnapshot = await assignedRef.once('value');
            for (let clientId in assignedSnapshot.val()){
                if (assignedSnapshot.val()[clientId] === props.currentUser.uid){
                    if (localCurrentClient !== null && localCurrentClient !== clientId) console.warn("WARNING: updating local current client as it is different from database!");
                    localCurrentClient = clientId;
                    break;
                }
            }
            if (localCurrentClient != null){
                disconnectRef.child(localCurrentClient).on('value', handleConnectionChanges);
                typingRef.child(localCurrentClient).on('value', handleTypingStatusChanges);
                setCurrentClient(localCurrentClient);
                sessionStorage.setItem('heartlinehk-currentClient', localCurrentClient);
            }else console.warn("WARNING: No client is assigned to the current volunteer!");
        }catch(error){
            console.error("ERROR: "+error.message);
        }

    };

    //Function for initiating a new chat
    const startNewChat = async (e)=>{
        //Progress variable indicates the progress of the start-chat function
        //This can be used to reset everything done if an error has occurred
        let progress = 0;
        //Temp target client ID
        let tmpCurrentClient = null;
        //Temp target client's time-of-arrival in queue
        let tmpInQueueTime = null;
        try{
            //Check if a new chat is already starting
            if (isStartingChat) throw new Error("Already starting a new chat!");
            setIsStartingChat(true);

            //Check if all database references are available
            if (!queueRef){
                setIsStartingChat(false);
                throw new ReferenceError("Chat Queue reference not available!");
            }else if (!assignedRef){
                setIsStartingChat(false);
                throw new ReferenceError("Room Assigned reference not available!");
            }else if (!chatroomRef){
                setIsStartingChat(false);
                throw new ReferenceError("Chat Room reference not available!");
            }else if (!disconnectRef){
                setIsStartingChat(false);
                throw new ReferenceError("Disconnect Time reference not available!");
            }else if (!typingRef){
                setIsStartingChat(false);
                throw new ReferenceError("Typing Status reference not available!");
            }
            //Check if current client is already set
            else if (currentClient != null){
                setIsStartingChat(false);
                throw new Error("CurrentClient is already set!");
            }else{
                //Get the target client
                let snapshot = await queueRef.orderByChild('time').once('value');
                let tmpClientQueue = [];
                if (snapshot.val() != null){
                    for (let userId in snapshot.val()){
                        tmpClientQueue.push({
                            'userId': userId,
                            'status': snapshot.val()[userId]['status'],
                            'time': snapshot.val()[userId]['time']
                        });
                    }
                    for (let i=0; i<tmpClientQueue.length; i++){
                        for (let j=0; j<tmpClientQueue.length - i - 1; j++){
                            if (tmpClientQueue[j]['time']>tmpClientQueue[j+1]['time']){
                                let tmp = tmpClientQueue[j];
                                tmpClientQueue[j] = tmpClientQueue[j+1];
                                tmpClientQueue[j+1] = tmp;
                            }
                        }
                    }
                }
                for (let i in tmpClientQueue){
                    if (tmpClientQueue[i]['status'] === "inQueue"){
                        tmpCurrentClient = tmpClientQueue[i]['userId'];
                        tmpInQueueTime = tmpClientQueue[i]['time'];
                        break;
                    }
                }
                if (tmpCurrentClient === null){
                    setIsStartingChat(false);
                    throw new RangeError("No available client in chat queue!");
                }

                //Set target client queue status to "roomAssigned"
                //This is to prevent multiple volunteers dequeueing the same client
                let queueClientRef = queueRef.child(tmpCurrentClient);
                let queueClientTransaction = await queueClientRef.transaction((queueClient)=>{
                    if (queueClient === null){
                        console.error("ERROR: Required Queue Client is Null!");
                        return;
                    }else if (queueClient['status'] === 'roomAssigned'){
                        console.error("ERROR: Required Queue Client has already assigned a room!");
                        return;
                    }else if (queueClient['status'] === 'inQueue'){
                        return ({
                            'status': "roomAssigned",
                            'time': firebase.database.ServerValue.TIMESTAMP
                        });
                    }else{
                        console.error("Unknown Error!");
                        return;
                    }
                });
                if (queueClientTransaction.error){
                    setIsStartingChat(false);
                    throw new Error(queueClientTransaction.error);
                } else if (!queueClientTransaction.committed){
                    setIsStartingChat(false);
                    throw new Error("Client Queue Transaction Aborted!");
                }
                progress += 1;

                //Set the assigned room of the client to current volunteer ID
                let assignedClientRef = assignedRef.child(tmpCurrentClient);
                let assignedClientTransaction = await assignedClientRef.transaction((assignedClient)=>{
                    if (assignedClient === null){
                        return props.currentUser.uid;
                    }else{
                        console.error("ERROR: Client to be assigned has a non-null volunteer ID!");
                        return;
                    }
                });
                if (assignedClientTransaction.error){
                    setIsStartingChat(false);
                    throw new Error(assignedClientTransaction.error);
                }else if (!assignedClientTransaction.committed){
                    setIsStartingChat(false);
                    throw new Error("Client Room Assigned Transaction Aborted!");
                }
                progress += 1;

                //If Chatroom is not empty, remove all previous messages
                let tmpChatLog = (await chatroomRef.once('value')).val();
                if (tmpChatLog != null) await chatroomRef.remove();
                progress += 1;

                //Send an initial message to the chat
                let initialMessageRef = await chatroomRef.push();
                let initialMessageTransaction = await initialMessageRef.transaction((initialMessage)=>{
                    if (initialMessage === null){
                        return {
                            'uid': props.currentUser.uid,
                            'time': firebase.database.ServerValue.TIMESTAMP,
                            'spc': tmpCurrentClient
                        };
                    }else{
                        console.error("ERROR: Initial Message is not null!");
                        return;
                    }
                });
                if (initialMessageTransaction.error){
                    setIsStartingChat(false);
                    throw new Error(initialMessageTransaction.error);
                }else if (!initialMessageTransaction.committed){
                    setIsStartingChat(false);
                    throw new Error("Initial Message Transaction Aborted!");
                }
                progress += 1;

                //Set current client
                sessionStorage.setItem('heartlinehk-currentClient', tmpCurrentClient);
                setCurrentClient(tmpCurrentClient);

                //Subscribe to current client's disconnect time and typing status
                disconnectRef.child(tmpCurrentClient).on('value', handleConnectionChanges);
                typingRef.child(tmpCurrentClient).on('value', handleTypingStatusChanges);

                //End of procedure of starting a new chat
                setIsStartingChat(false);
            }
        }catch(error){
            console.error("ERROR: "+error.message);
            //Resets all finished progress
            if (progress >= 1) await queueRef.child(tmpCurrentClient).set({
                'status': "inQueue",
                "time": tmpInQueueTime
            });
            if (progress >= 2) await assignedRef.child(tmpCurrentClient).remove();
            //If the step fails at this stage, 
            //meaning all the works on database are done.
            //So no resetting is needed. 
            if (progress >= 4){
                sessionStorage.setItem('heartlinehk-currentClient', tmpCurrentClient);
                setCurrentClient(tmpCurrentClient);
                setIsStartingChat(false);
            }
            alert(error.message);
        }
    }

    //Function for ending a continuing chat
    const endChat = async () =>{
        //Progress variable indicates the progress of the start-chat function
        //This can be used to reset everything done if an error has occurred
        let progress = 0;
        //Flag indicating if the client has left or not
        let isClientLeft = false;
        //Start and End Chat Time in milliseconds
        let startChatMsec = 0;
        let endChatMsec = 0;
        try{
            //Check if a chat is already ending
            if (isEndingChat) throw new Error("Already ending a chat!");
            setIsEndingChat(true);

            //Check if all database references are available
            if (!assignedRef){
                setIsEndingChat(false);
                throw new ReferenceError("Room Assigned reference not available!");
            }else if (!chatroomRef){
                setIsEndingChat(false);
                throw new ReferenceError("Chat Room reference not available!");
            }else if (!disconnectRef){
                setIsEndingChat(false);
                throw new ReferenceError("Disconnect Time reference not available!");
            }else if (!typingRef){
                setIsEndingChat(false);
                throw new ReferenceError("Typing Status reference not available!");
            }
            //Check if current client is null or not
            else if (currentClient == null){
                setIsEndingChat(false);
                throw new Error("Current Client is null!");
            }else{
                //Check if current client has left
                //The client has left when either the room assigned is null
                let snapshot = await assignedRef.child(currentClient).once('value');
                let isRoomAssignedNull = (snapshot.val() === null);
                //or the chat log has a special message of "clientLeft"
                let tmpChatLog = (await chatroomRef.once('value')).val();
                let isSpecialMessage  = false; 
                if (tmpChatLog != null){
                    for (let chatId in tmpChatLog){
                        if (tmpChatLog[chatId]['spc'] === "clientLeft"){
                            isSpecialMessage = true;
                            break;
                        } 
                    }
                }
                //Also check if the client is still in queue(i.e. never accept the chat)
                let isClientInQueue = ((await queueRef.child(currentClient).once('value')).val() != null);
                console.log(isRoomAssignedNull, isSpecialMessage, isClientInQueue);
                isClientLeft = (isRoomAssignedNull || isSpecialMessage);
                progress += 1;

                //If client hasn't left, set the room assigned to "volunLeft"
                if (!isClientLeft){
                    if (!isRoomAssignedNull) await assignedRef.child(currentClient).set("volunLeft");
                    if (isClientInQueue) await queueRef.child(currentClient).remove();
                }
                progress += 1;

                //Get the start and end time of the chat
                let initialChatMessage = (await chatroomRef.orderByChild('time').limitToFirst(1).once('value')).val();
                for (let chatId in initialChatMessage) startChatMsec = initialChatMessage[chatId]['time'];
                endChatMsec = Date.now();

                //Delete the chat log
                let chatroomTransaction = await chatroomRef.transaction((chatLog)=>{
                    if (chatLog != null){
                        return null;
                    }else{
                        console.error("ERROR: Chat Log in Chatroom already null!");
                        return;
                    }
                });
                if (chatroomTransaction.error){
                    setIsEndingChat(false);
                    throw new Error(chatroomTransaction.error);
                }else if (!chatroomTransaction.committed){
                    setIsEndingChat(false);
                    throw new Error("Chatrom Transaction Aborted!");
                }
                setChatLog([]);
                progress += 1;

                //Remove Typing Status
                await typingRef.child(props.currentUser.uid).remove();

                //Unsubscribe to current client's disconnect time and typing status
                disconnectRef.child(currentClient).off('value');
                setDisconnectTime(null);
                typingRef.child(currentClient).off('value');
                setIsClientTyping(false);

                //Reset current client
                sessionStorage.removeItem('heartlinehk-currentClient');
                setCurrentClient(null);
                
                //End of procedure of ending a chat
                setIsEndingChat(false);

                //Open popup window for chat record form
                let startChatTime = new Date(startChatMsec);
                const startChatHour = (startChatTime.getHours()<10?"0"+startChatTime.getHours().toString():startChatTime.getHours().toString());
                const startChatMinutes = (startChatTime.getMinutes()<10?"0"+startChatTime.getMinutes().toString():startChatTime.getMinutes().toString());
                let endChatTime = new Date(endChatMsec);
                const endChatHour = (endChatTime.getHours()<10?"0"+endChatTime.getHours().toString():endChatTime.getHours().toString());
                const endChatMinutes = (endChatTime.getMinutes()<10?"0"+endChatTime.getMinutes().toString():endChatTime.getMinutes().toString());
                const currentMonth = (endChatTime.getMonth()+1<10?"0"+(endChatTime.getMonth()+1).toString():(endChatTime.getMonth()+1).toString());
                const currentDay = (endChatTime.getDate()<10?"0"+endChatTime.getDate().toString():endChatTime.getDate().toString());
                const prefilledRecordFormUrl = recordFormUrl+'&'+recordFormEntries['date']+'='+endChatTime.getFullYear()+'-'+currentMonth+'-'+currentDay+'&'+recordFormEntries['startTime']+'='+startChatHour+":"+startChatMinutes+'&'+recordFormEntries['endTime']+'='+endChatHour+":"+endChatMinutes;
                let popupWindowRef = window.open(prefilledRecordFormUrl, "ChatRecordForm", 'resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes');
                
            }
        }catch(error){
            console.error("ERROR: "+error.message);
            if (progress >= 2){
                if (!isClientLeft) await assignedRef.child(currentClient).set(props.currentUser.uid);
            } 
            //If the step fails at this stage, 
            //meaning all the works on database are done.
            //So no resetting is needed. 
            if (progress >= 3){
                disconnectRef.child(currentClient).off('value');
                setDisconnectTime(null);
                typingRef.child(currentClient).off('value');
                setIsClientTyping(false);

                sessionStorage.removeItem('heartlinehk-currentClient');
                setCurrentClient(null);

                let startChatTime = new Date(startChatMsec);
                const startChatHour = (startChatTime.getHours()<10?"0"+startChatTime.getHours().toString():startChatTime.getHours().toString());
                const startChatMinutes = (startChatTime.getMinutes()<10?"0"+startChatTime.getMinutes().toString():startChatTime.getMinutes().toString());
                let endChatTime = new Date(endChatMsec);
                const endChatHour = (endChatTime.getHours()<10?"0"+endChatTime.getHours().toString():endChatTime.getHours().toString());
                const endChatMinutes = (endChatTime.getMinutes()<10?"0"+endChatTime.getMinutes().toString():endChatTime.getMinutes().toString());
                const currentMonth = (endChatTime.getMonth()+1<10?"0"+(endChatTime.getMonth()+1).toString():(endChatTime.getMonth()+1).toString());
                const currentDay = (endChatTime.getDate()<10?"0"+endChatTime.getDate().toString():endChatTime.getDate().toString());
                const prefilledRecordFormUrl = recordFormUrl+'&'+recordFormEntries['date']+'='+endChatTime.getFullYear()+'-'+currentMonth+'-'+currentDay+'&'+recordFormEntries['startTime']+'='+startChatHour+":"+startChatMinutes+'&'+recordFormEntries['endTime']+'='+endChatHour+":"+endChatMinutes;
                let popupWindowRef = window.open(prefilledRecordFormUrl, "ChatRecordForm", 'resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes');
            }
            alert(error.message);
        }

    }

    //Function for sending chat message
    const sendChatMessage = async (e)=>{
        e.preventDefault();
        try{
            //Check if a message is already sending
            if (isSendingMessage) throw new Error("Already sending a message!");
            setIsSendingMessage(true);

            //Check if a chat is ongoing
            if (currentClient === null){
                setIsSendingMessage(false);
                throw new Error("Current Client is null!");
            }
            //Check if the message to be sent is empty
            let messageToBeSent = document.getElementById('msg-input').value;
            if (messageToBeSent === null || messageToBeSent === ""){
                setIsSendingMessage(false);
                throw new Error("Message to be sent is empty!");
            }else if (!chatroomRef){
                setIsSendingMessage(false);
                throw new ReferenceError("Chatroom reference not available!");
            }else if (!typingRef){
                setIsSendingMessage(false);
                throw new ReferenceError("Typing Status reference not available!");
            }else{
                //Send the message to chatroom
                let newMessageRef = await chatroomRef.push();
                let newMessageTransaction = await newMessageRef.transaction((newMessage)=>{
                    if (newMessage === null){
                        return {
                            'uid': props.currentUser.uid,
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
                await typingRef.child(props.currentUser.uid).set(false);

                //Clear the message input
                document.getElementById('msg-input').value = "";
                console.log("Message sent!");

                setIsSendingMessage(false);
            }
        }catch (error){
            console.error("ERROR: "+error.message);
            alert(error.message);
        }
    };

    //Function for changing the typing status of current user on database
    const changeTypingStatus = (e)=>{
        if (currentClient){
            const currentlyTyping = (e.target.value != "");
            if (currentlyTyping != isUserTyping){
                if (typingRef){
                    setIsUserTyping(currentlyTyping);
                    typingRef.child(props.currentUser.uid).set(currentlyTyping);
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

    //Callback for handling the form submission of start chat confirmation modal
    const startChatFormHandler = (e)=>{
        e.preventDefault();
        const modalContainerDiv = e.target.parentElement.parentElement;
        if (modalContainerDiv.id === "startchat-modal"){
            const isConfirmed = (e.target.className === "confirm-btn");
            if (isConfirmed){
                toggleQueue();
                startNewChat();
            }
            modalContainerDiv.classList.remove("opened");
        }else console.error("ERROR: Parent Element is not a start chat modal!");
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

    //Function for side-scrolling the special chinese character container
    const scrollSpecialChar = (e)=>{
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const spcCharDiv = document.querySelector('.chatroom .chat-container .special-char-container');
        const arrowButton = (e.target.className === "material-icons"?(e.target.innerHTML === "arrow_back_ios"?"back-arrow":"forward-arrow"):e.target.className);
        if (arrowButton === "back-arrow") spcCharDiv.scrollBy(-(1.3 * rem + 12), 0);
        else if (arrowButton === "forward-arrow") spcCharDiv.scrollBy((1.3 * rem + 12), 0);
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
        setupChatroomListener();

        return ()=>{
            //Unsubscribe events when unmount component
            console.log("Chatroom Unmounted!");
            let localCurrentClient = sessionStorage.getItem('heartlinehk-currentClient');
            queueRef.orderByChild('time').off('value');
            chatroomRef.orderByChild('time').off('value');
            if (localCurrentClient){
                disconnectRef.child(localCurrentClient).off('value');
                typingRef.child(localCurrentClient).off('value');
                sessionStorage.removeItem('heartlinehk-currentClient');
            }
        };
    }, []);

    useEffect(()=>{
        if (chatLog.length > 0){
            messageContainerDiv.current.scrollTo(0, messageContainerDiv.current.scrollHeight);
        }
    }, [chatLog]);

    return (
        <div className="chatroom">
            <ConfirmModal modalId={"endchat-modal"} confirmText={"你確定要結束對話嗎？"} formSubmitHandler={endChatFormHandler}></ConfirmModal>
            <ConfirmModal modalId={"startchat-modal"} confirmText={"你確定要開啟新對話嗎？"} formSubmitHandler={startChatFormHandler}></ConfirmModal>
            {(isStartingChat || isEndingChat) && <Loading></Loading>}
            <div className="chat-container">
                {disconnectTime != null &&
                    <p className="disconnect-msg">使用者已於{getFormattedDateString(disconnectTime)}開始離線。</p>
                }
                <div ref={messageContainerDiv} className="messages-container">
                    {chatLog.map((val, idx)=>{
                        return(
                            <p key={val['chatId']} className={"message "+(val['spc']?"special":(val['uid'] === props.currentUser.uid?"right":"left"))}>
                                {(val['msg']?val['msg']:(specialChatMessages[val['spc']]?specialChatMessages[val['spc']]:specialChatMessages['clientId']))}
                                <span>{getFormattedDateString(val['time'])}</span>
                            </p>
                        );
                    })}
                </div>
                <div className="special-char-container">
                    <button className="back-arrow" onClick={scrollSpecialChar}><span className="material-icons">arrow_back_ios</span></button>
                    {specialChineseChars.map((char, idx)=>{
                        return (
                            <button key={"spc-char"+idx} className="spc-char" onClick={specialCharHandler}>{char}</button>
                        );
                    })}
                    <button className="forward-arrow" onClick={scrollSpecialChar}><span className="material-icons">arrow_forward_ios</span></button>
                </div>
                <form className="input-container" onSubmit={sendChatMessage}>
                    {isClientTyping && 
                        <p className="typing-msg">使用者正在輸入...</p>
                    }
                    <button type="button" name="emoji-btn" id="emoji-btn" onClick={toggleEmojiPicker}><span className="material-icons">emoji_emotions</span></button>
                    <input type="text" name="msg-input" id="msg-input" placeholder="按此對話…" onInput={changeTypingStatus}/>
                    <button type="submit" name="submit-btn" id="submit-btn"><span className="material-icons">send</span></button>
                </form>
                
                {isPickerOpened && <Picker onEmojiClick={emojiPickerHandler}></Picker>}
            </div>
            <div className="queue-container">
                <p className="main-text"><span className="material-icons">people</span><span className="queue-count">{clientQueue.length}</span></p>
                <div ref={clientContainerDiv} className="clients-container">
                    {clientQueue.map((val, idx)=>{
                        return (
                            <p key={val['userId']} className={"queue-client"+(val['status'] === "roomAssigned"?" assigned":"")}>
                                Client <span className="client-id">{val['userId']}</span>
                                <span className="enqueue-time" data-time={val["time"]}>{(val["status"] === "roomAssigned"?"被接收":"入隊")}時間: {getFormattedDateString(val['time'])}</span>
                            </p>
                        );
                    })}
                </div>
                <div className="buttons-container">
                    <button type="submit" name="start-btn" id="start-btn" disabled={currentClient != null || clientQueue.length <= 0} onClick={()=>{document.getElementById("startchat-modal").classList.add("opened")}}>開始對話</button>
                    <button type="submit" name="end-btn" id="end-btn" disabled={currentClient == null} onClick={()=>{document.getElementById("endchat-modal").classList.add("opened")}}>結束對話</button>
                </div>
            </div>
            <button className="queue-toggle" onClick={toggleQueue}><span className="material-icons">{(isQueueOpened?"chat":"contacts")}</span></button>
        </div>
    );
}

export default Chatroom;