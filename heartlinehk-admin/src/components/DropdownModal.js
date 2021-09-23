import { useEffect, useState } from "react";
import "../styles/DropdownModal.css";

const DropdownModal = (props)=>{

    const [dropdownOptions, setDropdownOptions] = useState([]);

    useEffect(()=>{
        setDropdownOptions(props.dropdownOptions);
    }, [props.dropdownOptions]);

    return (
        <div id={(props.modalId?props.modalId:"default-modal")} className="modal-container">
            <form className="dropdown-modal">
                <p className="description-text">{(props.descriptionText?props.descriptionText:"Choose from the list below.")}</p>
                <select id={(props.dropdownId?props.dropdownId:"default-dropdown-list")} name="dropdown-list" className="dropdown-list">
                    {dropdownOptions.map((val, idx)=>{
                        return <option key={idx} value={(val['value']?val['value']:val)} className="dropdown-option">{(val['display']?val['display']:val)}</option>
                    })}
                </select>
                <button type="submit" name="confirm-btn" className="confirm-btn" onClick={props.formSubmitHandler}>確定</button>
                <button type="submit" name="cancel-btn" className="cancel-btn" onClick={props.formSubmitHandler}>取消</button>
            </form>
        </div>
    );
}

export default DropdownModal;