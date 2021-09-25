const functions = require("firebase-functions");
const admin = require('firebase-admin');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
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

exports.checkChatRecord = functions.https.onCall(async (data, context)=>{
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

const parseDatetime = (dateString, timeslotString)=>{
    //Example:
    //dateString = '24/9/2021(FRI)'
    //timeslotString = '1900 - 0100'

    const dateRegEx = new RegExp('(([1-9])|((1|2)[0-9])|(3[0-1]))/((1[0-2])|([1-9]))/[0-9]{4}');
    const timeRegEx = new RegExp('[0-9]{4}', 'g');
    const dateMatch = dateString.match(dateRegEx);
    const timeMatch = timeslotString.match(timeRegEx);
    if (!dateMatch) throw new Error('Not a valid date string! '+dateString);
    if (!timeMatch || timeMatch.length != 2) throw new Error('Not a valid timeslot string! '+timeslotString);

    const firstSlash = dateMatch[0].indexOf('/');
    const secondSlash = dateMatch[0].indexOf('/', (firstSlash+1));

    const dateMatchDate = parseInt(dateMatch[0].substring(0, firstSlash));
    const dateMatchMonth = parseInt(dateMatch[0].substring(firstSlash+1, secondSlash)) - 1;
    const dateMatchYear = parseInt(dateMatch[0].substring(secondSlash+1, dateMatch[0].length));

    const startHour = parseInt(timeMatch[0].substring(0, 2));
    const startMinute = parseInt(timeMatch[0].substring(2, 4));
    const endHour = parseInt(timeMatch[1].substring(0,2));
    const endMinute = parseInt(timeMatch[1].substring(2,4));

    const startDateTime = new Date(dateMatchYear, dateMatchMonth, (startHour < 12 ?dateMatchDate+1:dateMatchDate), startHour, startMinute);
    const endDateTime = new Date(dateMatchYear, dateMatchMonth, (endHour < 12 ?dateMatchDate+1:dateMatchDate), endHour, endMinute);

    return {
        'startDateTime': startDateTime.getTime(),
        'endDateTime': endDateTime.getTime(),
        'dateTimeString': `${timeslotString},${dateString}`
    }

}

const getShiftsByVolunteer = (shiftSheet, preferredName, lastName, firstName)=>{
    let shiftsByVolun = [];

    if (shiftSheet === null) throw new Error("Shift Sheet is null!");
    else if (preferredName === "") throw new Error("Preferred Name is empty string!");
    else if (lastName === "") throw new Error("Last Name is empty string!");
    else if (firstName === "") throw new Error("First Name is empty string!");

    const preferredNameRegEx = new RegExp(preferredName.toLowerCase());
    const lastNameRegEx = new RegExp(lastName.toLowerCase());
    const firstNameRegEx = new RegExp(firstName.toLowerCase());

    const dateRegEx = new RegExp('Date');
    const timeslotRegEx = new RegExp('[0-9]{4} - [0-9]{4}');
    const supervisorRegEx = new RegExp('Team');

    let dateCol = null;
    let timeslotByCol = {};
    for (let rowIdx in shiftSheet){
        if (rowIdx === '0'){
            for (let colIdx in shiftSheet[rowIdx]){
                let dateMatch = shiftSheet[rowIdx][colIdx].match(dateRegEx);
                let timeslotMatch = shiftSheet[rowIdx][colIdx].match(timeslotRegEx);
                let supervisorMatch = shiftSheet[rowIdx][colIdx].match(supervisorRegEx);
                if (dateMatch) dateCol = colIdx;
                else if (timeslotMatch) timeslotByCol[colIdx] = timeslotMatch[0];
                else if (supervisorMatch) timeslotByCol[colIdx] = "1900 - 0500";
            }
        }else{
            const colCount = Object.keys(timeslotByCol).length + 1;
            const rowLength = shiftSheet[rowIdx].length;
            for (let colIdx=0; colIdx<colCount; colIdx++){
                if (colIdx != dateCol){
                    const rowDate = shiftSheet[rowIdx][dateCol];
                    const volunName = (colIdx < rowLength?shiftSheet[rowIdx][colIdx]:'').toLowerCase();
                    const volunShift = timeslotByCol[colIdx];

                    if (volunName != '' && ((volunName.match(firstNameRegEx) && volunName.match(lastNameRegEx)) || volunName.match(preferredNameRegEx))) shiftsByVolun.push(parseDatetime(rowDate, volunShift));
                }
            }
        }
    }
    console.log(shiftsByVolun);
    return shiftsByVolun;
}

exports.getVolunShifts = functions.https.onCall(async (data, context)=>{
    const auth = await google.auth.getClient({scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']});
    const googleSheets = google.sheets({version: "v4", auth: auth});
    const shiftSpreadsheetId = "1-5kjDRq0nK63v1KzK5FlAKgGSFgLgWiNyF4TR1dQiAs";

    const monthAbbreviations = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    const requiredMonth = data.month;
    const requiredYear = data.year;
    const volunId = context.auth.uid;

    if (requiredMonth === null || !(typeof requiredMonth === 'number') || requiredMonth < 0 || requiredMonth > 11) throw new functions.https.HttpsError('invalid-argument', "Required Month is either null or not a valid number!");
    else if (requiredYear === null || !(typeof requiredYear === 'number')) throw new functions.https.HttpsError('invalid-argument', "Required Year is either null or not a number!");
    else if (volunId === null) throw new functions.https.HttpsError('unauthenticated', "User is not logged in!");

    const sheetTitle = `${monthAbbreviations[requiredMonth]} ${requiredYear}`;
    try{
        const sheetContents = (await googleSheets.spreadsheets.values.get({'auth': auth, 'spreadsheetId': shiftSpreadsheetId, 'range': sheetTitle})).data.values;
        const volunName = (await admin.database().ref(`preferred_names/${volunId}`).once('value')).val();
        if (volunName === null) throw new Error("No record of volunteer's name!");
        const volunShifts = getShiftsByVolunteer(sheetContents, volunName['preferredName'], volunName['lastName'], volunName['firstName']);
        return {
            'volunShifts': volunShifts
        };
    }catch(error){
        console.error("ERROR: "+error.message);
        throw new functions.https.HttpsError('unavailable', error.message);
    }
});

/*
exports.getVolunShiftsHttps = functions.region('asia-east2').https.onRequest(async (req, res)=>{

    //Flag indicating if this is in development
    const isDevelopment = true;

    //Sheet ID for the Volunteer shifts
    const shiftSpreadsheetId = "1-5kjDRq0nK63v1KzK5FlAKgGSFgLgWiNyF4TR1dQiAs";

    //Development auth
    const devAuth = new google.auth.GoogleAuth({
        'keyFile': "./secrets.json",
        'scopes': "https://www.googleapis.com/auth/spreadsheets.readonly"
    });
    const client = await devAuth.getClient();

    //Production auth
    const productionAuth = await google.auth.getClient({scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']});
    const googleSheets = google.sheets({version: "v4", auth: (isDevelopment?client:productionAuth)});

    const auth = (isDevelopment?client:productionAuth);

    const monthAbbreviations = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    const requiredMonth = 8;
    const requiredYear = 2021;
    const volunId = "3mdl1mXjOVP0zjBtSUihLnS8KMz2";

    if (requiredMonth === null || !(typeof requiredMonth === 'number') || requiredMonth < 0 || requiredMonth > 11) throw new functions.https.HttpsError('invalid-argument', "Required Month is either null or not a valid number!");
    else if (requiredYear === null || !(typeof requiredYear === 'number')) throw new functions.https.HttpsError('invalid-argument', "Required Year is either null or not a number!");
    else if (volunId === null) throw new functions.https.HttpsError('unauthenticated', "User is not logged in!");

    const sheetTitle = `${monthAbbreviations[requiredMonth]} ${requiredYear}`;
    try{
        const sheetContents = (await googleSheets.spreadsheets.values.get({'auth': auth, 'spreadsheetId': shiftSpreadsheetId, 'range': sheetTitle})).data.values;
        const volunName = (await admin.database().ref(`preferred_names/${volunId}`).once('value')).val();
        if (volunName === null) throw new Error("No record of volunteer's name!");
        const volunShifts = getShiftsByVolunteer(sheetContents, volunName['preferredName'], volunName['lastName'], volunName['firstName']);
        res.send(volunShifts);
    }catch(error){
        console.error("ERROR: "+error.message);
        res.send("ERROR: "+error.message);
    }
});
*/

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

/*
exports.requestChangePasswordHttps = functions.region('asia-east2').https.onRequest(async (req, res)=>{
    //Development Auth ONLY!
    const devAuth = new google.auth.GoogleAuth({
        'keyFile': "./secrets.json",
        'scopes': "https://www.googleapis.com/auth/spreadsheets.readonly"
    });
    const auth = await devAuth.getClient();

    const googleSheets = google.sheets({version: "v4", auth: auth});
    const credentialsSpreadsheetId = "1o91iiHV0ScnY-Vv01jVpg5L2wqj1M3qxLneWGoydBE4";

    const personalEmail = "lmanpegasis@gmail.com"
    const loginEmail = "lmanhong@testing.com";
    const newPassword = "changedpassword";

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
                if (sheetContents[rowIdx][loginEmailCol] === loginEmail && sheetContents[rowIdx][personalEmailCol] === personalEmail){
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
        if (!isVolunFound) throw new functions.https.HttpsError('not-found', "No Volunteer Found!");
        else{
            console.log()
            const token = await createResetPasswordToken(targetVolunDetails.loginEmail, newPassword);
            const result = await sendResetPasswordEmail(targetVolunDetails.personalEmail, targetVolunDetails.preferredName, token, targetVolunDetails.loginEmail);
            res.send("Email ID: "+result.messageId+" <> Address: "+targetVolunDetails.personalEmail);
        }
    }catch(error){
        console.error("ERROR: "+error.message);
        throw new functions.https.HttpsError('unavailable', error.message);
    }
});
*/