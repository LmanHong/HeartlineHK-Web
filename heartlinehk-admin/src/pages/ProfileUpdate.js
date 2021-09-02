import "../styles/ProfileUpdate.css";
import firebase from "firebase/app";
import "firebase/auth";
import { useRef } from "react";

const ProfileUpdate = (props)=>{

    const displayNameInputRef = useRef();

    const handleProfileUpdate = async (e)=>{
        e.preventDefault();
        try{
            if (props.currentUser){
                const newDisplayName = displayNameInputRef.current.value;
                if (newDisplayName != ""){
                    await props.currentUser.updateProfile({
                        displayName: newDisplayName
                    });
                    displayNameInputRef.current.value = "";
                    alert("Profile Update Successful!");
                }else throw new Error("New Display Name is null!");
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
                <button type="submit">更改資料</button>
            </form>
        </div>
    );
};

export default ProfileUpdate;