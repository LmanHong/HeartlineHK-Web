const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const getAnonymousUsers = async (users=[], nextPageToken)=>{
    const result = await admin.auth().listUsers(1000, nextPageToken);
    let pageUsers = [];
    result.users.forEach((userRecord)=>{
        let userJSON = userRecord.toJSON();
        if (userJSON.providerData.length === 0) pageUsers = pageUsers.concat(userJSON.uid);
    });

    users = users.concat(pageUsers);
    
    if (result.pageToken){
        return getAnonymousUsers(users, result.pageToken);
    }
    return users;
}

exports.resetSystem = functions.region('asia-east2').pubsub.schedule('0 10 * * *').timeZone('Asia/Hong_Kong').onRun(async (context)=>{
    functions.logger.log("Running resetSystem!");
    try{
        //Delete anonymous users
        let users = await getAnonymousUsers();
        let deleteUsersResult = await admin.auth().deleteUsers(users);
        console.log(deleteUsersResult);

        //Check if any leftover chatlogs exist
        const chatRecords = (await admin.database().ref('chat_records').once('value')).val();
        let tmpChatLogs = (await admin.database().ref('chat_log').once('value')).val();
        for (let volunId in tmpChatLogs){
            let startChatTime = null;
            let endChatTime = null;
            for (let msgId in tmpChatLogs[volunId]){
                if (startChatTime === null || tmpChatLogs[volunId][msgId]['time'] < startChatTime) startChatTime = tmpChatLogs[volunId][msgId]['time'];
                if (endChatTime === null || tmpChatLogs[volunId][msgId]['time'] > endChatTime) endChatTime = tmpChatLogs[volunId][msgId]['time'];
            }

            let isRecordExists = false;
            for (let recordId in chatRecords){
                if (chatRecords[recordId]['start'] === startChatTime && chatRecords[recordId]['uid'] === volunId){
                    isRecordExists = true;
                    break;
                }
            }
            //Add new chat record if no previous record is found for this unended chat
            if (!isRecordExists){
                const newRecordRef = admin.database().ref('chat_records').push();
                await newRecordRef.set({
                    'uid': volunId,
                    'start': startChatTime,
                    'end': endChatTime
                });
                functions.logger.log("New Chat Record Added: "+volunId+" "+startChatTime+" "+endChatTime);
            }
        }

        //Delete disconnect_time, room_assigned, typing_status, transfer_requests, chat_log
        admin.database().ref('disconnect_time').remove();
        admin.database().ref('room_assigned').remove();
        admin.database().ref('typing_status').remove();
        admin.database().ref('transfer_requests').remove();
        admin.database().ref('chat_log').remove();
    }catch(error){
        console.error("ERROR: "+error.message);
    }
    return null;
});

exports.checkChatRecord = functions.region('asia-east2').https.onCall(async (data, context)=>{
    const startChatTime = data.startChatTime;
    const volunId = context.auth.uid;
    console.log("Start: "+startChatTime+" <> volunID: "+volunId);
    if (startChatTime === null || !(typeof startChatTime === 'number')) throw new functions.https.HttpsError('invalid-argument', "Start Chat Time is either null or not a number!");
    else if (volunId === null) throw new functions.https.HttpsError('unauthenticated', "User is not logged in!");

    const chatRecords = (await admin.database().ref('chat_records').once('value')).val();
    let isRecordExists = false;
    let targetRecordId = null;
    for (let recordId in chatRecords){
        if (chatRecords[recordId]['start'] === startChatTime && chatRecords[recordId]['uid'] === volunId){
            isRecordExists = true;
            targetRecordId = recordId;
            break;
        }
    }
    return {
        'isRecordExists': isRecordExists,
        'recordId': targetRecordId
    }
});