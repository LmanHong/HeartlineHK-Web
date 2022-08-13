import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import { useEffect, useState, useRef } from "react";
import { useDatabase } from "../hooks/useDatabase";
import { ASSIGNED_STATUS } from "../hooks/useCall";
import "../styles/Supervisor.css";

const Supervisor = (props)=>{

    const specialChatMessages = {
        'clientLeft': "使用者已離開聊天室",
        'volunLeft': "義工已離開聊天室",
        'clientId': "義工已開啟聊天室",
        'noChatStarted': "此義工未有開啟任何對話"
    }

    const [supervisorRef, sLoading, sError, isSupervisor] = useDatabase(`supervisors/${props.currentUser.uid}`);
    const [preferredNameRef, pLoading, pError, preferredNames] = useDatabase('preferred_names');
    const [onlineTimeRef, oLoading, oError, onlineTimes] = useDatabase('online_time');
    const [chatAssignedRef, chatAssignedLoading, chatAssignedError, chatAssigned] = useDatabase('chat_assigned');
    const [callAssignedRef, callAssignedLoading, callAssignedError, callAssigned] = useDatabase('call_assigned');
    const [disconnectTimeRef, dLoading, dError, disconnectTimes] = useDatabase('disconnect_time');
    const [chatlogRef, cLoading, cError, chatLogs] = useDatabase('chat_log');
    const [currentVolun, setCurrentVolun] = useState(null);
    const [currentClient, setCurrentClient] = useState(null);
    const [currentMode, setCurrentMode] = useState(null);


  
    //Refernce of the Message container div 
    const messageContainerDiv = useRef(null);
    //Disconnect time of current client
    const [disconnectTime, setDisconnectTime] = useState(null);
    const [callStatusTime, setCallStatusTime] = useState(null);

    //Online Time local list copy
    const [onlineVoluns, setOnlineVoluns] = useState([]);
    //Chat Log local list copy
    const [chatLog, setChatLog] = useState([]);


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

    //Callback for handling disconnect/reconnect changes
    const handleConnectionChanges = (snapshot)=>{
        setDisconnectTime(snapshot.val());
    };


    const getFormattedDateString = (msec) =>{
        let targetDate = new Date(msec);
        let hourString = (targetDate.getHours()<10?"0"+targetDate.getHours().toString():targetDate.getHours().toString());
        let minuteString = (targetDate.getMinutes()<10?"0"+targetDate.getMinutes().toString():targetDate.getMinutes().toString());
        let monthString = (targetDate.getMonth()<9?"0"+(targetDate.getMonth()+1).toString():(targetDate.getMonth()+1).toString());
        let dayString = (targetDate.getDate()<10?"0"+targetDate.getDate().toString():targetDate.getDate().toString());

        return (hourString+":"+minuteString+", "+dayString+"/"+monthString);
    };

    useEffect(()=>{
        let tmpOnlineVoluns = [];

        let tmpVolunMap = {};
        let tmpCurrentClient = null;
        let tmpCurrentMode = null;

        for (const userId in chatAssigned){
            let volunId = chatAssigned[userId];
            if (!Object.keys(tmpVolunMap).includes(volunId)){
                let volunPreferredName = (preferredNames === null || preferredNames[volunId] === null?volunId:preferredNames[volunId]['preferredName']);
                tmpVolunMap[volunId] = {
                    preferredName: volunPreferredName,
                    isChatting: true,
                    isCalling: false,
                    client: userId
                };
            }else{
                tmpVolunMap[volunId]['isChatting'] = true;
                tmpVolunMap[volunId]['client'] = userId;
            }
        }

        for (const userId in callAssigned){
            let volunId = callAssigned[userId]['volunId'];
            if (!Object.keys(tmpVolunMap).includes(volunId)){
                let volunPreferredName = (preferredNames === null || preferredNames[volunId] === null?volunId:preferredNames[volunId]['preferredName']);
                tmpVolunMap[volunId] = {
                    preferredName: volunPreferredName,
                    isChatting: false,
                    isCalling: true,
                    client: userId
                };
            }else{
                tmpVolunMap[volunId]['isCalling'] = true;
                tmpVolunMap[volunId]['client'] = userId;
            }
        }

        for (const volunId in onlineTimes){
            if (!Object.keys(tmpVolunMap).includes(volunId)){
                let volunPreferredName = (preferredNames === null || preferredNames[volunId] === null?volunId:preferredNames[volunId]['preferredName']);
                tmpVolunMap[volunId] = {
                    preferredName: volunPreferredName,
                    isChatting: false,
                    isCalling: false,
                    client: null
                };
            }
        }

        for (const volunId in tmpVolunMap){
            if (currentVolun !== null && volunId === currentVolun){
                tmpCurrentClient = tmpVolunMap[volunId]['client'];
                tmpCurrentMode = (tmpVolunMap[volunId]['isChatting']?'chat':(tmpVolunMap[volunId]['isCalling']?'call':null));
            }
            tmpOnlineVoluns.push({
                volunId,
                preferredName: tmpVolunMap[volunId]['preferredName'],
                isChatting: tmpVolunMap[volunId]['isChatting'],
                isCalling: tmpVolunMap[volunId]['isCalling']
            });
        }

        if (currentVolun !== null){
            if (!Object.keys(tmpVolunMap).includes(currentVolun)) setCurrentVolun(null);
            setCurrentClient(tmpCurrentClient);
            setCurrentMode(tmpCurrentMode);
        }

        setOnlineVoluns(tmpOnlineVoluns);
    }, [currentVolun, onlineTimes, chatAssigned, callAssigned, preferredNames]);



    useEffect(()=>{
        if (currentClient !== null && disconnectTimes !== null) setDisconnectTime(disconnectTimes[currentClient]);
        else setDisconnectTime(null);
    }, [disconnectTimes, currentClient]);

    useEffect(()=>{
        if (currentClient !== null && currentMode === 'call' && callAssigned !== null && callAssigned[currentClient] !== null) setCallStatusTime(callAssigned[currentClient]['time']);
        else setCallStatusTime(null);  
    }, [callAssigned, currentClient, currentMode]);

    useEffect(()=>{
        let tmpChatLog = [];
        if (currentVolun !== null && chatLogs !== null){
            for (const chatId in chatLogs[currentVolun]){
                tmpChatLog.push({
                    'chatId': chatId,
                    'uid': chatLogs[currentVolun][chatId]['uid'],
                    'time': chatLogs[currentVolun][chatId]['time'],
                    'msg': chatLogs[currentVolun][chatId]['msg'],
                    'spc': chatLogs[currentVolun][chatId]['spc']
                });
            }
        }
        setChatLog(tmpChatLog);
    }, [chatLogs, currentVolun]);

    useEffect(()=>{
        //if (chatLog.length > 0) messageContainerDiv.current.scrollTo(0, messageContainerDiv.current.scrollHeight);

        // TODO: Directly scroll to bottom if the message container is near the bottom enough,
        // show "New Unread Messages" if otherwise
    }, [chatLog, messageContainerDiv]);

    return (
        <div className="supervisor">
            {isSupervisor === null && <h2>沒有管理員權限</h2>}
            {isSupervisor !== null && 
            <>
                <div className="volunteers-container">
                    {onlineVoluns.map((val, idx)=><button key={"online-volun-"+idx} className={"volun-btn"+((currentVolun !== null && currentVolun === val['volunId'])?" selected":"")+(val['isChatting']?" chatting":"")+(val['isCalling']?" calling":"")} value={val['volunId']} onClick={(e)=>setCurrentVolun(e.target.value)}>{val['preferredName']}</button>)}
                </div>
                {disconnectTime != null && <p className="disconnect-msg">使用者已於{getFormattedDateString(disconnectTime)}開始離線。</p>}
                {currentMode !== 'call' &&
                    <div ref={messageContainerDiv} className="chat-container">
                        {currentVolun !== null && currentClient !== null && chatLog.length > 0 && chatLog.map((val, idx)=>
                            <p key={val['chatId']} className={"message "+(val['spc']?"special":(val['uid'] === currentVolun?"right":"left"))}>
                                {(val['msg']?val['msg']:(specialChatMessages[val['spc']]?specialChatMessages[val['spc']]:specialChatMessages['clientId']))}
                                <span>{getFormattedDateString(val['time'])}</span>
                            </p>
                        )}
                        {currentVolun !== null && currentClient === null && <p key="nochatstarted" className="message special">{specialChatMessages['noChatStarted']}</p>}
                    </div>
                }
                {currentMode === 'call' && 
                    <div className="call-container">
                        <span className="material-icons">wifi_calling_3</span>
                        {currentVolun !== null && currentClient !== null && callAssigned !== null && callAssigned[currentClient] !== null && callAssigned[currentClient]['status'] == ASSIGNED_STATUS.CALL_ASSIGNED && <h4 className="call-assigned-status">已於{getFormattedDateString(callStatusTime)}安排使用者與義工對話，正等待義工接聽電話</h4>}
                        {currentVolun !== null && currentClient !== null && callAssigned !== null && callAssigned[currentClient] !== null && callAssigned[currentClient]['status'] == ASSIGNED_STATUS.CALL_ACCEPTED && <h4 className="call-assigned-status">對話已於{getFormattedDateString(callStatusTime)}開始...</h4>}
                        {currentVolun !== null && currentClient !== null && callAssigned !== null && callAssigned[currentClient] !== null && callAssigned[currentClient]['status'] == ASSIGNED_STATUS.CLIENT_LEFT && <h4 className="call-assigned-status">使用者已於{getFormattedDateString(callStatusTime)}完成對話，正等待義工結束對話</h4>}
                    </div>

                }
                
            </>
            }
        </div>
    );
};

export default Supervisor;