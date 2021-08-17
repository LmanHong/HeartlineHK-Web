import "../styles/Chatroom.css";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import { useEffect, useState } from "react";

const Chatroom = (props) =>{

    //Chat Queue database reference
    const queueRef = firebase.database().ref('chat_queue');
    //Room Assigned database reference
    const assignedRef = firebase.database().ref('room_assigned');
    //Chatroom database reference
    const chatroomRef = firebase.database().ref(`chat_log/${props.currentUser.uid}`);
    //Chat record Google Form
    const recordFormUrl = "https://forms.gle/gb1uVeXsk75DP8TAA";
    //Chat Queue local list copy
    const [clientQueue, setClientQueue] = useState([]);
    //Current Chat Client ID
    const [currentClient, setCurrentClient] = useState(localStorage.getItem('heartlinehk-currentClient'));
    //Chat Log local list copy
    const [chatLog, setChatLog] = useState([]);
    //Flag indicating a start-chat is in progress
    const [isStartingChat, setIsStartingChat] = useState(false);
    //Flag indicating an end-chat is in progress
    const [isEndingChat, setIsEndingChat] = useState(false);
    //Flag indicating a chat message is being sent
    const [isSendingMessage, setIsSendingMessage] = useState(false);

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
        console.log(snapshot.val());
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
        console.log(tmpClientQueue);
        setClientQueue(tmpClientQueue);
    }

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
                if (tmpCurrentClient === null) throw new RangeError("No available client in chat queue!");

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
                localStorage.setItem('heartlinehk-currentClient', tmpCurrentClient);
                setCurrentClient(tmpCurrentClient);

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
                localStorage.setItem('heartlinehk-currentClient', tmpCurrentClient);
                setCurrentClient(tmpCurrentClient);
                setIsStartingChat(false);
            }
        }
    }

    //Function for ending a continuing chat
    const endChat = async (e) =>{
        //Progress variable indicates the progress of the start-chat function
        //This can be used to reset everything done if an error has occurred
        let progress = 0;
        //Flag indicating if the client has left or not
        let isClientLeft = false;
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

                //Reset current client
                localStorage.removeItem('heartlinehk-currentClient');
                setCurrentClient(null);

                //End of procedure of ending a chat
                setIsEndingChat(false);

                //Open popup window for chat record form
                let popupWindowRef = window.open(recordFormUrl, "ChatRecordForm", 'resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes');
                
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
                localStorage.removeItem('heartlinehk-currentClient');
                setCurrentClient(null);
            }
        }

    }

    const sendChatMessage = async (e)=>{
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
            if (messageToBeSent == null || messageToBeSent == ""){
                setIsSendingMessage(false);
                throw new Error("Message to be sent is empty!");
            }else if (!chatroomRef){
                setIsSendingMessage(false);
                throw new ReferenceError("Chatroom reference not available!");
            }else{
                //Send the message to chatroom
                let newMessageRef = await chatroomRef.push();
                await newMessageRef.set({
                    'uid': props.currentUser.uid,
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
        queueRef.orderByChild('time').on('value', handleQueueChanges);
        chatroomRef.orderByChild('time').on('value', handleChatLogChanges);
        return ()=>{
            //Unsubscribe events when unmount component
            console.log("Chatroom Unmounted!");
            queueRef.orderByChild('time').off('value', handleQueueChanges);
            chatroomRef.orderByChild('time').off('value', handleChatLogChanges);
        };
    }, []);

    return (
        <div className="chatroom">
            <div className="chat-container">
                <div className="messages-container">
                    {chatLog.map((val, idx)=>{
                        return(
                            <p key={val['chatId']} className={"message "+(val['uid'] === props.currentUser.uid?"right":"left")}>
                                {(val['msg']?val['msg']:(val['spc']?val['spc']:"No message"))}
                                <span>{val['time']}</span>
                            </p>
                        );
                    })}
                </div>
                <div className="input-container">
                    <input type="text" name="msg-input" id="msg-input" placeholder="按此對話…" />
                    <button type="submit" name="submit-btn" id="submit-btn" onClick={sendChatMessage}><span className="material-icons">send</span></button>
                </div>
            </div>
            <div className="queue-container">
                <p className="main-text">Queue Count: <span className="queue-count">{clientQueue.length}</span></p>
                <div className="clients-container">
                    {clientQueue.map((val, idx)=>{
                        return (
                            <p key={val['userId']} className={"queue-client"+(val['status'] === "roomAssigned"?" assigned":"")}>Client <span className="client-id">{val['userId']}</span></p>
                        );
                    })}
                </div>
                <div className="buttons-container">
                    <button type="submit" name="start-btn" id="start-btn" disabled={currentClient != null || clientQueue.length <= 0} onClick={startNewChat}>Start Chat</button>
                    <button type="submit" name="end-btn" id="end-btn" disabled={currentClient == null} onClick={endChat}>End Chat</button>
                </div>
                
            </div>
        </div>
    );
}

export default Chatroom;