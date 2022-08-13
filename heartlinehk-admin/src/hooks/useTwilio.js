import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth  } from "firebase/auth";
import { Device } from "@twilio/voice-sdk";
import { useEffect, useReducer, useState } from "react";
import { useDatabase } from "./useDatabase";
import { getApp } from "firebase/app";
import { HeartlineNotFoundError } from "../misc/HeartlineError";

export const ACTIVITY_SID = {
    OFFLINE: "WAc987bc93f4348a726633367204d10a0e",
    AVAILABLE: "WAef316e77aefbbe95fdec401a5d06a29e",
    TEXTCHATTING: "WAffa1c28894ece37a57f2a15d4b6a1c4d",
    CALLCHATTING: "WA971b0f221e46e9eaca8b72a2afdb90c9",
    IDLING: "WAa56a5dcb27c4104ee01105d11ac96453"
};

export const TASK_STATUS = {
    CANCELED: "canceled",
    PENDING: "pending",
    RESERVED: "reserved",
    ASSIGNED: "assigned",
    WRAPPING: "wrapping",
    COMPLETED: "completed"
};

const REDUCER_ACTIONS = {
    UPDATE_DEVICE: "update-device",
    UPDATE_TOKEN: "update-token",
    UPDATE_ONGOING_CALL: "update-ongoing-call",
    UPDATE_ACTIVITY: "update-activity",
    UPDATE_TASK: "update-task",
    UPDATE_PHONE: "update-phone",
    ERROR: "error",
    LOADING: "loading"
};

const initialState = {
    loading: true,
    error: null,
    token: null,
    device: null,
    ongoingCall: null,
    currentActivity: ACTIVITY_SID.OFFLINE,
    phoneNumber: null
};

const twilioReducer = (state, action)=>{
    switch(action.type){
        case REDUCER_ACTIONS.LOADING:
            return {
                ...state,
                loading: true
            };
        case REDUCER_ACTIONS.ERROR:
            return {
                ...state,
                loading: false,
                error: action.payload.error
            };
        case REDUCER_ACTIONS.UPDATE_TOKEN:
            return {
                ...state,
                loading: false,
                error: null,
                token: action.payload.token
            };
        case REDUCER_ACTIONS.UPDATE_DEVICE:
            return {
                ...state,
                loading: false,
                error: null,
                device: action.payload.device
            };
        case REDUCER_ACTIONS.UPDATE_ONGOING_CALL:
            return {
                ...state,
                loading: false,
                error: null,
                ongoingCall: action.payload.call
            }
        case REDUCER_ACTIONS.UPDATE_ACTIVITY:
            return {
                ...state,
                loading: false,
                error: null,
                currentActivity: action.payload.activity
            };
        case REDUCER_ACTIONS.UPDATE_TASK:
            return {
                ...state,
                loading: false,
                error: null
            }
        case REDUCER_ACTIONS.UPDATE_PHONE:
            return {
                ...state,
                loading: false,
                error: null,
                phoneNumber: action.payload.phone
            }
        default:
            throw new Error("Unknown Reducer Action!");    
    };
};

export function useTwilio(currentUser){
    
    const [workerRef, wLoading, wError, workerSid ] = useDatabase(`twilio_workers/${currentUser.uid}`);
    const functions = getFunctions(getApp(), 'us-central1');
    const updateWorkerActivity = httpsCallable(functions, 'updateWorkerActivity');      
    const updateTaskStatus = httpsCallable(functions, 'updateTaskStatus');
    const getWorkerActivity = httpsCallable(functions, 'getWorkerActivity');
    const getTaskStatus = httpsCallable(functions, 'getTaskStatus');
    const generateToken = httpsCallable(functions, 'generateToken');
    
    const [state, dispatch] = useReducer(twilioReducer, initialState);

    const getActivity = async ()=>{
        try{
            dispatch({type: REDUCER_ACTIONS.LOADING});
            if (wLoading) throw new Error("Worker Ref is still loading!");
            else if (workerSid == null) throw new Error("No Twilio Worker SID found!");
            let result = await getWorkerActivity();
            dispatch({type: REDUCER_ACTIONS.UPDATE_ACTIVITY, payload: {activity: result.data.activitySid}});
            dispatch({type: REDUCER_ACTIONS.UPDATE_PHONE, payload: {phone: result.data.phoneNumber}});
            return result.data;
        }catch(error){
            dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: error.message}});
            console.log(error.message);
            return null
        }
    }

    const updateActivity = async (activitySid)=>{
        try{
            if (!Object.values(ACTIVITY_SID).includes(activitySid)) throw new Error("Invalid activity SID!");
            else if (wLoading) throw new Error("Worker Ref is still loading!");
            else if (workerSid == null) throw new Error("No Twilio Worker SID found!");
            dispatch({type: REDUCER_ACTIONS.LOADING});
            let result = await updateWorkerActivity({activitySid: activitySid});
            dispatch({type: REDUCER_ACTIONS.UPDATE_ACTIVITY, payload: {activity: result.data.activitySid}});
            dispatch({type: REDUCER_ACTIONS.UPDATE_PHONE, payload: {phone: result.data.phoneNumber}});
            console.log(result.data);
            return true;
        }catch(error){
            dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: error.message}});
            console.log(error.message);
            return false;
        }

        
    };

    const getTask = async (taskSid)=>{
        try{
            dispatch({type: REDUCER_ACTIONS.LOADING});
            if (wLoading) throw new Error("Worker Ref is still loading!");
            else if (workerSid == null) throw new Error("No Twilio Worker SID found!");
            let result = await getTaskStatus({taskSid: taskSid});
            dispatch({type: REDUCER_ACTIONS.UPDATE_TASK});
            return result.data;
        }catch(error){
            dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: error.message}});
            console.log(error.messasge);
            return null;
        }
    }

    const updateTask = async (taskSid, status)=>{
        try{
            if (!Object.values(TASK_STATUS).includes(status)) throw new Error("Invalid task status!");
            else if (wLoading) throw new Error("Worker Ref is still loading!");
            else if (workerSid == null) throw new Error("No Twilio Worker SID found!");
            dispatch({type: REDUCER_ACTIONS.LOADING});
            await updateTaskStatus({taskSid: taskSid, status: status});
            dispatch({type: REDUCER_ACTIONS.UPDATE_TASK});
            return true;
        }catch(error){
            dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: error.message}});
            console.log(error.message);
            return false;
        }
    }

    
    const handleDeviceIncomingCall = (call)=>{
        dispatch({type: REDUCER_ACTIONS.UPDATE_ONGOING_CALL, payload: {call: call}});
    }

    const handleDeviceError = (twilioError, call)=>{
        dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: twilioError.message}});
    }

    const handleDeviceRegistered = (device)=>{
        console.log("Device Registered!");
        dispatch({type: REDUCER_ACTIONS.UPDATE_DEVICE, payload: {device: device}});
    }

    const handleDeviceUnregistered = (call)=>{
        console.log("Device Unregistered!");
        dispatch({type: REDUCER_ACTIONS.UPDATE_DEVICE, payload: {device: null}});
    }

    const handleTokenWillExpire = async ()=>{
        try{
            if (!generateToken) throw new HeartlineNotFoundError("Generate Token unavailable!");
            const res = generateToken();
            console.log(res);
            dispatch({type: REDUCER_ACTIONS.UPDATE_TOKEN, payload: {token: res.token}});
            if (state.device instanceof Device) state.device.updateToken(res.token);
        }catch(error){
            console.error(error.message);
            dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: error.message}});
        }
    }
    


    useEffect(()=>{
        if (!functions) dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: "Cloud Functions unavailable!"}});
        else if (!updateWorkerActivity) dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: "Update worker activity unavailable!"}});
        else if (!updateTaskStatus) dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: "Update task status unavailable!"}});
        else if (!getWorkerActivity) dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: "Get worker activity unavailable!"}});
        else if (!getTaskStatus) dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: "Get task status unavailable!"}});
        else if (workerSid == null) dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: "No Twilio Worker SID found!"}});
        else{
            getActivity()
            .then((activityInfo)=>{
                if (activityInfo != null && activityInfo.activitySid == ACTIVITY_SID.OFFLINE) updateActivity(ACTIVITY_SID.IDLING);
            });
        }

        return ()=>{
            if (functions && updateWorkerActivity && 
                getAuth().currentUser && workerSid && 
                state.currentActivity != ACTIVITY_SID.CALLCHATTING 
            ) updateWorkerActivity({activitySid: ACTIVITY_SID.OFFLINE});
        };
    }, [workerSid]);

    // For initializing the Twilio Device
    useEffect(async ()=>{
        if (!generateToken) dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: "Generate Token unavailable!"}});
        else if (workerSid === null) dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: "No Twilio Worker SID found!"}});
        else {
            const res = await generateToken();
            dispatch({type: REDUCER_ACTIONS.UPDATE_TOKEN, payload: {token: res.token}});
    
            if (state.device instanceof Device) state.device.updateToken(res.token);
            else{
                const device = new Device(state.token, { edge: ["singapore", "tokyo"], closeProtection: "離開或重新載入會使通話中斷，你確定嗎？" });
                device.on('registered', handleDeviceRegistered);
                device.on('unregistered', handleDeviceUnregistered);
                device.on('tokenWillExpire', handleTokenWillExpire);
                device.on('error', handleDeviceError);
                device.register();
                dispatch({type: REDUCER_ACTIONS.UPDATE_DEVICE, payload: {device: device}});
            }
        }

        return ()=>{
            if (state.device !== null) state.device.destroy();
        }
    }, []);
    

    return [state.currentActivity, state.phoneNumber, state.loading, state.error, updateActivity, updateTask];
};

