import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import { useEffect, useState, useRef } from "react";
import "../styles/Supervisor.css";

const Supervisor = (props)=>{

    const specialChatMessages = {
        'clientLeft': "使用者已離開聊天室",
        'volunLeft': "義工已離開聊天室",
        'clientId': "義工已開啟聊天室",
        'noChatStarted': "此義工未有開啟聊天室"
    }
    //Volunteer Online Time database reference
    const onlineTimeRef = firebase.database().ref('online_time');
    //Room Assigned database reference
    const assignedRef = firebase.database().ref('room_assigned');
    //Disconnect Time database reference
    const disconnectRef = firebase.database().ref('disconnect_time');   
    //Chatroom database reference
    const chatroomRef = firebase.database().ref('chat_log');
    //Refernce of the Message container div 
    const messageContainerDiv = useRef(null);
    //Disconnect time of current client
    const [disconnectTime, setDisconnectTime] = useState(null);
    //Online Time local list copy
    const [onlineTime, setOnlineTime] = useState([]);
    //Chat Log local list copy
    const [chatLog, setChatLog] = useState([]);
    //Flag indicating the current user is supervisor
    const [isSupervisor, setIsSupervisor] = useState(false);


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

    //Callback for handling online time changes
    const handleOnlineTimeChanges = (snapshot)=>{
        let tmpOnlineTime = [];
        if (snapshot.val() != null){
            for (const volunId in snapshot.val()) tmpOnlineTime.push(volunId);
        }
        console.log(tmpOnlineTime);
        setOnlineTime(tmpOnlineTime);
    }

    //Callback for handling disconnect/reconnect changes
    const handleConnectionChanges = (snapshot)=>{
        setDisconnectTime(snapshot.val());
    };

    //Function for handling the selection of volunteer
    const selectVolun = async (e)=>{
        const volunId = e.target.innerHTML;
        let clientId = null;
        let assignedClient = (await assignedRef.once('value')).val();
        for (const tmpClientId in assignedClient){
            if (assignedClient[tmpClientId] === volunId){
                clientId = tmpClientId;
                break;
            }
        }
        console.log(volunId);
        console.log(clientId);

        const localCurrentVolun = sessionStorage.getItem('heartlinehk-supervisor-currentVolun');
        const localCurrentClient = sessionStorage.getItem('heartlinehk-supervisor-currentClient');
        if (localCurrentVolun) chatroomRef.child(localCurrentVolun).orderByChild('time').off('value');
        if (localCurrentClient) disconnectRef.child(localCurrentClient).off('value'); 
        
        sessionStorage.setItem('heartlinehk-supervisor-currentVolun', volunId);
        sessionStorage.setItem('heartlinehk-supervisor-currentClient', clientId);
        setDisconnectTime(null);
        if (clientId != null){
            chatroomRef.child(volunId).orderByChild('time').on('value', handleChatLogChanges);
            disconnectRef.child(clientId).on('value', handleConnectionChanges);
        }else setChatLog([{
            'chatId': "nochatstarted",
            'uid': volunId,
            'time': Date.now(),
            'spc': "noChatStarted"
        }]);
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

        firebase.database().ref('supervisors').child(props.currentUser.uid).once('value', (snapshot)=>{
            if (snapshot.val() != null) setIsSupervisor(true);
            else setIsSupervisor(false);
        });
        onlineTimeRef.on('value', handleOnlineTimeChanges);


        return()=>{
            //Unsubscribe events when unmount component
            console.log("Supervisor Unmounted!");
            onlineTimeRef.off('value');
            const localCurrentVolun = sessionStorage.getItem('heartlinehk-supervisor-currentVolun');
            const localCurrentClient = sessionStorage.getItem('heartlinehk-supervisor-currentClient');
            if (localCurrentVolun){
                chatroomRef.child(localCurrentVolun).orderByChild('time').off('value');
                sessionStorage.removeItem('heartlinehk-supervisor-currentVolun');
            }
            if (localCurrentClient){
                disconnectRef.child(localCurrentClient).off('value');
                sessionStorage.removeItem('heartlinehk-supervisor-currentClient');
            }
        }
    }, []);

    useEffect(()=>{
        if (chatLog.length > 0){
            messageContainerDiv.current.scrollTo(0, messageContainerDiv.current.scrollHeight);
        }
    }, [chatLog]);

    return (
        <div className="supervisor">
            <div className="volunteers-container">
                {onlineTime.map((val, idx)=>{
                    const localCurrentVolun = sessionStorage.getItem('heartlinehk-supervisor-currentVolun');
                    return (
                        <button key={"online-volun-"+idx} className={"volun-btn"+(localCurrentVolun === val?" selected":"")} value={val} onClick={selectVolun}>{val}</button>
                    );
                })}
            </div>
            {disconnectTime != null &&
                <p className="disconnect-msg">使用者已於{getFormattedDateString(disconnectTime)}開始離線。</p>
            }
            <div ref={messageContainerDiv} className="chat-container">
                {chatLog.length > 0 && chatLog.map((val, idx)=>{
                    const localCurrentVolun = sessionStorage.getItem('heartlinehk-supervisor-currentVolun');
                    return(
                        <p key={val['chatId']} className={"message "+(val['spc']?"special":(val['uid'] === localCurrentVolun?"right":"left"))}>
                            {(val['msg']?val['msg']:(specialChatMessages[val['spc']]?specialChatMessages[val['spc']]:specialChatMessages['clientId']))}
                            <span>{getFormattedDateString(val['time'])}</span>
                        </p>
                    );
                })}
            </div>
        </div>
    );
};

export default Supervisor;