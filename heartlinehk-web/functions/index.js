const functions = require("firebase-functions");
const admin = require('firebase-admin');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const stripe = require('stripe')("sk_test_51KDUjmKGhlOCSkyzuCyurJKy2uory6ised3gIb9gQUO02vDO1NzHpN4jsoH2oe2QVGK2VZNc7x24LVp0vXhzfusl00eVDOGWD0");
const twilio = require('twilio');
const { ref } = require("firebase-functions/v1/database");
const VoiceResponse = twilio.twiml.VoiceResponse;
const taskrouter = twilio.jwt.taskrouter;
admin.initializeApp();

const DEV_URL = "https://84de-218-102-144-7.ngrok.io";

const ACTIVITY_SID = {
    OFFLINE: "WAc987bc93f4348a726633367204d10a0e",
    AVAILABLE: "WAef316e77aefbbe95fdec401a5d06a29e",
    TEXTCHATTING: "WAffa1c28894ece37a57f2a15d4b6a1c4d",
    CALLCHATTING: "WA971b0f221e46e9eaca8b72a2afdb90c9",
    IDLING: "WAa56a5dcb27c4104ee01105d11ac96453"
};

const TASK_STATUS = {
    CANCELED: "canceled",
    PENDING: "pending",
    RESERVED: "reserved",
    ASSIGNED: "assigned",
    WRAPPING: "wrapping",
    COMPLETED: "completed"
};

const ASSIGNED_STATUS = {
    CALL_ASSIGNED: "callAssigned",
    CALL_ACCEPTED: "callAccepted",
    CLIENT_LEFT: "clientLeft"
};

const CALL_QUEUE_STATUS = {
    IN_QUEUE: 'inQueue',
    CALL_ASSIGNED: 'callAssigned'
};

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

        //Delete disconnect_time, chat_assigned, typing_status, transfer_requests, chat_log, chat_queue
        admin.database().ref('disconnect_time').remove();
        admin.database().ref('chat_assigned').remove();
        admin.database().ref('call_assigned').remove();
        admin.database().ref('typing_status').remove();
        admin.database().ref('transfer_requests').remove();
        admin.database().ref('chat_log').remove();
        admin.database().ref('chat_queue').remove();
        admin.database().ref('call_queue').remove();

       
    }catch(error){
        console.error("ERROR: "+error.message);
    }
    return null;
});


const generateToken = (length)=>{
    let tmpToken = "";
    let charType = 0;
    let numOfChar = 26;
    let asciiStart = 97;
    for (let i=0; i<length; i++){
        charType = Math.floor(Math.random() * 3);
        numOfChar = (charType === 0 || charType === 1?26:10);
        asciiStart = (charType === 0?97:(charType === 1?65:48));
        tmpToken = tmpToken + String.fromCharCode(Math.floor(Math.random() * numOfChar) + asciiStart);
    }
    return tmpToken;
};

const sendResetPasswordEmail = async (toEmail, preferredName, token, loginEmail)=>{
    const resetLink = `https://admin-heartlinehk-8e3ec.web.app/reset-password?token=${token}&loginEmail=${loginEmail}`;
    const transporter = nodemailer.createTransport({
        service: 'hotmail',
        auth:{
            user: functions.config().heartlinehk.resetemail,
            pass: functions.config().heartlinehk.resetpwd
        }
    });

    const result = await transporter.sendMail({
        from: '"HeartlineHK IT Team" <heartlinehkresetpwd@outlook.com>',
        to: toEmail,
        subject: '[HearlineHK] Reset Volunteer Password',
        text: `Hi ${preferredName}, We have received your reset password request. Please click the link below to confirm your action, or ignore this email if you didn't submit any password reset. ${resetLink} Best Regards,<br/>HeartlineHK IT Team`,
        html: `<p>Hi ${preferredName},</p> <p>We have received your reset password request. Please click the link below to confirm your action, or ignore this email if you didn't submit any password reset.</p> <p><a href=${resetLink}>${resetLink}</a></p> <p>Best Regards,<br/>HeartlineHK IT Team</p>`
    });
    return result;
    
}

const createResetPasswordToken = async (loginEmail, newPassword)=>{
    if (typeof newPassword != 'string' || newPassword.length < 12) throw new Error('New password is not string or the length is less than 12!');
    
    const volunId = (await admin.auth().getUserByEmail(loginEmail)).uid;
    const token = generateToken(24);
    const requestRef = admin.firestore().collection('resetPwd').doc(volunId);
    
    const isOldRequestExists = (await requestRef.get()).exists;
    if (isOldRequestExists) console.warn("WARNING: Old request still exists for Volunteer "+loginEmail+"!");

    await requestRef.set({
        'token': token,
        'newPassword': newPassword,
        'time': admin.firestore.FieldValue.serverTimestamp()
    });
    return token;
}

exports.changePassword = functions.https.onCall(async (data, context)=>{
    const auth = await google.auth.getClient({scopes: ['https://www.googleapis.com/auth/spreadsheets']});
    const googleSheets = google.sheets({version: "v4", auth: auth});
    const credentialsSpreadsheetId = "1o91iiHV0ScnY-Vv01jVpg5L2wqj1M3qxLneWGoydBE4";

    const token = data.token;
    const loginEmail = data.loginEmail;
    const isLoggedIn = (context.auth != null);

    const loginEmailCol = 4; //Column E
    const pwdCol = 5; //Column F

    if ((token === null || typeof token != "string" || token.length === 0) || (loginEmail === null || typeof loginEmail != "string" || loginEmail.length === 0)) throw new functions.https.HttpsError('invalid-argument', 'Both token and login email must be non-empty strings!');
    else if (isLoggedIn) throw new functions.https.HttpsError('permission-denied', 'Already logged in!');

    try{
        const volunId = (await admin.auth().getUserByEmail(loginEmail)).uid;
        const preferredName = (await admin.database().ref('preferred_names').child(volunId).once('value')).val();
        const requestRef = admin.firestore().collection('resetPwd').doc(volunId);
        const recordRef = admin.firestore().collection('resetPwdRecord').doc();
        const requestDoc = await requestRef.get();
        if (requestDoc.exists){
            const requestData = requestDoc.data();
            if (requestData.token === token && requestData.time < Date.now()){
                let isVolunFound = false;
                const metaData = (await googleSheets.spreadsheets.get({'auth': auth, 'spreadsheetId': credentialsSpreadsheetId})).data.sheets;
                for (const sheetIdx in metaData){
                    const sheetContents = (await googleSheets.spreadsheets.values.get({'auth': auth, 'spreadsheetId': credentialsSpreadsheetId, 'range': metaData[sheetIdx].properties.title})).data.values;
                    for (const rowIdx in sheetContents){
                        if (sheetContents[rowIdx][loginEmailCol] === loginEmail){
                            isVolunFound = true;
                            await googleSheets.spreadsheets.values.update({
                                'auth': auth,
                                'spreadsheetId': credentialsSpreadsheetId,
                                'valueInputOption': "RAW",
                                'range': `${metaData[sheetIdx].properties.title}!${String.fromCharCode('A'.charCodeAt()+pwdCol)}${Number(rowIdx)+1}:${String.fromCharCode('A'.charCodeAt()+pwdCol)}${Number(rowIdx)+1}`,
                                'resource': {
                                    'values': [[requestData.newPassword]]
                                }
                            });
                            break;
                        }
                    }
                    if (isVolunFound) break;
                }

                await admin.auth().updateUser(volunId, {password: requestData.newPassword});
                await recordRef.set({
                    'volunId': volunId,
                    'requestTime': requestData.time,
                    'requestToken': requestData.token,
                    'finishTime': admin.firestore.FieldValue.serverTimestamp()
                });
                await requestRef.delete();
                return {
                    'loginEmail': loginEmail,
                    'preferredName': preferredName['preferredName'],
                    'volunId': volunId
                }
            }else throw new Error("Invalid rese password request contents!");
        }else throw new Error("No reset password request for "+loginEmail+"!");
    }catch(error){
        console.error("ERROR: "+error.message);
        throw new functions.https.HttpsError('unavailable', error.message);
    }
});

exports.requestChangePassword = functions.https.onCall(async (data, context)=>{
    const auth = await google.auth.getClient({scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']});
    const googleSheets = google.sheets({version: "v4", auth: auth});
    const credentialsSpreadsheetId = "1o91iiHV0ScnY-Vv01jVpg5L2wqj1M3qxLneWGoydBE4";

    const loginEmail = data.loginEmail;
    const newPassword = data.newPassword;

    if (loginEmail === null || newPassword === null) throw new functions.https.HttpsError('invalid-argument', "Login Email and New Password cannot be null!");

    const fullNameCol = 0; //Column A
    const preferredNameCol = 1; //Column B
    const personalEmailCol = 2; //Column C
    const loginEmailCol = 4; //Column E
    const pwdCol = 5; //Column F
    try{
        const metaData = (await googleSheets.spreadsheets.get({'auth': auth, 'spreadsheetId': credentialsSpreadsheetId})).data.sheets;
        let isVolunFound = false;
        let targetVolunDetails = null;
        for (const sheetIdx in metaData){
            console.log(sheetIdx+": "+metaData[sheetIdx].properties.title);
            const sheetContents = (await googleSheets.spreadsheets.values.get({'auth': auth, 'spreadsheetId': credentialsSpreadsheetId, 'range': metaData[sheetIdx].properties.title})).data.values;
            for (const rowIdx in sheetContents){
                if (sheetContents[rowIdx][loginEmailCol] === loginEmail){
                    targetVolunDetails = {
                        'name': sheetContents[rowIdx][fullNameCol],
                        'preferredName': sheetContents[rowIdx][preferredNameCol],
                        'personalEmail': sheetContents[rowIdx][personalEmailCol],
                        'loginEmail': sheetContents[rowIdx][loginEmailCol],
                        'oldPassword': sheetContents[rowIdx][pwdCol]
                    };
                    isVolunFound = true;
                    break;
                }
            }
            if (isVolunFound) break;
        }
        if (!isVolunFound) throw new Error('No volunteer found with login email '+loginEmail+'!');
        else{
            const token = await createResetPasswordToken(targetVolunDetails.loginEmail, newPassword);
            const result = await sendResetPasswordEmail(targetVolunDetails.personalEmail, targetVolunDetails.preferredName, token, targetVolunDetails.loginEmail);
            return {
                'mailId': result.messageId,
                'toEmail': targetVolunDetails.personalEmail
            }
        }
        
    }catch(error){
        console.error("ERROR: "+error.message);
        throw new functions.https.HttpsError('unavailable', error.message);
    }
});




// BELOW IS STRIPE FUNCTION

/*
exports.createCheckoutSession = functions.https.onCall(async (data, context)=>{
    const monthlyDonationPrices = {
        50: "price_1KG46yKGhlOCSkyzHWK6uMj4",
        100: "price_1KG48JKGhlOCSkyzlcegIcxs",
        200: "price_1KG48TKGhlOCSkyzqv0DWM9X",
        500: "price_1KG48cKGhlOCSkyzlrxskNsV"
    }
    
    const donationType = data.donationType;
    const donationAmount = Number(data.donationAmount);

    if (donationType == null || (donationType != "one-time" && donationType != "monthly")) throw new functions.https.HttpsError('invalid-argument', "Donation Type must either be one-time or monthly!");
    else if (Number.isNaN(donationAmount) || donationAmount < 50) throw new functions.https.HttpsError('invalid-argument', "Donation amount must be a number larger than 50!");

    const referenceIdRef = await admin.database().ref('stripe_records').push();
    console.log(referenceIdRef.key);

    const paymentMethods = ["card"];
    let lineItem = {
        quantity: 1
    };
    if (donationType == "one-time"){
        paymentMethods.push("wechat_pay");
        lineItem.price_data = {
            currency: "hkd",
            product_data: {
                name: `HKD\$${donationAmount} 單次捐款`
            },
            unit_amount_decimal: donationAmount*100 
        }
    }else lineItem.price = monthlyDonationPrices[donationAmount];

    const sessionObject = {
        client_reference_id: referenceIdRef.key,
        expires_at: Date.now() / 1000 + 1800,
        line_items: [lineItem],
        mode: (donationType=="one-time"?"payment":"subscription"),
        payment_method_types: paymentMethods,
        payment_method_options: {
            wechat_pay:{
                client: "web"
            }
        },
        success_url: `http://localhost:3000/donation-success?reference_id=${referenceIdRef.key}`,
        cancel_url: 'http://localhost:3000/donation'
    };
    if (donationType == "one-time") sessionObject.submit_type = "donate";

    const session = await stripe.checkout.sessions.create(sessionObject);
    referenceIdRef.set(session.id);
    console.log(session);

    return {
        "redirectUrl": session.url
    }

});
*/



// BELOW ARE TWILIO WEBHOOKS

// This function will be called when Twilio phone number receives incoming calls
exports.receiveCalls = functions.runWith({minInstances: 1}).https.onRequest(async (req, res)=>{
    //Add to the call queue
    const callQueueRef = admin.database().ref('call_queue');
    await callQueueRef.child(req.body.CallSid).set({
        time: admin.database.ServerValue.TIMESTAMP
    });
    
    console.log(req.body.CallSid, req.body.CallStatus);

    const twiml = new VoiceResponse();
    const callAudioUrl = functions.config().heartlinehk.callaudio;
    twiml.play(callAudioUrl);
    twiml.enqueue({workflowSid: 'WWeb19088cbfe4ccca1114a82a9e1c5d67'});

    res.type('text/xml');
    res.send(twiml.toString());
});

// This function will be called when an incoming call to Twilio phone number ends
exports.endedCalls = functions.runWith({minInstances: 1}).https.onRequest(async (req, res)=>{
    console.log(req.body.CallSid, req.body.CallStatus);
    if (req.body.CallStatus == "completed"){
        const callQueueRef = admin.database().ref('call_queue');
        await callQueueRef.child(req.body.CallSid).remove();

        const callAssignedRef = admin.database().ref('call_assigned');
        const assignedInfo = (await callAssignedRef.child(req.body.CallSid).once('value')).val();
        if (assignedInfo != null) await callAssignedRef.child(req.body.CallSid).set({
            time: admin.database.ServerValue.TIMESTAMP,
            volunId: assignedInfo.volunId,
            taskSid: assignedInfo.taskSid,
            status: ASSIGNED_STATUS.CLIENT_LEFT,
            acceptedTime: assignedInfo.acceptedTime,
            enqueueTime: assignedInfo.enqueueTime
        });
    }

    res.status(200).send("Call Status Changed");
});

// This function will be called when a enqeued call is assigned to an available worker
exports.assignCall = functions.runWith({minInstances: 1}).https.onRequest(async (req, res)=>{
    const callQueueRef = admin.database().ref('call_queue');
    const callAssignedRef = admin.database().ref('call_assigned');
    
    const callSid = JSON.parse(req.body.TaskAttributes).call_sid;
    const taskSid = req.body.TaskSid;
    const volunId = JSON.parse(req.body.WorkerAttributes).volun_id;

    const queueInfo = (await callQueueRef.child(callSid).once('value')).val();
    console.log(queueInfo);
    await callQueueRef.child(callSid).remove();
    await callAssignedRef.child(callSid).set({
        time: admin.database.ServerValue.TIMESTAMP,
        volunId: volunId,
        taskSid: taskSid,
        status: ASSIGNED_STATUS.CALL_ASSIGNED,
        acceptedTime: null,
        enqueueTime: queueInfo.time
    });

    res.status(200).send({
        instruction: "call",
        to: req.body.WorkerAttributes.contact_uri,
        from: "+85230016615",
        url: `https://us-central1-heartlinehk-8e3ec.cloudfunctions.net/workerPreCall?ReservationSid=${req.body.ReservationSid}&TaskSid=${req.body.TaskSid}&CallSid=${callSid}`
    });
});

exports.workerPreCall = functions.runWith({minInstances: 1}).https.onRequest((req, res)=>{
    const reservationSid = req.query.ReservationSid;
    const taskSid = req.query.TaskSid;
    const callSid = req.query.CallSid;
    
    const twiml = new VoiceResponse();
    const gatherTwiml = twiml.gather({
        action: `https://us-central1-heartlinehk-8e3ec.cloudfunctions.net/workerPreCallResult?ReservationSid=${reservationSid}&TaskSid=${taskSid}&CallSid=${callSid}`,
        method: 'POST',
        numDigits: 1
    });
    gatherTwiml.say({voice: 'alice', language: 'zh-HK'}, '你即將與來電者進行對話, 請按任何一個數字以確認');
    twiml.redirect({
        method: 'POST'
    }, `https://us-central1-heartlinehk-8e3ec.cloudfunctions.net/workerPreCallResult?ReservationSid=${reservationSid}&TaskSid=${taskSid}&CallSid=${callSid}`);

    res.type('text/xml');
    res.send(twiml.toString());
});

exports.workerPreCallResult = functions.runWith({minInstances: 1}).https.onRequest(async (req, res)=>{
    const accountSid = functions.config().heartlinehk.twilioaccountsid;
    const authToken = functions.config().heartlinehk.twilioauthtoken;
    const workspaceSid = functions.config().heartlinehk.twilioworkspacesid;

    const callQueueRef = admin.database().ref('call_queue');
    const callAssignedRef = admin.database().ref('call_assigned');

    const reservationSid = req.query.ReservationSid;
    const taskSid = req.query.TaskSid;
    const callSid = req.query.CallSid;
    const assignedInfo = (await callAssignedRef.child(callSid).once('value')).val();

    const twiml = new VoiceResponse();

    try{
        if (req.body.Digits && req.body.Digits.length > 0) {
            // Volunteer accepts the incoming call
            await callAssignedRef.child(callSid).set({
                time: admin.database.ServerValue.TIMESTAMP,
                volunId: assignedInfo.volunId,
                taskSid: assignedInfo.taskSid,
                status: ASSIGNED_STATUS.CALL_ACCEPTED,
                acceptedTime: admin.database.ServerValue.TIMESTAMP,
                enqueueTime: assignedInfo.enqueueTime
            });
            const dialTwiml = twiml.dial();
            dialTwiml.queue({reservationSid: reservationSid });
        }else{
            // Volunteer rejects the incoming call
            const twilioClient = twilio(accountSid, authToken);

            await callAssignedRef.child(callSid).remove();
            await callQueueRef.child(callSid).set({
                time: assignedInfo.enqueueTime
            });

            let rejectedReservation = await twilioClient.taskrouter
                .workspaces(workspaceSid)
                .tasks(taskSid)
                .reservations(reservationSid)
                .update({reservationStatus: 'rejected', workerActivitySid: ACTIVITY_SID.IDLING});

            twiml.hangup();
        }
        res.type('text/xml');
        res.send(twiml.toString());
    }catch(error){
        throw new functions.https.HttpsError('aborted', error.message);
    }
    
});


// BELOW ARE TWILIO RELATED FIREBASE WEBHOOKS 

exports.autoUpdateWorkerActivity = functions.database.ref('/online_time/{volunId}').onDelete(async (snapshot, context)=>{
    const accountSid = functions.config().heartlinehk.twilioaccountsid;
    const authToken = functions.config().heartlinehk.twilioauthtoken;
    const workspaceSid = functions.config().heartlinehk.twilioworkspacesid;

    const volunId = context.params.volunId;
    const workerSid = (await admin.database().ref(`twilio_workers/${volunId}`).once('value')).val();

    console.log(volunId);
    console.log(workerSid);

    if (workerSid != null){
        const twilioClient = twilio(accountSid, authToken);
        try{
            let worker = await twilioClient.taskrouter
                .workspaces(workspaceSid)
                .workers(workerSid)
                .fetch();

            if (worker.activitySid == ACTIVITY_SID.IDLING){
                let updatedWorker = await twilioClient.taskrouter
                    .workspaces(workspaceSid)
                    .workers(workerSid)
                    .update({activitySid: ACTIVITY_SID.OFFLINE});
            }

        }catch(error){
            throw new functions.https.HttpsError('aborted', error.message);
        }
    }
});



// BELOW ARE TWILIO RELATED FIREBASE HTTP REQUESTS

exports.createTwilioWorker = functions.https.onCall(async (data, context)=>{
    const accountSid = functions.config().heartlinehk.twilioaccountsid;
    const authToken = functions.config().heartlinehk.twilioauthtoken;
    const workspaceSid = functions.config().heartlinehk.twilioworkspacesid;

    if (context.auth == null) throw new functions.https.HttpsError('unauthenticated', "Not logged in!");
    const volunId = context.auth.uid;

    const twilioClient = twilio(accountSid, authToken);
    const workerSid = (await admin.database().ref(`twilio_workers/${volunId}`).once('value')).val();
    try{
        let worker = null;
        if (workerSid !== null){
            worker = await twilioClient.taskrouter
                .workspaces(workspaceSid)
                .workers(workerSid)
                .fetch();
        }else{
            const preferredName = (await admin.database().ref(`preferred_names/${volunId}`).once('value')).val();
            worker = await twilioClient.taskrouter
                .workspaces(workspaceSid)
                .workers
                .create({
                    friendlyName: (preferredName?preferredName['preferredName']:volunId),
                    activitySid: ACTIVITY_SID.OFFLINE,
                    attributes: JSON.stringify({
                        volun_id: volunId
                    })
                });
            await admin.database().ref(`twilio_workers/${volunId}`).set(worker.sid);
        }
        
        return {
            workerName: worker.friendlyName,
            phoneNumber: JSON.parse(worker.attributes).contact_uri,
            activitySid: worker.activitySid,
            activityName: worker.activityName
        };
    }catch(error){
        throw new functions.https.HttpsError('aborted', error.message);
    }
});

const updateWorkerObject = async (accountSid, authToken, workspaceSid, workerSid, updatePayload)=>{
    const twilioClient = twilio(accountSid, authToken);
    let updatedWorker = await twilioClient.taskrouter
        .workspaces(workspaceSid)
        .workers(workerSid)
        .update(updatePayload);
    return updatedWorker;
}

exports.updateWorkerPhoneNumber = functions.https.onCall(async (data, context)=>{
    const accountSid = functions.config().heartlinehk.twilioaccountsid;
    const authToken = functions.config().heartlinehk.twilioauthtoken;
    const workspaceSid = functions.config().heartlinehk.twilioworkspacesid;

    if (context.auth == null) throw new functions.https.HttpsError('unauthenticated', "Not logged in!");
    const volunId = context.auth.uid;

    const phoneNumber = Number(data.phoneNumber);
    if (Number.isNaN(phoneNumber) || phoneNumber < 20000000) throw new functions.https.HttpsError('invalid-argument', "Not a phone number!");

    const workerSid = (await admin.database().ref(`twilio_workers/${volunId}`).once('value')).val();
    if (workerSid == null) throw new functions.https.HttpsError('failed-precondition', "Worker SID for this volunteer is not found!");
    
    try{
        let updatedWorker = await updateWorkerObject(accountSid, authToken, workspaceSid, workerSid, {attributes: '{"contact_uri":"+852'+phoneNumber+'", "volun_id":"'+volunId+'"}'});
        console.log(updatedWorker.attributes);
        return {
            workerName: updatedWorker.friendlyName,
            phoneNumber: JSON.parse(updatedWorker.attributes).contact_uri
        };
    }catch(error){
        throw new functions.https.HttpsError('aborted', error.message);
    }
});

exports.updateWorkerActivity = functions.runWith({minInstances: 3}).https.onCall(async (data, context)=>{
    const accountSid = functions.config().heartlinehk.twilioaccountsid;
    const authToken = functions.config().heartlinehk.twilioauthtoken;
    const workspaceSid = functions.config().heartlinehk.twilioworkspacesid;

    if (context.auth == null) throw new functions.https.HttpsError('unauthenticated', "Not logged in!");
    const volunId = context.auth.uid;
    
    const activitySid = data.activitySid;
    if (!Object.values(ACTIVITY_SID).includes(activitySid)) throw new functions.https.HttpsError('invalid-argument', "Invalid Activity SID!");

    const workerSid = (await admin.database().ref(`twilio_workers/${volunId}`).once('value')).val();
    if (workerSid == null) throw new functions.https.HttpsError('failed-precondition', "Worker SID for this volunteer is not found!");

    try{
        let updatedWorker = await updateWorkerObject(accountSid, authToken, workspaceSid, workerSid, {activitySid: activitySid});
        return {
            workerName: updatedWorker.friendlyName,
            phoneNumber: JSON.parse(updatedWorker.attributes).contact_uri,
            activitySid: updatedWorker.activitySid,
            activityName: updatedWorker.activityName
        };
    }catch(error){
        throw new functions.https.HttpsError('aborted', error.message);
    }

});

exports.getWorkerActivity = functions.runWith({minInstances: 3}).https.onCall(async (data, context)=>{
    const accountSid = functions.config().heartlinehk.twilioaccountsid;
    const authToken = functions.config().heartlinehk.twilioauthtoken;
    const workspaceSid = functions.config().heartlinehk.twilioworkspacesid;

    if (context.auth == null) throw new functions.https.HttpsError('unauthenticated', "Not logged in!");
    const volunId = context.auth.uid;

    const workerSid = (await admin.database().ref(`twilio_workers/${volunId}`).once('value')).val();
    if (workerSid == null) throw new functions.https.HttpsError('failed-precondition', "Worker SID for this volunteer is not found!");

    const twilioClient = twilio(accountSid, authToken);
    try{
        let worker = await twilioClient.taskrouter
            .workspaces(workspaceSid)
            .workers(workerSid)
            .fetch();
        return {
            workerName: worker.friendlyName,
            phoneNumber: JSON.parse(worker.attributes).contact_uri,
            activitySid: worker.activitySid,
            activityName: worker.activityName
        };
    }catch(error){
        throw new functions.https.HttpsError('aborted', error.message);
    }
});

exports.updateTaskStatus = functions.runWith({minInstances: 1}).https.onCall(async (data, context)=>{
    const accountSid = functions.config().heartlinehk.twilioaccountsid;
    const authToken = functions.config().heartlinehk.twilioauthtoken;
    const workspaceSid = functions.config().heartlinehk.twilioworkspacesid;

    if (context.auth == null) throw new functions.https.HttpsError('unauthenticated', "Not logged in!");
    const volunId = context.auth.uid;

    const status = data.status;
    if (!Object.values(TASK_STATUS).includes(status)) throw new functions.https.HttpsError('invalid-argument', "Invalid Task Status!");

    const taskSid = data.taskSid;
    const callsAssigned = (await admin.database().ref('call_assigned').once('value')).val();
    let assignedInfo = null;
    for (const callSid in callsAssigned){
        if (callsAssigned[callSid].taskSid == taskSid){
            assignedInfo = callsAssigned[callSid];
            break;
        }
    }
    if (assignedInfo == null || assignedInfo.volunId != volunId) throw new functions.https.HttpsError('permission-denied', "Cannot update tasks not assigned to the volunteer!");

    const workerSid = (await admin.database().ref(`twilio_workers/${volunId}`).once('value')).val();
    if (workerSid == null) throw new functions.https.HttpsError('failed-precondition', "Worker SID for this volunteer is not found!");

    const twilioClient = twilio(accountSid, authToken);
    try{
        let updatedTask = await twilioClient.taskrouter
            .workspaces(workspaceSid)
            .tasks(taskSid)
            .update({assignmentStatus: status});
        return {
            taskSid: updatedTask.sid,
            status: updatedTask.assignment_status
        };
    }catch(error){
        throw new functions.https.HttpsError('aborted', error.message);
    }
});

exports.getTaskStatus = functions.https.onCall(async (data, context)=>{
    const accountSid = functions.config().heartlinehk.twilioaccountsid;
    const authToken = functions.config().heartlinehk.twilioauthtoken;
    const workspaceSid = functions.config().heartlinehk.twilioworkspacesid;

    if (context.auth == null) throw new functions.https.HttpsError('unauthenticated', "Not logged in!");
    const volunId = context.auth.uid; 

    const taskSid = data.taskSid;
    const callsAssigned = (await admin.database().ref('call_assigned').once('value')).val();
    let assignedInfo = null;
    for (const callSid in callsAssigned){
        if (callsAssigned[callSid].taskSid == taskSid){
            assignedInfo = callsAssigned[callSid];
            break;
        }
    }
    if (assignedInfo == null || assignedInfo.volunId != volunId) throw new functions.https.HttpsError('permission-denied', "Cannot get task status not assigned to the volunteer!");

    const workerSid = (await admin.database().ref(`twilio_workers/${volunId}`).once('value')).val();
    if (workerSid == null) throw new functions.https.HttpsError('failed-precondition', "Worker SID for this volunteer is not found!");

    const twilioClient = twilio(accountSid, authToken);
    try{
        let task = await twilioClient.taskrouter
            .workspaces(workspaceSid)
            .tasks(taskSid)
            .fetch();
        return {
            taskSid: task.sid,
            status: task.assignment_status
        };
    }catch(error){
        throw new functions.https.HttpsError('aborted', error.message);
    }
});