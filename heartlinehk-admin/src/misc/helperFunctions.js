
export const getChatRecordFormUrl = (startChatMsec, endChatMsec)=>{
    //Chat record Google Form
    const recordFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdsD_qLU51OC9UY0Rrx_Ht52aU0TgPU-LUu5yNp4ta8cYu0yQ/viewform?usp=pp_url";    
    //Chat record Google Form field entries
    const recordFormEntries = {
        'date': "entry.1533999842",
        'startTime': "entry.240218030",
        'endTime': "entry.1133078412"
    }

    let startChatTime = new Date(startChatMsec);
    const startChatHour = (startChatTime.getHours()<10?"0"+startChatTime.getHours().toString():startChatTime.getHours().toString());
    const startChatMinutes = (startChatTime.getMinutes()<10?"0"+startChatTime.getMinutes().toString():startChatTime.getMinutes().toString());

    let endChatTime = new Date(endChatMsec);
    const endChatHour = (endChatTime.getHours()<10?"0"+endChatTime.getHours().toString():endChatTime.getHours().toString());
    const endChatMinutes = (endChatTime.getMinutes()<10?"0"+endChatTime.getMinutes().toString():endChatTime.getMinutes().toString());
    const currentMonth = (endChatTime.getMonth()+1<10?"0"+(endChatTime.getMonth()+1).toString():(endChatTime.getMonth()+1).toString());
    const currentDay = (endChatTime.getDate()<10?"0"+endChatTime.getDate().toString():endChatTime.getDate().toString());

    const prefilledRecordFormUrl = recordFormUrl+'&'+recordFormEntries['date']+'='+endChatTime.getFullYear()+'-'+currentMonth+'-'+currentDay+'&'+recordFormEntries['startTime']+'='+startChatHour+":"+startChatMinutes+'&'+recordFormEntries['endTime']+'='+endChatHour+":"+endChatMinutes;
    //let popupWindowRef = window.open(prefilledRecordFormUrl, "ChatRecordForm", 'resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes');
    return prefilledRecordFormUrl;
}