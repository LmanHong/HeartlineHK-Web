import "../styles/Dashboard.css";

const Dashboard = () =>{
    return(
        <div className="dashboard">
            <h1 className="welcome-text">Welcome back, Lman Hong</h1>
            <div className="boxes-container">
                <div className="current-shift box">
                    <p className="main-text">Current Shift</p>
                    <p className="time">1900 - 0100</p>
                    <p className="date">18/09/2021</p>
                </div>
                <div className="next-shift box"></div>
                <div className="chats-per-shift box"></div>
                <div className="time-distribution box"></div>
            </div>
        </div>
    );
}

export default Dashboard;