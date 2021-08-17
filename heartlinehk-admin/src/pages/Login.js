import "../styles/Login.css";

const Login = (props) =>{

    return (
        <div className="login">
            <h1 className="main-text">HeartlineHK Login</h1>
            <form className="login-form" onSubmit={props.handleLogin}>
                <label htmlFor="login-email">Email:</label>
                <input type="email" name="login-email" id="login-email" required />
                <label htmlFor="login-pwd">Password:</label>
                <input type="password" name="login-password" id="login-password" required />
                <input type="submit" value="Login" name="login-submit" id="login-submit" />
            </form>
        </div>
    );
}

export default Login;