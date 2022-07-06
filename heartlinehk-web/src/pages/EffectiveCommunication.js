import { Children } from "react";
import b500x500 from '../img/Pages/9 如何構建有效的對話/b_500x500.png';
import "../styles/EffectiveCommunication.css";

const TableCell = ({children})=>{
    return (
        <td>
            <ul style={{margin: "0"}}>
                {Children.map(children, (child, idx)=><li key={`cell-line-${idx}`}>{child}</li>)}
            </ul>
        </td>
    );
}

const EffectiveCommunication = ()=>{
    return (
        <div className="effective-communication">
            <div className="main-text">
                <h1>如何構建有效的對話</h1>
                <p>儘管單靠一段短短的對話可能未能完全處理你當下的難題或情緒，但我們仍期望你能有效利用HeartlineHK對話平台，
                    在一個安全和舒適的環境，和我們的義工建立互信關係，細細傾訴你的心事。
                    <br/>以下是一些溫馨小提示，令對話能更順暢和有效地進行：
                </p>
            </div>
            <div className="table-container" style={{position: "relative", margin: "5rem auto 0 auto", width: "80%", maxWidth: "960px"}}>
                <table className="compare-table">
                    <caption>使用服務態度的重要性</caption>
                    <tr style={{border: "0"}}>
                        <th style={{backgroundColor: "rgba(227, 126, 64, 0.4)"}}>良好的態度 (adaptive)</th>
                        <th style={{backgroundColor: "rgba(104, 122, 97, 0.4)"}}>不良的態度 (maladaptive)</th>
                    </tr>
                    <tr>
                        <TableCell>
                            <>願意與義工<span style={{color: "#E37E40"}}>全面地探討</span>自身情況及情緒</>
                        </TableCell>
                        <TableCell>
                            <>把全部問題歸咎他人，<span style={{color: "#687A61"}}>不願探討</span>自己對事情的看法及情緒</>
                            <>旨意義工會提供所有問題的解決方法</>
                        </TableCell>
                    </tr>
                    <tr>
                        <TableCell>
                            <>相信透過對話能夠<span style={{color: "#E37E40"}}>梳理事情及當下情緒</span></>
                        </TableCell>
                        <TableCell>
                            <><span style={{color: "#687A61"}}>只旨在發洩情緒</span>，無意梳理事情及當下情緒</>
                        </TableCell>
                    </tr>
                    <tr>
                        <TableCell>
                            <><span style={{color: "#E37E40"}}>尊重義工</span>，有禮貌地對談。</>
                        </TableCell>
                        <TableCell>
                            <>不尊重義工的基本權利，有意地<span style={{color: "#687A61"}}>踐踏對方底線</span>。</>
                        </TableCell>
                    </tr>
                    <tr  style={{border: "0"}}>
                        <TableCell>
                            <>理解到義工不可能完全體會到自己當下的情緒，所以<span style={{color: "#E37E40"}}>分享更多</span>自身的情況及情緒，以達成共識。</>
                        </TableCell>
                        <TableCell>
                            <>認為義工沒可能完全體會自己當下的情況，<span style={{color: "#687A61"}}>放棄繼續解釋</span>自身的情況及情緒。</>
                        </TableCell>
                    </tr>
                    <tr  style={{border: "0"}}>
                        <th colSpan={2} style={{backgroundColor: "rgba(153, 209, 196, 0.4)"}}>結果</th>
                    </tr>
                    <tr>
                        <TableCell>
                            <><span style={{color: "#E37E40"}}>感到被聆聽</span></>
                        </TableCell>
                        <TableCell>
                            <><span style={{color: "#687A61"}}>不感到被聆聽</span></>
                        </TableCell>  
                    </tr>
                    <tr>
                        <TableCell>
                            <>情緒<span style={{color: "#E37E40"}}>得以梳理</span>，更<span style={{color: "#E37E40"}}>相信自己</span>能夠處理好現況。</>
                        </TableCell>
                        <TableCell>
                            <><span style={{color: "#687A61"}}>情緒惡化</span>，更難看到情況好轉的希望。</>
                        </TableCell> 
                    </tr>
                    <tr>
                        <TableCell>
                            <>與義工建立互信關係，對話更順暢</>
                        </TableCell>
                        <TableCell>
                            <>義工情緒透支，<span style={{color: "#687A61"}}>不能繼續對話</span>。</>
                        </TableCell>  
                    </tr>
                </table>
            </div>
            
            <div className="suggestions-container">
                <h2>四個小舉動，促成有效對話：</h2>
                <img src={b500x500}/>
                <ul>
                    <li><span style={{color: "#E37E40"}}>投入</span>對話過程，對新想法與角度持開放態度</li>
                    <li>避免過短的回應，<span style={{color: "#E37E40"}}>盡量分享</span>自己當下的處境與情緒</li>
                    <li>若有不想談及的話題或字眼，可直接<span style={{color: "#E37E40"}}>清晰</span>地向義工<span style={{color: "#E37E40"}}>表達</span></li>
                    <li>保持有禮，<span style={{color: "#E37E40"}}>尊重義工</span>的情緒及權利</li>
                </ul>
            </div>
        </div>
    );
}

export default EffectiveCommunication;