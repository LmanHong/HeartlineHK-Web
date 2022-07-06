import { useEffect, useReducer } from "react";
import { getDatabase, runTransaction, child, update, ref, push, remove, serverTimestamp, set, get } from "firebase/database";
import { SORT_ORDERS, useDatabaseList, useDatabase } from "./useDatabase";
import {HeartlineAlreadyExistError, HeartlineDuplicatedExecutionError, HeartlineNotFoundError, HeartlineNotModifiedError, HeartlineNotReadyError, HeartlineValidationError} from '../misc/HeartlineError';
import { getChatRecordFormUrl } from "../misc/helperFunctions";

export const ASSIGNED_STATUS = {
    IN_QUEUE: "inQueue",
    ROOM_ASSIGNED: "roomAssigned",
    CHAT_ACCEPTED: "chatAccepted",
    CLIENT_LEFT: "clientLeft"
};

export const REQUEST_STATUS = {
    PENDING: "pending",
    ACCEPTED: "accepted",
    REJECTED: "rejected"
};

const REDUCER_ACTIONS = {
    UPDATE_IS_STARTING_CHAT: "update-is-starting-chat",
    UPDATE_IS_ENDING_CHAT: "update-is-ending-chat",
    UPDATE_IS_SENDING_MSG: "update-is-sending-msg",
    UPDATE_IS_SENDING_REQUEST: "update-is-sending-request",
    UPDATE_IS_RESOLVING_REQUEST: "update-is-resolving-request",
    UPDATE_CLIENT: "update-client",
    REMOVE_CLIENT: "remove-client",
    UPDATE_ASSIGNED_STATUS: "update-assigned-status",
    UPDATE_IS_TYPING: "update-is-typing",
    UPDATE_DISCONNECTED_AT: "update-disconnected-at",
    UPDATE_TRANSFERRABLE_VOLUN: "update-transferrable-volun",
    UPDATE_OUTGOING_TRANSFER_REQUEST: "update-outgoing-transfer-request",
    UPDATE_INCOMING_TRANSFER_REQUEST: "update-incoming-transfer-request",
}

const initialState = {
    isStartingChat: false,
    isEndingChat: false,
    isSendingMsg: false,
    isSendingRequest: false,
    isResolvingRequest: false,
    currentClient: null,
    assignedStatus: ASSIGNED_STATUS.CLIENT_LEFT,
    isTyping: false,
    disconnectedAt: null,
    transferrableVolun: [],
    outgoingTransferRequest: null,
    incomingTransferRequest: null
}

const chatReudcer = (state, action)=>{
    switch(action.type){
        case REDUCER_ACTIONS.UPDATE_IS_STARTING_CHAT:
            return {
                ...state,
                isStartingChat: action.payload.starting
            };
        case REDUCER_ACTIONS.UPDATE_IS_ENDING_CHAT:
            return {
                ...state,
                isEndingChat: action.payload.ending
            };
        case REDUCER_ACTIONS.UPDATE_IS_SENDING_MSG:
            return {
                ...state,
                isSendingMsg: action.payload.sending
            };
        case REDUCER_ACTIONS.UPDATE_IS_SENDING_REQUEST:
            return {
                ...state,
                isSendingRequest: action.payload.sending
            };
        case REDUCER_ACTIONS.UPDATE_IS_RESOLVING_REQUEST:
            return {
                ...state,
                isResolvingRequest: action.payload.resolving
            };
        case REDUCER_ACTIONS.UPDATE_CLIENT:
            return {
                ...state, 
                currentClient: action.payload.client
            };
        case REDUCER_ACTIONS.REMOVE_CLIENT:
            return {
                ...state,
                currentClient: null,
                assignedStatus: ASSIGNED_STATUS.CLIENT_LEFT,
                isTyping: false,
                isDisconnected: false
            };
        case REDUCER_ACTIONS.UPDATE_ASSIGNED_STATUS:
            return {
                ...state,
                assignedStatus: action.payload.status
            }
        case REDUCER_ACTIONS.UPDATE_IS_TYPING:
            return {
                ...state,
                isTyping: action.payload.typing
            };
        case REDUCER_ACTIONS.UPDATE_DISCONNECTED_AT:
            return {
                ...state,
                disconnectedAt: action.payload.disconnected
            };
        case REDUCER_ACTIONS.UPDATE_TRANSFERRABLE_VOLUN:
            return {
                ...state,
                transferrableVolun: action.payload.transferrable
            };
        case REDUCER_ACTIONS.UPDATE_OUTGOING_TRANSFER_REQUEST:
            return {
                ...state,
                outgoingTransferRequest: action.payload.request
            };
        case REDUCER_ACTIONS.UPDATE_INCOMING_TRANSFER_REQUEST:
            return {
                ...state,
                incomingTransferRequest: action.payload.request
            };
        default:
            throw new Error("Unknown Reducer Action!");
    };
};

export function useChat(currentUser){

    const database = getDatabase();

    const [chatQueueRef, qLoading, qError, chatQueue] = useDatabaseList('chat_queue', 'time', false, SORT_ORDERS.ASCENDING);
    const [chatAssignedRef, aLoading, aError, chatAssigned] = useDatabase('chat_assigned');
    const [typingRef, tLoading, tError, typingStatus] = useDatabase('typing_status');
    const [disconnectRef, dLoading, dError, disconnectTime] = useDatabase('disconnect_time');
    const [chatLogRef, lLoading, lError, chatLog] = useDatabaseList(`chat_log/${currentUser.uid}`, 'time', false, SORT_ORDERS.ASCENDING);
    const [transferRef, trLoading, trError, transferRequest] = useDatabase('transfer_requests');
    const [onlineRef, oLoading, oError, onlineTime] = useDatabase('online_time');
    const [preferredNamesRef, pLoading, pError, preferredNames] = useDatabase('preferred_names');
    const [state, dispatch] = useReducer(chatReudcer, initialState);

    const startNewChat = async ()=>{
        try{
            if (state.isStartingChat || state.isEndingChat || state.isSendingMsg || state.isSendingRequest || state.isResolvingRequest) throw new HeartlineDuplicatedExecutionError("Another Chat action is ongoing!");
            //else if (qLoading || aLoading || lLoading || tLoading || dLoading || trLoading || oLoading) throw new HeartlineNotReadyError("Database is still loading!");
            else if (currentUser === null || currentUser === undefined) throw new HeartlineNotFoundError("Current Volunteer is not set!");
            else if (state.currentClient !== null) throw new HeartlineNotFoundError("Current Client is not null!");
            else if (chatQueue.length <= 0) throw new HeartlineNotFoundError("No available client in chat queue!");
            else{
                dispatch({type: REDUCER_ACTIONS.UPDATE_IS_STARTING_CHAT, payload: {starting: true}});

                // Get the target client
                let targetClient = null, clientIdx = -1;
                for (let i=0; i<chatQueue.length; i++){
                    if (chatQueue[i]['value']['status'] === ASSIGNED_STATUS.IN_QUEUE){
                        targetClient = chatQueue[i]['key'];
                        clientIdx = i;
                        break;
                    }
                }
                if (targetClient === null) throw new HeartlineNotFoundError("No unassigned client in chat queue!");

                // Assign a chat to target client
                const databaseUpdates = {};
                databaseUpdates[`${chatQueueRef.key}/${targetClient}/status`] = ASSIGNED_STATUS.ROOM_ASSIGNED;
                databaseUpdates[`${chatAssignedRef.key}/${targetClient}`] = currentUser.uid;
                await update(ref(database), databaseUpdates);

                // Send the initial message
                await push(chatLogRef, {
                    'uid': currentUser.uid,
                    'time': serverTimestamp(),
                    'spc': targetClient
                });

                dispatch({type: REDUCER_ACTIONS.UPDATE_IS_STARTING_CHAT, payload: {starting: false}});
            }
        }catch(error){
            if (!(error instanceof HeartlineDuplicatedExecutionError)) dispatch({type: REDUCER_ACTIONS.UPDATE_IS_STARTING_CHAT, payload: {starting: false}});
            console.error(error.message);
            alert(error.message);
        }
        
    }

    const endChat = async ()=>{
        try{
            if (state.isStartingChat || state.isEndingChat || state.isSendingMsg || state.isSendingRequest || state.isResolvingRequest) throw new HeartlineDuplicatedExecutionError("Another Chat action is ongoing!");
            //else if (qLoading || aLoading || lLoading || tLoading || dLoading || trLoading || oLoading) throw new HeartlineNotReadyError("Database is still loading!");
            else if (currentUser === null || currentUser === undefined) throw new HeartlineNotFoundError("Current Volunteer is not set!");
            else if (state.currentClient === null) throw new HeartlineNotFoundError("Current Client is null!");
            else{
                dispatch({type: REDUCER_ACTIONS.UPDATE_IS_ENDING_CHAT, payload: {ending: true}});

                // Check if client is left or not
                let isChatAssignedNull = (chatAssigned === null || chatAssigned[state.currentClient] === null || chatAssigned[state.currentClient] === undefined || chatAssigned[state.currentClient] !== currentUser.uid);
                let isLeftMsgExist = false;
                for (let i=chatLog.length-1; i>=0; i--){
                    if (chatLog[i]['value']['spc'] === ASSIGNED_STATUS.CLIENT_LEFT){
                        isLeftMsgExist = true;
                        break;
                    }
                }

                // Remove client's queue record if still exist
                let isClientInQueue = false;
                for (let i=0; i<chatQueue.length; i++){
                    if (chatQueue[i]['key'] === state.currentClient){
                        isClientInQueue = true;
                        break;
                    }
                }

                // Update database to notify client that volunteer has left
                if (!isChatAssignedNull && !isLeftMsgExist){
                    const databaseUpdates = {};
                    databaseUpdates[`${chatAssignedRef.key}/${state.currentClient}`] = 'volunLeft';
                    if (isClientInQueue) databaseUpdates[`${chatQueueRef.key}/${state.currentClient}`] = null;
                    await update(ref(database), databaseUpdates);
                }

                // Append new chat record
                const startTime = chatLog[0]['value']['time'];
                const endTime = chatLog[chatLog.length - 1]['value']['time'];
                await push(ref(database, 'chat_records'), {
                    'uid': currentUser.uid,
                    'start': startTime,
                    'end': endTime
                });

                // Open Chat Record Form
                const prefilledRecordFormUrl = getChatRecordFormUrl(startTime, endTime);
                let popupWindowRef = window.open(prefilledRecordFormUrl, "ChatRecordForm", 'resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes');
                
                // Delete chat logs and typing status
                await remove(chatLogRef);
                await remove(child(typingRef, currentUser.uid));
        
                

                dispatch({type: REDUCER_ACTIONS.REMOVE_CLIENT});
                dispatch({type: REDUCER_ACTIONS.UPDATE_IS_ENDING_CHAT, payload: {ending: false}});

            }
        }catch(error){
            if (!(error instanceof HeartlineDuplicatedExecutionError)) dispatch({type: REDUCER_ACTIONS.UPDATE_IS_ENDING_CHAT, payload: {ending: false}});
            console.error(error.message);
            alert(error.message);
        }
        
    }

    const sendChatMessage = async (msg)=>{
        try{
            if (state.isStartingChat || state.isEndingChat || state.isSendingMsg || state.isSendingRequest || state.isResolvingRequest) throw new HeartlineDuplicatedExecutionError("Another Chat action is ongoing!");
            else if (msg === null || msg === undefined || typeof msg !== 'string' || msg === "") throw new HeartlineValidationError("Invalid message!");
            //else if (qLoading || aLoading || lLoading || tLoading || dLoading || trLoading || oLoading) throw new HeartlineNotReadyError("Database is still loading!");
            else if (currentUser === null || currentUser === undefined) throw new HeartlineNotFoundError("Current Volunteer is not set!");
            else if (state.currentClient === null) throw new HeartlineNotFoundError("Current Client is null!");
            else if (state.assignedStatus === ASSIGNED_STATUS.CLIENT_LEFT) throw new HeartlineNotFoundError("Client already left!");
            else{
                dispatch({type: REDUCER_ACTIONS.UPDATE_IS_SENDING_MSG, payload: {sending: true}});

                // TODO: Sanitize msg string

                // Append new msg to database
                await push(chatLogRef, {
                    'uid': currentUser.uid,
                    'time': serverTimestamp(),
                    'msg': msg
                });

                // Remove typing status as the msg is sent
                await set(child(typingRef, currentUser.uid), false);

                dispatch({type: REDUCER_ACTIONS.UPDATE_IS_SENDING_MSG, payload: {sending: false}});
            }
        }catch(error){
            if (!(error instanceof HeartlineDuplicatedExecutionError)) dispatch({type: REDUCER_ACTIONS.UPDATE_IS_SENDING_MSG, payload: {sending: false}});
            console.error(error.message);
            alert(error.message);
        }
        
    }

    const createOutgoingTransferRequest = async (targetUid)=>{
        try{
            if (state.isStartingChat || state.isEndingChat || state.isSendingMsg || state.isSendingRequest || state.isResolvingRequest) throw new HeartlineDuplicatedExecutionError("Another Chat action is ongoing!");
            else if (targetUid === null || targetUid === undefined || typeof targetUid !== 'string' || targetUid === "") throw new HeartlineValidationError("Invalid Target Volunteer ID!");
            //else if (qLoading || aLoading || lLoading || tLoading || dLoading || trLoading || oLoading) throw new HeartlineNotReadyError("Database is still loading!");
            else if (currentUser === null || currentUser === undefined) throw new HeartlineNotFoundError("Current Volunteer is not set!");
            else if (state.currentClient === null) throw new HeartlineNotFoundError("Current Client is null!");
            else if (state.assignedStatus === ASSIGNED_STATUS.CLIENT_LEFT) throw new HeartlineNotFoundError("Client already left!");
            else if (state.outgoingTransferRequest !== null) throw new HeartlineAlreadyExistError("Outgoing transfer request already exist!");
            else{
                dispatch({type: REDUCER_ACTIONS.UPDATE_IS_SENDING_REQUEST, payload: {sending: true}});

                // Check if target volunteer is online and available
                let isVolunOnline = (onlineTime !== null && onlineTime[targetUid] !== null);
                let isVolunChatting = (chatAssigned === null || chatAssigned[targetUid] === null);
                let isOtherRequestExist = (transferRequest !== null && transferRequest[targetUid] !== null);
                if (!isVolunOnline || isVolunChatting || isOtherRequestExist) throw new HeartlineNotFoundError("Target Volunteer is not available!");

                // Create Transfer Request
                const requestTransaction = await runTransaction(child(transferRef, targetUid), (request)=>{
                    if (request === null) return {
                        'from': currentUser.uid,
                        'client': state.currentClient,
                        'time': serverTimestamp(),
                        'status': REQUEST_STATUS.PENDING
                    };
                    else return request;
                });
                if (!requestTransaction.committed) throw new HeartlineNotModifiedError("Create Request Transaction not committed!");

                dispatch({type: REDUCER_ACTIONS.UPDATE_IS_SENDING_REQUEST, payload: {sending: false}});
            }
        }catch(error){
            if (!(error instanceof HeartlineDuplicatedExecutionError)) dispatch({type: REDUCER_ACTIONS.UPDATE_IS_SENDING_REQUEST, payload: {sending: false}});
            console.error(error.message);
            alert(error.message);
        }
        
    }

    const cancelOutgoingTransferRequest = async ()=>{
        try{
            if (state.isStartingChat || state.isEndingChat || state.isSendingMsg || state.isSendingRequest || state.isResolvingRequest) throw new HeartlineDuplicatedExecutionError("Another Chat action is ongoing!");
            //else if (qLoading || aLoading || lLoading || tLoading || dLoading || trLoading || oLoading) throw new HeartlineNotReadyError("Database is still loading!");
            else if (currentUser === null || currentUser === undefined) throw new HeartlineNotFoundError("Current Volunteer is not set!");
            else if (state.outgoingTransferRequest === null) throw new HeartlineNotFoundError("Outgoing transfer request is null!");
            else{
                dispatch({type: REDUCER_ACTIONS.UPDATE_IS_SENDING_REQUEST, payload: {sending: true}});

                const requestTransaction = await runTransaction(child(transferRef, state.outgoingTransferRequest['to']), (request)=>{
                    if (request && request['from'] === currentUser.uid) return null;
                    else return request;
                });
                if (!requestTransaction.committed) throw new HeartlineNotModifiedError("Cancel Request Transaction not committed!");


                dispatch({type: REDUCER_ACTIONS.UPDATE_IS_SENDING_REQUEST, payload: {sending: false}});
            }
        }catch(error){
            if (!(error instanceof HeartlineDuplicatedExecutionError)) dispatch({type: REDUCER_ACTIONS.UPDATE_IS_SENDING_REQUEST, payload: {sending: false}});
            console.error(error.message);
            alert(error.message);
        }
    }

    const resolveIncomingTransferRequest = async (decision)=>{
        try{
            if (state.isStartingChat || state.isEndingChat || state.isSendingMsg || state.isSendingRequest || state.isResolvingRequest) throw new HeartlineDuplicatedExecutionError("Another Chat action is ongoing!");
            else if (decision === null || decision === undefined || (decision !== REQUEST_STATUS.ACCEPTED && decision !== REQUEST_STATUS.REJECTED)) throw new HeartlineValidationError("Invalid request decision!");
            //else if (qLoading || aLoading || lLoading || tLoading || dLoading || trLoading || oLoading) throw new HeartlineNotReadyError("Database is still loading!");
            else if (currentUser === null || currentUser === undefined) throw new HeartlineNotFoundError("Current Volunteer is not set!");
            else if (state.incomingTransferRequest === null) throw new HeartlineNotFoundError("Incoming transfer request is null!");
            else{
                dispatch({type: REDUCER_ACTIONS.UPDATE_IS_RESOLVING_REQUEST, payload: {resolving: true}});

                let isCurrentClientExist = (state.currentClient !== null && state.assignedStatus !== ASSIGNED_STATUS.CLIENT_LEFT);
                let isRequestValid = (chatAssigned[state.incomingTransferRequest['client']] === state.incomingTransferRequest['from'] && state.incomingTransferRequest['status'] === REQUEST_STATUS.PENDING);
                
                if (!isRequestValid || isCurrentClientExist || decision === REQUEST_STATUS.REJECTED){
                    // reject if decision is rejected or current client has not left or the request is invalid
                    const rejectTransaction = await runTransaction(child(transferRef, currentUser.uid), (request)=>{
                        if (request) request['status'] = REQUEST_STATUS.REJECTED;
                        return request;
                    });
                    if (!rejectTransaction.committed) throw new HeartlineNotModifiedError("Reject Request Transaction not committed!");

                    alert("轉移對話要求已拒絕！");

                }else{
                    // accept if decision is accepted and current client has left and the request is valid
                    const chatLogSnapshot = await get(child(chatLogRef.parent, state.incomingTransferRequest['from']));
                    console.log(chatLogSnapshot.val());

                    const databaseUpdates = {};
                    databaseUpdates[`${transferRef.key}/${currentUser.uid}/status`] = REQUEST_STATUS.ACCEPTED;
                    databaseUpdates[`${chatAssignedRef.key}/${state.incomingTransferRequest['client']}`] = currentUser.uid;
                    await update(ref(database), databaseUpdates);
                    await set(chatLogRef, chatLogSnapshot.val());

                    alert("轉移對話成功！");
                }

                dispatch({type: REDUCER_ACTIONS.UPDATE_IS_RESOLVING_REQUEST, payload: {resolving: false}});
            }
        }catch(error){
            if (!(error instanceof HeartlineDuplicatedExecutionError)) dispatch({type: REDUCER_ACTIONS.UPDATE_IS_RESOLVING_REQUEST, payload: {resolving: false}});
            console.error(error.message);
            alert(error.message);
        }
    }

    // Hook for auto-updating assigned client
    useEffect(()=>{
        if (currentUser){
            let isClientFound = false;
            for (const uid in chatAssigned){
                if (chatAssigned[uid] === currentUser.uid){
                    isClientFound = true;
                    dispatch({type: REDUCER_ACTIONS.UPDATE_CLIENT, payload:{client: uid}});
                    if (state.assignedStatus === ASSIGNED_STATUS.CLIENT_LEFT) dispatch({type: REDUCER_ACTIONS.UPDATE_ASSIGNED_STATUS, payload: {status: ASSIGNED_STATUS.ROOM_ASSIGNED}});
                    break;
                }
            }

            if (!isClientFound && state.currentClient !== null) dispatch({type: REDUCER_ACTIONS.UPDATE_ASSIGNED_STATUS, payload: {status: ASSIGNED_STATUS.CLIENT_LEFT}});
        }
    }, [currentUser, chatAssigned]);

    // Hook for auto-checking if client has accepted the chat
    useEffect(()=>{
        if (currentUser && state.currentClient){
            if (state.assignedStatus === ASSIGNED_STATUS.ROOM_ASSIGNED){
                let isClientInQueue = false;
                for (let i=0; i<chatQueue.length; i++){
                    if (chatQueue[i]['key'] === state.currentClient){
                        isClientInQueue = true;
                        break;
                    }
                }

                if (!isClientInQueue) dispatch({type: REDUCER_ACTIONS.UPDATE_ASSIGNED_STATUS, payload: {status: ASSIGNED_STATUS.CHAT_ACCEPTED}});
            }
        }
    }, [currentUser, state.currentClient, chatQueue]);

    // Hook for auto-checking if the client has left the chat
    useEffect(()=>{
        if (currentUser){
            if (state.currentClient && state.assignedStatus === ASSIGNED_STATUS.CHAT_ACCEPTED){
                let isClientLeftMsgFound = false;
                for (let i=1; i<chatLog.length; i++){
                    if (chatLog[i]['value']['spc'] === ASSIGNED_STATUS.CLIENT_LEFT){
                        isClientLeftMsgFound = true;
                        break;
                    }
                }

                if (isClientLeftMsgFound) dispatch({type: REDUCER_ACTIONS.UPDATE_ASSIGNED_STATUS, payload: {status: ASSIGNED_STATUS.CLIENT_LEFT}});
            }else if (state.currentClient === null && chatLog.length >= 1){
                dispatch({type: REDUCER_ACTIONS.UPDATE_CLIENT, payload: {client: chatLog[0]['value']['spc']}});
                dispatch({type: REDUCER_ACTIONS.UPDATE_ASSIGNED_STATUS, payload: {status: ASSIGNED_STATUS.CLIENT_LEFT}});
            }
        }
    }, [currentUser, state.currentClient, chatLog]);

    // Hook for auto-updating the typing status of client
    useEffect(()=>{
        if (currentUser && state.currentClient && typingStatus !== null && typingStatus[state.currentClient] !== state.isTyping) dispatch({type: REDUCER_ACTIONS.UPDATE_IS_TYPING, payload: {typing: typingStatus[state.currentClient]}});
        else dispatch({type: REDUCER_ACTIONS.UPDATE_IS_TYPING, payload: {typing: false}});
    }, [currentUser, state.currentClient, typingStatus]);

    // Hook for auto-updating the disconnect time of the client
    useEffect(()=>{
        if (currentUser && state.currentClient && disconnectTime !== null && disconnectTime[state.currentClient] !== state.disconnectedAt) dispatch({type: REDUCER_ACTIONS.UPDATE_DISCONNECTED_AT, payload: {disconnected: disconnectTime[state.currentClient]}});
        else dispatch({type: REDUCER_ACTIONS.UPDATE_DISCONNECTED_AT, payload: {disconnected: null}});
    }, [currentUser, state.currentClient, disconnectTime]);

    // Hook for auto-updating the incoming and outgoing transfer requests
    useEffect(()=>{
        if (currentUser){
            if (transferRequest !== null && transferRequest[currentUser.uid] !== null) dispatch({type: REDUCER_ACTIONS.UPDATE_INCOMING_TRANSFER_REQUEST, payload: {request: transferRequest[currentUser.uid]}});
            else dispatch({type: REDUCER_ACTIONS.UPDATE_INCOMING_TRANSFER_REQUEST, payload: {request: null}});

            let isOutgoingRequestFound = false;
            for (const destVolunId in transferRequest){
                if (transferRequest[destVolunId]['from'] === currentUser.uid){
                    if (transferRequest[destVolunId]['status'] !== REQUEST_STATUS.PENDING){
                        if (transferRequest[destVolunId]['status'] === REQUEST_STATUS.ACCEPTED) alert("轉移對話成功！");
                        else alert("轉移對話要求已被拒絕！");
                        remove(child(transferRef, destVolunId));
                        dispatch({type: REDUCER_ACTIONS.UPDATE_OUTGOING_TRANSFER_REQUEST, payload: {request: null}});
                    }else{
                        dispatch({type: REDUCER_ACTIONS.UPDATE_OUTGOING_TRANSFER_REQUEST, payload: {request: {
                            ...transferRequest[destVolunId],
                            'to': destVolunId,
                        }}});
                    }
                    isOutgoingRequestFound = true;
                    break;
                }
            }
            if (!isOutgoingRequestFound) dispatch({type: REDUCER_ACTIONS.UPDATE_OUTGOING_TRANSFER_REQUEST, payload: {request: null}});
        }
    }, [currentUser, transferRequest]);

    // Hook for auto-updating the list of transferrable volunteers
    useEffect(()=>{
        let tmpTransferrableVolun = [];
        if (currentUser){
            for (const volunId in onlineTime){
                let isVolunChatting = false;
                for (const uid in chatAssigned){
                    if (chatAssigned[uid] === volunId){
                        isVolunChatting = true;
                        break;
                    }
                }
                
                if (!isVolunChatting && (transferRequest === null || transferRequest[volunId] === null)){
                    tmpTransferrableVolun.push({
                        'display': (preferredNames !== null && preferredNames[volunId] !== null?preferredNames[volunId]['preferredName']:volunId),
                        'value': volunId
                    });
                }
            }
        }
        dispatch({type: REDUCER_ACTIONS.UPDATE_TRANSFERRABLE_VOLUN, payload: {transferrable: tmpTransferrableVolun}});
    }, [currentUser, transferRequest, chatAssigned, onlineTime, preferredNames]);

    return [
        chatQueue,
        chatLog,
        state.currentClient,
        state.assignedStatus,
        state.isTyping,
        state.disconnectedAt,
        state.transferrableVolun,
        state.incomingTransferRequest,
        state.outgoingTransferRequest,
        (qLoading || aLoading || lLoading || tLoading || dLoading),
        (qError || aError || lError || tError || dError),
        startNewChat,
        endChat,
        sendChatMessage,
        createOutgoingTransferRequest,
        cancelOutgoingTransferRequest,
        resolveIncomingTransferRequest
    ];

}