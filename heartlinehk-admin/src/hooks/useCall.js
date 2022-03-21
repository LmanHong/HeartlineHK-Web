import { useTwilio, ACTIVITY_SID, TASK_STATUS } from './useTwilio.js';
import { useDatabaseList, SORT_ORDERS, useDatabase } from './useDatabase.js';
import { child, remove } from 'firebase/database';
import { useEffect, useReducer, useState } from 'react';
import { getChatRecordFormUrl } from '../misc/helperFunctions.js';
import { HeartlineAlreadyExistError, HeartlineNotFoundError, HeartlineNotModifiedError, HeartlineNotReadyError } from '../misc/HeartlineError.js';

export const ASSIGNED_STATUS = {
    CALL_ASSIGNED: "callAssigned",
    CALL_ACCEPTED: "callAccepted",
    CLIENT_LEFT: "clientLeft"
};

const REDUCER_ACTIONS = {
    UPDATE_WAITING_TIMER: "update-waiting-timer",
    REMOVE_WAITING_TIMER: "remove-waiting-timer",
    UPDATE_ELAPSE_TIMER: "update-elapse-timer",
    REMOVE_ELAPSE_TIMER: "remove-elapse-timer",
    REMOVE_CLIENT: "remove-client",
    UPDATE_CLIENT: "update-client",
    UPDATE_ASSIGNED_STATUS: "update-assigned-status",
    UPDATE_TIME_ELAPSED: "update-time-elapsed",
    REMOVE_TASK_SID: "remove-task-sid",
    UPDATE_TASK_SID: "update-task-sid",
};

const initialState = {
    waitingTimer : null,
    elapseTimer: null,
    currentClient: null,
    taskSid: null,
    assignedStatus: ASSIGNED_STATUS.CLIENT_LEFT,
    timeElapsed: 0
};

const callReducer = (state, action)=>{
    switch(action.type){
        case REDUCER_ACTIONS.UPDATE_ELAPSE_TIMER:
            return {
                ...state,
                elapseTimer: action.payload.timer
            };
        case REDUCER_ACTIONS.REMOVE_ELAPSE_TIMER:
            clearInterval(state.elapseTimer);
            return {
                ...state,
                elapseTimer: null,
                timeElapsed: 0
            };
        case REDUCER_ACTIONS.UPDATE_WAITING_TIMER:
            return {
                ...state,
                waitingTimer: action.payload.timer
            };
        case REDUCER_ACTIONS.REMOVE_WAITING_TIMER:
            clearTimeout(state.waitingTimer);
            return {
                ...state,
                waitingTimer: null
            };
        case REDUCER_ACTIONS.REMOVE_CLIENT:
            return{
                ...state,
                currentClient: null,
                assignedStatus: ASSIGNED_STATUS.CLIENT_LEFT,
            };
        case REDUCER_ACTIONS.UPDATE_CLIENT:
            return {
                ...state,
                currentClient: action.payload.client
            };
        case REDUCER_ACTIONS.UPDATE_ASSIGNED_STATUS:
            return{
                ...state,
                assignedStatus: action.payload.status
            };
        case REDUCER_ACTIONS.UPDATE_TIME_ELAPSED:
            return {
                ...state,
                timeElapsed: action.payload.time
            };
        case REDUCER_ACTIONS.REMOVE_TASK_SID:
            return{
                ...state,
                taskSid: null
            };
        case REDUCER_ACTIONS.UPDATE_TASK_SID:
            return{
                ...state,
                taskSid: action.payload.task
            };
        default:
            throw new Error("Unknown Reducer Action!");    
    };
};

export function useCall(currentUser){
    const [currentActivity, phoneNumber, tLoading, tError, updateActivity, updateTask] = useTwilio();
    const [callQueueRef, qLoading, qError, callQueue] = useDatabaseList('call_queue', 'time', false, SORT_ORDERS.ASCENDING);
    const [callAssignedRef, aLoading, aError, callAssigned] = useDatabase('call_assigned');
    const [state, dispatch] = useReducer(callReducer, initialState);

    const handleWaitingTimeout = async ()=>{
        dispatch({type: REDUCER_ACTIONS.REMOVE_WAITING_TIMER});
        console.log('Timer fired!');
        try{
            if (tLoading) throw new HeartlineNotReadyError("Twilio is still loading!");
            else if (tError) throw new Error(tError);
            else if (state.currentClient != null) throw new HeartlineAlreadyExistError("currentClient is already set!");
            else{
                let isSuccessful = await updateActivity(ACTIVITY_SID.IDLING);
                if (!isSuccessful) throw new HeartlineNotModifiedError("Cannot update new activity!");
                else alert("未有成功安排對話，請重試");
            }
        }catch(error){
            console.error(error.message);
        }
    }

    const startNewCall = async ()=>{
        try{
            if (tLoading) throw new HeartlineNotReadyError("Twilio is still loading!");
            else if (qLoading || aLoading) throw new HeartlineNotReadyError("Database is still loading!");
            else if (tError) throw new Error(tError);
            else if (phoneNumber == null) throw new HeartlineNotFoundError("No Phone Number in Twilio Worker!");
            else if (callQueue.length <= 0 ) throw new HeartlineNotFoundError("No available client in call queue!");
            else if (state.currentClient != null) throw new HeartlineAlreadyExistError("currentClient is already set!");
            else{
                let isSuccessful = await updateActivity(ACTIVITY_SID.AVAILABLE);
                if (!isSuccessful) throw new HeartlineNotModifiedError("Cannot update new activity!");
                // Set timeout of 30 sec if no client is assigned to volunteer
                const timerId = setTimeout(handleWaitingTimeout, 30000);
                dispatch({ type: REDUCER_ACTIONS.UPDATE_WAITING_TIMER, payload: { timer: timerId } });
            }
        }catch(error){
            console.error(error.message);
            alert(error.message);
        } 
        
    };

    const endCall = async ()=>{
        try{
            if (tLoading) throw new HeartlineNotReadyError("Twilio is still loading!");
            else if (tError) throw new Error(tError);
            else if (state.currentClient == null) throw new HeartlineNotFoundError("currentClient is null!");
            else{
                let isSuccessful = await updateActivity(ACTIVITY_SID.IDLING);
                if (!isSuccessful) throw new HeartlineNotModifiedError("Cannot update new activity!");
    
                for (const uid in callAssigned){
                    if (callAssigned[uid].volunId === currentUser.uid){
                        let isTaskCompleted = await updateTask(callAssigned[uid].taskSid, TASK_STATUS.COMPLETED);
                        
                        const startTime = callAssigned[uid].acceptedTime;
                        const endTime = Date.now();
                        const prefilledRecordFormUrl = getChatRecordFormUrl(startTime, endTime);
                        let popupWindowRef = window.open(prefilledRecordFormUrl, "ChatRecordForm", 'resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes');

                        await remove(child(callAssignedRef, uid));
                        break;
                    }
                }
                dispatch({type: REDUCER_ACTIONS.REMOVE_CLIENT});
            }
        }catch(error){
            console.error(error.message);
            alert(error.message);
        }
        
    };

    useEffect(()=>{ 
        if (currentUser){
            //Check if there is any assigned client to this volunteer
            let isClientFound = false;
            for (const uid in callAssigned){
                if (callAssigned[uid].volunId == currentUser.uid){
                    if (state.waitingTimer) dispatch({ type: REDUCER_ACTIONS.REMOVE_WAITING_TIMER });
                    dispatch({
                        type: REDUCER_ACTIONS.UPDATE_CLIENT,
                        payload: {client: uid}
                    });
                    dispatch({
                        type: REDUCER_ACTIONS.UPDATE_ASSIGNED_STATUS,
                        payload: {status: callAssigned[uid].status}
                    });
                    if (callAssigned[uid].status == ASSIGNED_STATUS.CALL_ACCEPTED){
                        const timerId = setInterval(()=>dispatch({type: REDUCER_ACTIONS.UPDATE_TIME_ELAPSED, payload: {time: Math.floor((Date.now() - callAssigned[uid].acceptedTime)/1000)}}), 1000);
                        dispatch({
                            type: REDUCER_ACTIONS.UPDATE_ELAPSE_TIMER,
                            payload: {timer: timerId}
                        });
                    }else dispatch({ type: REDUCER_ACTIONS.REMOVE_ELAPSE_TIMER });
                    isClientFound = true;
                    break;
                }
            }

            //Set currentClient to null if not found
            if (!isClientFound && state.currentClient != null){
                dispatch({type: REDUCER_ACTIONS.REMOVE_WAITING_TIMER});
                dispatch({type: REDUCER_ACTIONS.REMOVE_ELAPSE_TIMER});
                dispatch({type: REDUCER_ACTIONS.REMOVE_CLIENT});
                if (currentActivity != ACTIVITY_SID.IDLING) updateActivity(ACTIVITY_SID.IDLING);
            }
        }

        return ()=>{
            if (state.waitingTimer) clearTimeout(state.waitingTimer);
            if (state.elapseTimer) clearInterval(state.elapseTimer);
        }
    }, [currentUser, callAssigned]);
    
    return [
        callQueue, 
        state.currentClient, 
        state.assignedStatus, 
        state.timeElapsed, 
        (tLoading || qLoading || aLoading || state.waitingTimer != null), 
        (tError || qError || aError),
        startNewCall,
        endCall
    ];
};