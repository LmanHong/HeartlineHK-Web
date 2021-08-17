import Footer from "../components/Footer.js";
import "../styles/Chatroom.css";
import { useEffect, useRef, useState } from "react";
import firebase from "firebase/app";
import "firebase/database";
import "firebase/auth";

const Chatroom = () =>{

    const messageContainerDiv = useRef(null);
    const [queueRef, setQueueRef] = useState(firebase.database().ref('chat_queue'));
    const [assignedRef, setAssignedRef] = useState(firebase.database().ref('room_assigned'));
    const [chatLog, setChatLog] = useState([]);
    const [chatroomRef, setChatroomRef] = useState(null);
    const [isInQueue, setIsInQueue] = useState(false);
    const [isEnqueuing, setIsEnqueuing] = useState(false);
    const [isDequeuing, setIsDequeuing] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [isEndingChat, setIsEndingChat] = useState(false);
    
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
                endChat(true);
            }else{
                console.log("Room Assigned!");
                //Remove queue entry when room is assigned
                queueRef.child(currentUser.uid).remove();
                //Subscribe to chatroom changes
                let tmpChatroomRef = firebase.database().ref('chat_log').child(snapshot.val());
                tmpChatroomRef.on('value', handleChatLogChanges);
                setChatroomRef(tmpChatroomRef);
                setIsInQueue(false);
                sessionStorage.setItem('heartlinehk-currentVolun', snapshot.val());
            }
        }
    };

    const enqueueChat = async (e) =>{
        try{
            //Check if the user is already euqueuing
            if (isEnqueuing) throw new Error("Already enqueuing!");
            setIsEnqueuing(true);

            let currentVolun = sessionStorage.getItem('heartlinehk-currentVolun');
            let currentUser = firebase.auth().currentUser;

            //Check if the user is already in chat queue
            if (isInQueue){
                setIsEnqueuing(false);
                throw new Error("Already in queue!");
            }
            //Check if all database references are available
            else if (!queueRef){
                setIsEnqueuing(false);
                throw new ReferenceError("Chat Queue reference not available!");
            }else if (!assignedRef){
                setIsEnqueuing(false);
                throw new ReferenceError("Room Assigned reference not available!");
            }
            //Check if current volunteer is already set
            else if (currentVolun != null){
                setIsEnqueuing(false);
                throw new Error("CurrentVolun is already set!");
            }
            //Check if current user is null
            else if (currentUser === null){
                setIsEnqueuing(false);
                throw new Error("CurrentUser is null!");
            }else{
                //Enqueue to Chat Queue
                await queueRef.child(currentUser.uid).set({
                    'status': "inQueue",
                    'time': firebase.database.ServerValue.TIMESTAMP
                });
                setIsInQueue(true);

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

            let currentVolun = sessionStorage.getItem('heartlinehk-currentVolun');
            let currentUser = firebase.auth().currentUser;

            //Check if the user is in queue or not
            if (!isInQueue){
                setIsDequeuing(false);
                throw new Error("Not in Chat Queue!");
            }
            //Check if all database references are available
            else if (!queueRef){
                setIsDequeuing(false);
                throw new ReferenceError("Chat Queue reference not available!");
            }else if (!assignedRef){
                setIsDequeuing(false);
                throw new ReferenceError("Room Assigned reference not available!");
            }
            //Check if a chat is ongoing
            else if (currentVolun != null){
                setIsDequeuing(false);
                throw new Error("CurrentVolun is already set!");
            }
            //Check if currentUser is null
            else if (currentUser === null){
                setIsDequeuing(false);
                throw new Error("CurrentUser is null!");
            }else{
                //Dequeue at Chat Queue
                await queueRef.child(currentUser.uid).remove();

                //Unsubscribe to listener of room assigned changes
                assignedRef.child(currentUser.uid).off('value', handleRoomAssignedChanges);
                
                //Reset the in-queue status
                setIsInQueue(false);

                //End of procedure of dequeuing
                setIsDequeuing(false);
            }
        }catch(error){
            console.error("ERROR: "+error.message);

        }
    };

    const endChat = async (isVolunLeft=false)=>{
        try{
            //Check if a chat is already ending
            if (isEndingChat) throw new Error("A chat is already ending!");
            setIsEndingChat(true);

            let currentVolun = sessionStorage.getItem('heartlinehk-currentVolun');
            let currentUser = firebase.auth().currentUser;

            //Check if a chat is ongoing
            if (currentVolun === null){
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
            }else{
                //If the volunteer hasn't left, send a special message of "clientLeft" to chat
                console.log("VolunLeft: "+isVolunLeft);
                if (!isVolunLeft){
                    let specialMessage = await firebase.database().ref(`chat_log/${currentVolun}`).push();
                    await specialMessage.set({
                        'uid': currentUser.uid,
                        'time': firebase.database.ServerValue.TIMESTAMP,
                        'spc': "clientLeft"
                    });
                }

                //Delete the room assigned
                await assignedRef.child(currentUser.uid).remove();

                //Unsubscribe to Chatroom changes
                firebase.database().ref(`chat_log/${currentVolun}`).off('value', handleChatLogChanges);
                setChatroomRef(null);

                //Reset the current volunteer
                sessionStorage.removeItem('heartlinehk-currentVolun');

                //End of procedure of ending a chat
                setIsEndingChat(false);
            }
        }catch(error){  
            console.error("ERROR: "+error.message);
        }
    };

    const toggleEnqueueDequeue = async ()=>{
        if (isInQueue) await dequeueChat();
        else await enqueueChat();
    };

    const sendChatMessage = async (e)=>{
        try{
            //Check if a message is already sending
            if (isSendingMessage) throw new Error("Already sending a message!");
            setIsSendingMessage(true);

            let currentVolun = sessionStorage.getItem('heartlinehk-currentVolun');
            let currentUser = firebase.auth().currentUser;

            //Check if a chat is ongoing
            if (currentVolun === null){
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
            else if (!firebase.database().ref(`chat_log/${currentVolun}`)){
                setIsSendingMessage(false);
                throw new ReferenceError("Chatroom reference not available!");
            }else{
                //Send the message to chatroom
                let newMessageRef = await firebase.database().ref(`chat_log/${currentVolun}`).push();
                await newMessageRef.set({
                    'uid': currentUser.uid,
                    'time': firebase.database.ServerValue.TIMESTAMP,
                    'msg': messageToBeSent
                });
                //Clear the message input
                document.getElementById('msg-input').value = "";
                console.log("Message sent!");

                setIsSendingMessage(false);
            }
        }catch (error){
            console.error("ERROR: "+error.message);
        }
    };


    useEffect(()=>{
        console.log("Chatroom mounted!");

        //Login anonymously
        console.log(firebase.auth().currentUser);
        if (firebase.auth().currentUser == null) firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
            .then(()=>{
                return firebase.auth().signInAnonymously();
            })
            .catch((error)=>{
                console.error("ERROR: "+error.message);
            });

        return ()=>{
            console.log("Chatroom Unmounted!");
            if (firebase.auth().currentUser){
                let currentVolun = sessionStorage.getItem('heartlinehk-currentVolun');
                if (isInQueue) dequeueChat();
                else if (currentVolun != null) endChat();
                firebase.auth().currentUser.delete();
            }
        };
    }, []);

    useEffect(()=>{
        if (messageContainerDiv.current){
            let messagesList = messageContainerDiv.current.children;
            for (let i=0; i<messagesList.length; i++){
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
    });

    return (
        <div className="chatroom">
            <div className="main-text">
                <h1>聊天室</h1>
                <p>你好，歡迎進入HeartlineHK聊天室，<span>我們堅守匿名、保密、不批判、非指導性的四大原則，請放心和我們聊天。</span></p>
            </div>
            <div className="chat-container">
                <p className="short-description">請按一下正下方的「按此對話」開始留言，然後按「送出」。</p>
                <div ref={messageContainerDiv} className="messages-container">
                    {chatroomRef === null && <p className="loader" onClick={toggleEnqueueDequeue}>{(isInQueue?"Now Queuing... Click again to dequeue":"Click to Enqueue")}</p>}
                    {chatroomRef != null && chatLog.map((val, idx)=>{
                        let currentUser = firebase.auth().currentUser;
                        return(
                            <p key={val['chatId']} className={"message "+(val['uid'] === currentUser.uid?"right":"left")}>
                                {(val['msg']?val['msg']:(val['spc']?val['spc']:"No message"))}
                                <span>{val['time']}</span>
                            </p>
                        );
                    })}
                </div>
                <div className="input-container">
                    <input type="text" name="msg-input" id="msg-input" placeholder="按此對話…" />
                    <button type="submit" name="submit-btn" id="submit-btn" onClick={()=>{endChat();}}><span className="material-icons">send</span></button>
                </div>
                <p className="short-description">感謝你的留言，我們會根據留言的先後次序，儘快回覆你。</p>
                <p className="short-description">如果你想立即收到回覆，歡迎致電[hotline number]，與我們一對一語音通話。</p>
            </div>
            <Footer></Footer>
        </div>
    );
}

export default Chatroom;