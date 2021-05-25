import '../styles/FlipCountdown.css';

const FlipCountdown = ({day, month, year}) =>{

    return (
        <div className="flip-countdown">
            <div className="day-countdown">
                <div className={"ten-day card" + (Math.floor(day/10) != 0? " rotating": "")}>
                    <div className="card-front">0</div>
                    <div className="card-back">{Math.floor(day/10)}</div>
                </div>
                <div className={"day card" + (day%10 != 0? " rotating": "")}>
                    <div className="card-front">0</div>
                    <div className="card-back">{day%10}</div>
                </div>
                <p>day</p>
            </div>
            <div className="month-countdown">
                <div className={"ten-month card" + (Math.floor(month/10) != 0? " rotating": "")}>
                    <div className="card-front">0</div>
                    <div className="card-back">{Math.floor(month/10)}</div>
                </div>
                <div className={"month card" + (month%10 != 0? " rotating": "")}>
                    <div className="card-front">0</div>
                    <div className="card-back">{month%10}</div>
                </div>
                <p>month</p>
            </div>
            <div className="year-countdown">
                <div className={"thousand-year card" + (Math.floor(year/1000) != 0? " rotating": "")}>
                    <div className="card-front">0</div>
                    <div className="card-back">{Math.floor(year/1000)}</div>
                </div>
                <div className={"hundred-year card" + (Math.floor((year/100)%10) != 0? " rotating": "")}>
                    <div className="card-front">0</div>
                    <div className="card-back">{Math.floor((year/100)%10)}</div>
                </div>
                <div className={"ten-year card" + (Math.floor((year/10)%10) != 0? " rotating": "")}>
                    <div className="card-front">0</div>
                    <div className="card-back">{Math.floor((year/10)%10)}</div>
                </div>
                <div className={"year card" + (year%10 != 0? " rotating": "")}>
                    <div className="card-front">0</div>
                    <div className="card-back">{year%10}</div>
                </div>
                <p>year</p>
            </div>
        </div>
    );
}

export default FlipCountdown;