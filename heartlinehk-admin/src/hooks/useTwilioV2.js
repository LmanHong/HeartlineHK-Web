import { Device, Call, TwilioError } from "@twilio/voice-sdk";
import { getApp } from "firebase/app";
import { httpsCallable, getFunctions } from "firebase/functions";
import { useEffect, useReducer } from "react";
import { HeartlineNotFoundError, HeartlineNotReadyError, HeartlineNotSupportedError, HeartlineValidationError } from "../misc/HeartlineError";

const DEVICE_STATUS = {
    IS_BUSY: 'isBusy',
    UNREGISTERED: 'unregistered',
    REGISTERING: 'registering',
    REGISTERED: 'registered',
    DESTROYED: 'destroyed'
};

const CALL_STATUS = {
    CLOSED: 'closed',
    CONNECTING: 'connecting',
    OPEN: 'open',
    PENDING: 'pending',
    RECONNECTING: 'reconnecting',
    RINGING: 'ringing'
};

const REDUCER_ACTIONS = {
    LOADING: 'loading',
    ERROR: 'error',
    UPDATE_TOKEN: 'update-token',
    UPDATE_DEVICE: 'update-device',
    UPDATE_DEVICE_STATUS: 'update-device-status',
    UPDATE_CALL: 'update-call',
    UPDATE_CALL_STATUS: 'update-call-status',
    ADD_CALL_WARNINGS: 'update-call-warnings',
    REMOVE_CALL_WARNINGS: 'remove-call-warnings',
    UPDATE_IS_MUTED: 'update-is-muted'
};

const initialState = {
    loading: true,
    error: null,
    token: null,
    device: null,
    deviceStatus: DEVICE_STATUS.DESTROYED,
    call: null,
    callStatus: CALL_STATUS.CLOSED,
    callWarnings: [],
    isMuted: false,
};

const twilioReducer = (state, action)=>{
    switch(action.type){
        case REDUCER_ACTIONS.LOADING:
            return {
                ...state,
                loading: true,
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
        case REDUCER_ACTIONS.UPDATE_DEVICE_STATUS:
            return {
                ...state,
                loading: false,
                error: null,
                deviceStatus: action.payload.status
            }
        case REDUCER_ACTIONS.UPDATE_CALL:
            return {
                ...state,
                loading: false,
                error: null,
                call: action.payload.call
            };
        case REDUCER_ACTIONS.UPDATE_CALL_STATUS:
            return {
                ...state,
                loading: false,
                error: null,
                callStatus: action.payload.status
            };
        case REDUCER_ACTIONS.ADD_CALL_WARNINGS:
            return {
                ...state,
                loading: false,
                error: null,
                callWarning: (state.callWarnings.includes(action.payload.warning)?state.callWarnings:[...state.callWarnings, action.payload.warning])
            };
        case REDUCER_ACTIONS.REMOVE_CALL_WARNINGS:
            return {
                ...state,
                loading: false,
                error: null,
                callWarnings: state.callWarnings.filter(warning => warning !== action.payload.warning)
            };
        case REDUCER_ACTIONS.UPDATE_IS_MUTED:
            return {
                ...state,
                loading: false,
                error: null,
                isMuted: action.payload.muted
            };
        default:
            throw new Error("Unknown Reducer Action!");   
    }
}

export function useTwilioV2(){
    const [state, dispatch] = useReducer(twilioReducer, initialState);
    const functions = getFunctions(getApp(), 'us-central1');
    const generateToken = httpsCallable(functions, 'generateToken');

    const resolveIncomingCall = (accept=true)=>{
        try{
            if (typeof accept !== 'boolean') throw new HeartlineValidationError("Parameter must be boolean!");
            else if (state.device === null) throw new HeartlineNotFoundError("Device is null!");
            else if (state.deviceStatus !== DEVICE_STATUS.REGISTERED) throw new HeartlineNotReadyError("Device is not registered!");
            else if (state.call === null) throw new HeartlineNotFoundError("Call is null!");
            else if (state.callStatus !== CALL_STATUS.PENDING || state.call.direction !== "INCOMING") throw new HeartlineValidationError("No pending call or not incoming call!");
            else{
                if (accept){
                    state.call.accept();
                    dispatch({type: REDUCER_ACTIONS.UPDATE_DEVICE_STATUS, payload: {status: DEVICE_STATUS.IS_BUSY}});
                }else state.call.reject();
            } 
        }catch(error){
            console.error("Resolve Incoming Call Error: "+error);
            dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: error.message}});
        }
    };

    const makeOutgoingCall = async (phoneNumber=null, client=null)=>{
        try{
            if (phoneNumber === null && client === null) throw new HeartlineValidationError("Phone number and client are both null!");
            else if (phoneNumber !== null && client !== null) throw new HeartlineValidationError("Phone number and client cannot be both set!")
            else if (phoneNumber !== null && typeof phoneNumber !== 'string') throw new HeartlineValidationError("Phone number is not string!");
            else if (client !== null && typeof client !== 'string') throw new HeartlineValidationError("Client is not string!");
            else if (state.device === null) throw new HeartlineNotFoundError("Device is null!");
            else if (state.deviceStatus !== DEVICE_STATUS.REGISTERED) throw new HeartlineNotReadyError("Device is not registered!");
            else if (state.call !== null) throw new HeartlineNotFoundError("Call is not null!");
            else{
                let call = null;
                if (phoneNumber !== null) call = await state.device.connect({params: {To: phoneNumber}});
                else call = await state.device.connect({params: {To: client}});

                dispatch({type: REDUCER_ACTIONS.UPDATE_CALL, payload: {call: call}});
                dispatch({type: REDUCER_ACTIONS.UPDATE_CALL_STATUS, payload: {status: call.status()}});
                setupCallListeners(call);
            }
        }catch(error){
            console.error("Make Outgoing Call Error: "+error);
            dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: error.message}});
        }
    }

    const hangupCall = ()=>{
        try{
            if (state.device === null) throw new HeartlineNotFoundError("Device is null!");
            else if (state.deviceStatus !== DEVICE_STATUS.REGISTERED) throw new HeartlineNotReadyError("Device is not registered!");
            else if (state.call === null) throw new HeartlineNotFoundError("Call is null!");
            else if (state.callStatus !== CALL_STATUS.PENDING || state.call.direction !== "INCOMING") throw new HeartlineValidationError("No pending call or not incoming call!");
        }catch(error){
            console.error("Hangup Call Error: "+error);
            dispatch({tupe: REDUCER_ACTIONS.ERROR, payload: {error: error.message}});
        }
    }

    /**
     * 
     * @param {Call} call - Twilio Call Object 
     */
    const setupCallListeners = (call)=>{
        call.on('accept', (call)=>{
            console.log("Call Accepted!");
            dispatch({type: REDUCER_ACTIONS.UPDATE_CALL_STATUS, payload: {status: call.status()}});
        });
        call.on('cancel', ()=>{
            console.log("Call Cancelled!");
            dispatch({type: REDUCER_ACTIONS.UPDATE_CALL, payload: {call: null}});
            dispatch({type: REDUCER_ACTIONS.UPDATE_CALL_STATUS, payload: {status: CALL_STATUS.CLOSED}});
        });
        call.on('disconnected', (call)=>{
            console.log("Call Disconnected!");
            dispatch({type: REDUCER_ACTIONS.UPDATE_CALL, payload: {call: null}});
            dispatch({type: REDUCER_ACTIONS.UPDATE_CALL_STATUS, payload: {status: CALL_STATUS.CLOSED}});
        });
        call.on('error', (twilioError)=>{
            console.error("Call Error: "+twilioError);
            dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: twilioError.message}});
        });
        call.on('muted', (isMuted, call)=>{
            console.log("Call is "+(isMuted?"muted!":"not muted!"));
            dispatch({type: REDUCER_ACTIONS.UPDATE_IS_MUTED, payload: {muted: isMuted}});
        });
        call.on('reconnected', ()=>{
            console.log("Call Reconnected!");
            if (state.call) dispatch({type: UPDATE_CALL_STATUS, payload: {status: state.call.status()}});
        });
        call.on('reconnecting', (twilioError)=>{
            console.error("Call Connection Error: "+twilioError);
            dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: twilioError.message}});
            dispatch({type: REDUCER_ACTIONS.UPDATE_CALL_STATUS, payload: {status: CALL_STATUS.RECONNECTING}});
        });
        call.on('rejected', ()=>{
            console.log("Call Rejected!");
            dispatch({type: REDUCER_ACTIONS.UPDATE_CALL, payload: {call: null}});
            dispatch({type: REDUCER_ACTIONS.UPDATE_CALL_STATUS, payload: {status: CALL_STATUS.CLOSED}});
        });
        call.on('warning', (warningName, warningData)=>{
            console.warn("Call Warning: "+warningName);
            dispatch({type: REDUCER_ACTIONS.ADD_CALL_WARNINGS, payload: {warning: warningName}});
        });
        call.on('warning-cleared', (warningName)=>{
            console.log("Call Warning "+warningName+" Cleared!");
            dispatch({type: REDUCER_ACTIONS.REMOVE_CALL_WARNINGS, payload: {warning: warningName}});
        });
    }

    /**
     * 
     * @param {TwilioError} twilioError - TwilioError
     * @param {Call} call - Twilio Call Object
     */
    const handleDeviceError = (twilioError, call)=>{
        console.error("Device Error: "+twilioError);
        dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: twilioError.message}});
    }

    /**
     * 
     * @param {Call} call - Twilio Call Object
     */
    const handleIncomingCall = (call)=>{
        console.log("Incoming Call!");
        dispatch({type: REDUCER_ACTIONS.UPDATE_CALL, payload: {call: call}});
        dispatch({type: REDUCER_ACTIONS.UPDATE_CALL_STATUS, payload: {callStatus: CALL_STATUS.PENDING}});
        
        setupCallListeners(call);
    }

    /**
     * 
     * @param {Device} device - Twilio Device Object
     */
    const handleDeviceRegistered = (device)=>{
        console.log("Device registered!");
        dispatch({type: REDUCER_ACTIONS.UPDATE_DEVICE_STATUS, payload: {status: DEVICE_STATUS.REGISTERED}});

    }

    const handleDeviceRegistering = (device)=>{
        console.log("Device registering...");
        dispatch({type: REDUCER_ACTIONS.UPDATE_DEVICE_STATUS, payload: {status: DEVICE_STATUS.REGISTERING}});
    }

    const handleDeviceUnregistered = (call)=>{
        console.log("Device unregistered!");
        dispatch({type: REDUCER_ACTIONS.UPDATE_DEVICE_STATUS, payload: {status: DEVICE_STATUS.UNREGISTERED}});
    }

    const handleTokenWillExpire = async ()=>{
        console.warn("Access Token expires soon, updating now...");
        try{
            if (state.device === null || state.device.state === DEVICE_STATUS.DESTROYED) throw new HeartlineNotFoundError("Twilio Device is null or destroyed!");
            const res = await generateToken();
            dispatch({type: REDUCER_ACTIONS.UPDATE_TOKEN, payload: {token: res.token}});
            state.device.updateToken(res.token);
        }catch(error){
            console.error(error.message);
            dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: error.message}});
        }
    }

    useEffect(async ()=>{
        try{
            if (!Device.isSupported) throw new HeartlineNotSupportedError("Twilio Device is not supported in this browser!");

            const res = await generateToken();
            dispatch({type: REDUCER_ACTIONS.UPDATE_TOKEN, payload: {token: res.token}});
            const device = new Device(res.token, { edge: ["singapore", "tokyo"], closeProtection: "離開或重新載入會使通話中斷，你確定嗎？", tokenRefreshMs: 1800 * 1000 });
            device.on('error', handleDeviceError);
            device.on('incoming', handleIncomingCall);
            device.on('registered', handleDeviceRegistered);
            device.on('registering', handleDeviceRegistering);
            device.on('tokenWillExpire', handleTokenWillExpire);
            device.on('unregistered', handleDeviceUnregistered);
            device.register();
            dispatch({type: REDUCER_ACTIONS.UPDATE_DEVICE, ppayload: {device: device}});

        }catch(error){
            console.error(error.message);
            dispatch({type: REDUCER_ACTIONS.ERROR, payload: {error: error.message}});
        }

        return ()=>{
            if (state.device) state.device.destroy();
        }
    }, []);

    return [
        state.loading,
        state.error,
        state.device,
        state.deviceStatus,
        state.call,
        state.callStatus,
        state.callWarnings,
        state.isMuted
    ];
}