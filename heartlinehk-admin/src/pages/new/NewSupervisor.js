import { useList, useObjectVal } from 'react-firebase-hooks/database';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref } from 'firebase/database';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ASSIGNED_STATUS } from '../../hooks/useCall';
import { getFormattedDateString } from '../../utils/datetime';
import '../../styles/Supervisor.css';

const Supervisor = () => {

    const specialChatMessages = {
        'clientLeft': "使用者已離開聊天室",
        'volunLeft': "義工已離開聊天室",
        'clientId': "義工已開啟聊天室",
        'noChatStarted': "此義工未有開啟任何對話"
    }

    const firebaseAuth = getAuth();
    const firebaseDB = getDatabase();
    const messageContainerDiv = useRef();
    const [currentUser] = useAuthState(firebaseAuth);
    const [supervisors, supervisorsLoading] = useObjectVal(ref(firebaseDB, 'supervisors'));
    const [preferredNames] = useObjectVal(ref(firebaseDB, 'preferred_names'));
    const [onlineStatus] = useList(ref(firebaseDB, 'online_status'));
    const [onlineTimes] = useList(ref(firebaseDB, 'online_time')); // Depreciated, use onlineStatus instead
    const [disconnectTimes] = useObjectVal(ref(firebaseDB, 'disconnect_time'));
    const [chatAssigned] = useList(ref(firebaseDB, 'chat_assigned'));
    const [callAssigned] = useList(ref(firebaseDB, 'call_assigned'));
    const [chatLogs] = useObjectVal(ref(firebaseDB, 'chat_log'));  
    const isSupervisor = useMemo(() => {
        if (currentUser && supervisors){
            return (supervisors[currentUser.uid] !== undefined)
        }
        return false;
    }, [currentUser, supervisors]);
    const onlineVoluns = useMemo(() => {

        const chattingVoluns = chatAssigned.filter(value => value.val() !== 'volunLeft').map(value => ({
            'preferredName': ((preferredNames && value.val() in preferredNames) ? preferredNames[value.val()]['preferredName'] : value.val()),
            'volunId': value.val(),
            'clientId': value.key,
            'type': 'chat'
        }));
        const chattingVolunIds = chattingVoluns.map(value => value.volunId);

        const callingVoluns = callAssigned.map(value => ({
            'preferredName': ((preferredNames && value.val()['volunId'] in preferredNames) ? preferredNames[value.val()['volunId']]['preferredName'] : value.val()['volunId']),
            'volunId': value.val()['volunId'],
            'clientId': value.key,
            'type': 'call'
        }));
        const callingVolunIds = callingVoluns.map(value => value.volunId);

        const onlineVoluns = onlineStatus.filter(value => callingVolunIds.indexOf(value.key) < 0 && chattingVolunIds.indexOf(value.key) < 0)
            .map(value => ({
                'preferredName': ((preferredNames && value.key in preferredNames) ? preferredNames[value.key]['preferredName'] : value.key),
                'volunId': value.key,
                'clientId': null,
                'type': 'idle'
            }));

        // Depreciated, use onlineVoluns instead
        const onlineTimeVolun = onlineTimes.filter(value => callingVolunIds.indexOf(value.key) < 0 && chattingVolunIds.indexOf(value.key) < 0)
            .map(value => ({
                'preferredName': ((preferredNames && value.key in preferredNames) ? preferredNames[value.key]['preferredName'] : value.key),
                'volunId': value.key,
                'clientId': null,
                'type': 'idle'
            }));

        return onlineVoluns.concat(onlineTimeVolun).concat(chattingVoluns).concat(callingVoluns);
    }, [onlineStatus, chatAssigned, callAssigned, preferredNames]);
    const [currentVolun, setCurrentVolun] = useState(null);
    const currentClient = useMemo(() => 
        (currentVolun ? onlineVoluns.filter(value => value['volunId'] === currentVolun)[0]['clientId'] : null)
    , [onlineVoluns, currentVolun]);
    const currentMode = useMemo(() => 
        (currentVolun ? onlineVoluns.filter(value => value['volunId'] === currentVolun)[0]['type'] : null)
    , [onlineVoluns, currentVolun]);
    const selectedChatLog = useMemo(() => {
        let tmpChatLog = []
        if (currentMode === 'chat' && chatLogs){
            tmpChatLog = Object.keys(chatLogs[currentVolun]).map(key => ({
                'chatId': key,
                ...chatLogs[currentVolun][key]
            })).sort((a, b) => a['time'] - b['time']);
        }
        return tmpChatLog;
    }, [currentMode, currentVolun, chatLogs]);
    const disconnectedAt = useMemo(() => {
        if (currentMode === 'chat' && disconnectTimes){
            return disconnectTimes[currentClient];
        }
        return null;
    }, [currentClient, currentMode, disconnectTimes]);
    const callAssignedStatus = useMemo(() => {
        if (currentMode === 'call' && callAssigned) {
            const filteredAssignedSnapshot = callAssigned.filter(value => value.key === currentClient);
            if (filteredAssignedSnapshot.length > 0){
                const assignedInfo = filteredAssignedSnapshot[0].val();
                switch(assignedInfo['status']) {
                    case ASSIGNED_STATUS.CALL_ASSIGNED:
                        return `已於${getFormattedDateString(assignedInfo['time'])}安排使用者與義工對話，正等待義工接聽電話`;
                    case ASSIGNED_STATUS.CALL_ACCEPTED:
                        return `對話已於${getFormattedDateString(assignedInfo['time'])}開始...`;
                    case ASSIGNED_STATUS.CLIENT_LEFT:
                        return `使用者已於${getFormattedDateString(assignedInfo['time'])}完成對話，正等待義工結束對話`;
                    default:
                        return null;
                }
            }
        }
        return null;
    }, [currentClient, currentMode, callAssigned]);

    useEffect(() => {
        // TODO: Directly scroll to bottom if the message container is near the bottom enough,
        // show "New Unread Messages" if otherwise
    }, [messageContainerDiv, selectedChatLog]);

    return (
        <div className="supervisor">
            {!supervisorsLoading && !isSupervisor && <h2>沒有管理員權限</h2>}
            {!supervisorsLoading && isSupervisor && 
            <>
                <div className="volunteers-container">
                    {onlineVoluns.map((value, idx) => 
                        <button
                            key={"online-volun-"+idx}
                            className={"volun-btn"
                                + (currentVolun && currentVolun === value['volunId'] ? " selected" : "")
                                + (value['type'] === 'chat' ? " chatting" : "")
                                + (value['type'] === 'call' ? " calling" : "")
                            }
                            value={value['volunId']}
                            onClick={e => setCurrentVolun(e.target.value)}
                        >
                            {value['preferredName']}
                        </button>
                    )}
                </div>
                {disconnectedAt && <p className="disconnect-msg">使用者已於{getFormattedDateString(disconnectedAt)}開始離線。</p>}
                {currentMode !== 'call' && 
                <div ref={messageContainerDiv} className="chat-container">
                    {currentVolun && currentMode === 'idle' && <p key="nochatstarted" className="message special">{specialChatMessages['noChatStarted']}</p>}
                    {currentVolun && currentClient && selectedChatLog.map((value, idx) => 
                        <p 
                            key={value['chatId']} 
                            className={"message "+(value['spc'] ? "special" : (value['uid'] === currentClient ? "left" : "right"))}
                        >
                            {(value['msg'] ? value['msg'] : (specialChatMessages[value['spc']] ? specialChatMessages[value['spc']] : specialChatMessages['clientId']))}
                            <span>{getFormattedDateString(value['time'])}</span>
                        </p>
                    )}
                </div>
                }
                {currentMode === 'call' && 
                <div className="call-container">
                    <span className="material-icons">wifi_calling_3</span>
                    {callAssignedStatus && <h4 className="call-assigned-status">{callAssignedStatus}</h4>}
                </div>
                }
            </>
            }
        </div>
    )
}

export default Supervisor;