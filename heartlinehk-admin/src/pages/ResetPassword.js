import "../styles/ResetPassword.css";
import Loading from "../components/Loading.js";
import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/functions";

const ResetPassword = (props)=>{

    const [isPasswordContainsInvalidChar, setPasswordContainsInvalidChar] = useState(null);
    const [isPasswordTooShort, setIsPasswordTooShort] = useState(null);
    const [isBothPasswordSame, setIsBothPasswordSame] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPasswordChanged, setIsPasswordChanged] = useState(null);
    const [accountChanged, setAccountChanged] = useState(null);
    const [error, setError] = useState(null);
    const query = new URLSearchParams(useLocation().search);

    const checkPasswordValidity = (e)=>{
        const whiteListSpcChars = '!#$%&*+-=?@^_|';
        let newPassword = document.getElementById('new-password').value;
        let confirmPassword = document.getElementById('confirm-password').value;
        if (newPassword != '' && confirmPassword != ''){
            setIsBothPasswordSame((newPassword === confirmPassword));
            setIsPasswordTooShort(newPassword.length < 12);
            for (const idx in newPassword){
                if (!((newPassword[idx] >= '0' && newPassword[idx] <= '9') || (newPassword[idx] >= 'a' && newPassword[idx] <= 'z') || (newPassword[idx] >= 'A' && newPassword[idx] <= 'Z') || (whiteListSpcChars.includes(newPassword[idx])))){
                    console.log(newPassword[idx]);
                    setPasswordContainsInvalidChar(true);
                    break;
                }else if (Number(idx) === (newPassword.length - 1)) setPasswordContainsInvalidChar(false);
            }
        }else{
            setIsBothPasswordSame(null);
            setIsPasswordTooShort(null);
            setPasswordContainsInvalidChar(null);
        }
    }

    const handleResetPassword = async (e)=>{
        e.preventDefault();
        let loginEmail = document.getElementById('login-email').value;
        let newPassword = document.getElementById('new-password').value;
        let confirmPassword = document.getElementById('confirm-password').value;

        console.log(isBothPasswordSame, !isPasswordTooShort, !isPasswordContainsInvalidChar)
        if (isBothPasswordSame && !isPasswordTooShort && !isPasswordContainsInvalidChar){
            try{
                const requestChangePassword = firebase.functions().httpsCallable('requestChangePassword');
                setIsLoading(true);
                let result = await requestChangePassword({
                    'loginEmail': loginEmail,
                    'newPassword': newPassword
                });
                alert(`A confirmation email is sent to ${result.data.toEmail}, please click on the link provided to confirm your password reset. Please check the junk box if you cannot find the email.`);
            }catch(error){
                console.error("ERROR: "+error.message);
                alert("Your request has stopped because of the following error: "+error.message);
            }
            setIsLoading(false);
        }else{
            console.error("ERROR: New Password does not fulfill the requirements!");
            alert("New Password does not fulfill the requirements!");
        }
    }
    
    useEffect(()=>{
        const token = query.get('token');
        const loginEmail = query.get('loginEmail');
        if (token && loginEmail){
            const changePassword = firebase.functions().httpsCallable('changePassword');
            changePassword({
                'token': token,
                'loginEmail': loginEmail
            }).then((result)=>{
                setIsPasswordChanged(true);
                setAccountChanged({
                    'loginEmail': result.data.loginEmail,
                    'preferredName': result.data.preferredName,
                    'volunId': result.data.volunId
                });
                setIsLoading(false);
            }).catch((error)=>{
                setIsPasswordChanged(false);
                setError(error.message);
                setIsLoading(false);
            });
        }else setIsLoading(false);

    }, []);

    return (
        <>
        {isLoading && <Loading/>}
        <div className="reset-password">
            {isPasswordChanged === null && 
            <>
            <h1 className="main-text">HeartlineHK Reset Password</h1>
            <form className="reset-password-form" onSubmit={handleResetPassword}>
                <label htmlFor="login-email">Login Email:</label>
                <input type="email" name="login-email" id="login-email" required />
                <label htmlFor="new-password">New Password:</label>
                <input type="password" name="new-password" id="new-password" required onChange={checkPasswordValidity}/>
                <label htmlFor="confirm-password">Confirm New Password:</label>
                <input type="password" name="confirm-password" id="confirm-password" required onChange={checkPasswordValidity}/>
                <ul className="error-list">
                    {(isBothPasswordSame === false) && <li className="error-item">Both passwords entered are not the same!</li>}
                    {(isPasswordTooShort === true) && <li className="error-item">Password length cannot be less than 12!</li>}
                    {(isPasswordContainsInvalidChar === true) && <li className="error-item">Password cannot contain invalid charaters!</li>}
                </ul>
                <input type="submit" value="Reset" name="reset-password-submit" id="reset-password-submit" />
                <Link to="/" className="login-link">Know the Password? Login Here.</Link>
            </form>
            </>
            }
            {isPasswordChanged != null &&
            <>
            {accountChanged != null && <p className="result-text">Password for {accountChanged.preferredName} (Login Email: {accountChanged.loginEmail}) has changed successfully!</p>}
            {error != null && <p className="error-text">{error}</p>}
            </>
            }
        </div>
        </>
    );
}
export default ResetPassword;