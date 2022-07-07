import { getDatabase, ref } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useList } from 'react-firebase-hooks/database';
import { useMemo } from 'react';
import { ASSIGNED_STATUS } from './useChat';

export function useChatV2() {

    const firebaseAuth = getAuth();
    const firebaseDB = getDatabase();
    const [currentUser] = useAuthState(firebaseAuth);
    const [chatQueue, qLoading, qError] = useList(ref(firebaseDB, 'chat_queue'));
    const [chatAssigned, aLading, aError] = useList(ref(firebaseDB, 'chat_assigned'));
    const [typingStatus, tLoading, tError] = useObjectVal(ref(firebaseDB, 'typing_status'));
    const [disconnectTime, dLoading, dError] = useObjectVal(ref(firebaseDB, 'disconnect_time'));
    const [chatLog, lLoading, lError] = useList(ref(firebaseDB, `chat_log/${currentUser.uid}`));
    const [onlineStatus, oLoading, oError] = useList(ref(firebaseDB, 'online_status'));
    const [preferredNames, pLoading, pError] = useObjectVal(ref(firebaseDB, 'preferred_names'));
    const currentClient = useMemo(() => {
        if (currentUser && chatAssigned){
            const filteredChatAssigned = chatAssigned.filter(value => value.val() === currentUser.uid);
            if (filteredChatAssigned.length === 1){
                return filteredChatAssigned[0].key;
            }
        }
        return null;
    }, [currentUser, chatAssigned]);
    const assignedStatus = useMemo(() => {
        if (currentClient && currentUser && chatAssigned) {
            const filteredChatAssigned = chatAssigned.filter(value => value.val() === currentUser.uid);
        }
        return ASSIGNED_STATUS.CLIENT_LEFT;
    }, [currentClient, currentUser, chatAssigned, chatLog])

    const startNewChat = async () => {

    }

    const endChat = async () => {

    }

    const sendChatMessage = async (msg) => {

    }

    const createOutgoingTransferRequest = async (targetUid) => {

    }

    const cancelOutgoingTransferRequest = async () => {

    }

    const resolveIncomingTransferRequest = async (decision) => {

    }



}