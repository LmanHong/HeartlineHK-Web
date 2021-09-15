const functions = require("firebase-functions");
const admin = require('firebase-admin');
const { google } = require('googleapis');
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
        'endDateTime': endDateTime.getTime()
    }

}

const getShiftsByVolunteers = (shiftSheet)=>{
    let shiftsByVolun = {};

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
                    const volunName = (colIdx < rowLength?shiftSheet[rowIdx][colIdx]:'');
                    const volunShift = timeslotByCol[colIdx];
    
                    if (!shiftsByVolun[volunName]) shiftsByVolun[volunName] = [];
                    shiftsByVolun[volunName].push(parseDatetime(rowDate, volunShift));
                }
            }
        }
    }
    console.log(shiftsByVolun);
}

exports.getVolunShifts = functions.region('asia-east2').https.onCall(async (data, context)=>{
    const auth = new google.auth.GoogleAuth({
        'keyFile': "./secrets.json",
        'scopes': "https://www.googleapis.com/auth/spreadsheets.readonly"
    });
    const client = await auth.getClient();
    const googleSheets = google.sheets({version: "v4", auth: client});

    const shiftSheetId = "1-5kjDRq0nK63v1KzK5FlAKgGSFgLgWiNyF4TR1dQiAs";

    const metaData = await googleSheets.spreadsheets.get({
        'auth': auth,
        'spreadsheetId': shiftSheetId
    });
    console.log(metaData.data);

});

exports.getVolunShiftsHttps = functions.region('asia-east2').https.onRequest(async (req, res)=>{

    //Flag indicating if this is in development
    const isDevelopment = true;

    //Sheet ID for the Volunteer shifts
    const shiftSheetId = "1-5kjDRq0nK63v1KzK5FlAKgGSFgLgWiNyF4TR1dQiAs";

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

    let sheetTitles = [];
    const metaData = await googleSheets.spreadsheets.get({
        'auth': auth,
        'spreadsheetId': shiftSheetId
    });
    for (let sheetIdx in metaData.data.sheets) sheetTitles.push(metaData.data.sheets[sheetIdx].properties.title);

    let sheetContents = {};
    for (let sheetIdx in sheetTitles){
        const shiftContents = await googleSheets.spreadsheets.values.get({
            'auth': auth,
            'spreadsheetId': shiftSheetId,
            'range': sheetTitles[sheetIdx]
        });
        //console.log("Sheet Title: "+sheetTitles[sheetIdx]);
        sheetContents[sheetTitles[sheetIdx]] = shiftContents.data.values;
        //console.log("----END----");
    }

    //console.log(sheetContents);

    getShiftsByVolunteers(sheetContents['SEP 2021']);

    //console.log(sheetContents);
    res.send("finished");
});