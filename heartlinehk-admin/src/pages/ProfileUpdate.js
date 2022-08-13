import "../styles/ProfileUpdate.css";
import { getDatabase, ref, set } from "firebase/database";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useRef, useState } from "react";
import Loading from "../components/Loading";
import { useDatabase } from "../hooks/useDatabase";
import { getApp } from "firebase/app";
import { HeartlineNotFoundError } from "../misc/HeartlineError";

const ProfileUpdate = (props)=>{

    //Volunteer Preferred Name database reference
    const updateWorkerPhoneNumber = httpsCallable(getFunctions(getApp(), 'us-central1'), 'updateWorkerPhoneNumber');
    const createTwilioWorker = httpsCallable(getFunctions(getApp(), 'us-central1'), 'createTwilioWorker');

    const phoneNumberInputRef = useRef();

    const [isLoading, setIsLoading] = useState(false);

    const handleProfileUpdate = async (e)=>{
        e.preventDefault();
        try{
            if (props.currentUser){
                const newPhoneNumber = phoneNumberInputRef.current.value;
                setIsLoading(true);
                if (newPhoneNumber != ""){
                    const result = await createTwilioWorker();
                    console.log(result.data);
                    const { data } = await updateWorkerPhoneNumber({phoneNumber: newPhoneNumber});
                    console.log(data);
                    phoneNumberInputRef.current.value = "";
                }else throw new HeartlineNotFoundError("New phone number is null!");
                setIsLoading(false);
                alert("Profile Update Successful!");
            }else throw new Error("Current User is null!");
        }catch(error){
            console.error("ERROR: "+error);
            setIsLoading(false);
            alert(error.message);
        }
    };

    return (
        <div className="profile-update">
            {isLoading && <Loading/>}
            <form className="update-form" onSubmit={handleProfileUpdate}>
                <label htmlFor="phone-number-input">新電話號碼</label>
                <input ref={phoneNumberInputRef} type="tel" placeholder="12345678" name="phone-number-input" id="phone-number-input" pattern="[2-9][0-9]{7}" />
                <button type="submit">更改資料</button>
            </form>
        </div>
    );
};

export default ProfileUpdate;