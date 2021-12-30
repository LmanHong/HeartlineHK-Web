import "../styles/ProfileUpdate.css";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";
import { useRef } from "react";

const ProfileUpdate = (props)=>{

    //Volunteer Preferred Name database reference
    const preferredNameRef = firebase.database().ref(`preferred_names/${props.currentUser.uid}`);
    //Volunteer Phone Number database reference
    const phoneNumberRef = firebase.database().ref(`phone_numbers/${props.currentUser.uid}`);

    const displayNameInputRef = useRef();
    const phoneNumberInputRef = useRef();

    const handleProfileUpdate = async (e)=>{
        e.preventDefault();
        try{
            if (props.currentUser){
                const newDisplayName = displayNameInputRef.current.value;
                const newPhoneNumber = phoneNumberInputRef.current.value;
                if (newDisplayName == "" && newPhoneNumber == "") throw new Error("Both Inputs are null!");
                if (newDisplayName != ""){
                    await preferredNameRef.child('preferredName').set(newDisplayName);
                    displayNameInputRef.current.value = "";
                }
                if (newPhoneNumber != ""){
                    await phoneNumberRef.set(parseInt(newPhoneNumber));
                    phoneNumberInputRef.current.value = "";
                }
                alert("Profile Update Successful!");
            }else throw new Error("Current User is null!");
        }catch(error){
            console.error("ERROR: "+error.message);
            alert(error.message);
        }
    };

    return (
        <div className="profile-update">
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