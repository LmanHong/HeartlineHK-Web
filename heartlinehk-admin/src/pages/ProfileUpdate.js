import "../styles/ProfileUpdate.css";
import { getDatabase, ref, set } from "firebase/database";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useRef, useState } from "react";
import Loading from "../components/Loading";
import { useDatabase } from "../hooks/useDatabase";
import { getApp } from "firebase/app";

const ProfileUpdate = (props)=>{

    //Volunteer Preferred Name database reference
    const preferredNameRef = ref(getDatabase(), `preferred_names/${props.currentUser.uid}`);
    const updateWorkerPhoneNumber = httpsCallable(getFunctions(getApp(), 'us-central1'), 'updateWorkerPhoneNumber');
    const createTwilioWorker = httpsCallable(getFunctions(getApp(), 'us-central1'), 'createTwilioWorker');

    const displayNameInputRef = useRef();
    const phoneNumberInputRef = useRef();

    const [isLoading, setIsLoading] = useState(false);

    const handleProfileUpdate = async (e)=>{
        e.preventDefault();
        try{
            if (props.currentUser){
                const newDisplayName = displayNameInputRef.current.value;
                const newPhoneNumber = phoneNumberInputRef.current.value;
                if (newDisplayName == "" && newPhoneNumber == "") throw new Error("Both Inputs are null!");
                setIsLoading(true);
                if (newDisplayName != ""){
                    await set(preferredNameRef, newDisplayName);
                    displayNameInputRef.current.value = "";
                }
                if (newPhoneNumber != ""){
                    const result = await createTwilioWorker();
                    console.log(result.data);
                    const { data } = await updateWorkerPhoneNumber({phoneNumber: newPhoneNumber});
                    console.log(data);
                    phoneNumberInputRef.current.value = "";
                }
                setIsLoading(false);
                alert("Profile Update Successful!");
            }else throw new Error("Current User is null!");
        }catch(error){
            console.error("ERROR: "+error.message);
            setIsLoading(false);
            alert(error.message);
        }
    };

    return (
        <div className="profile-update">
            {isLoading && <Loading/>}
            <form className="update-form" onSubmit={handleProfileUpdate}>
                <label htmlFor="display-name-input">新顯示名稱</label>
                <input ref={displayNameInputRef} type="text" name="display-name-input" id="display-name-input" />
                <label htmlFor="phone-number-input">新電話號碼</label>
                <input ref={phoneNumberInputRef} type="tel" placeholder="12345678" name="phone-number-input" id="phone-number-input" pattern="[2-9][0-9]{7}" />
                <button type="submit">更改資料</button>
            </form>
        </div>
    );
};

export default ProfileUpdate;