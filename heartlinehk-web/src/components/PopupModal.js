import { useRef } from "react";
import "../styles/PopupModal.css";

const PopupModal = (props)=>{

    const modalContainerDiv = useRef();

    const closeModal = ()=>{
        modalContainerDiv.current.classList.remove("opened");
    }

    return (
        <div ref={modalContainerDiv} id={(props.modalId?props.modalId:"default-modal")} className="modal-container">
            <div className="popup-modal">
                <button type="button" name="close-btn" className="close-btn" onClick={closeModal}><span className="material-icons">close</span></button>
                <iframe src={props.iframeSrc}></iframe>
            </div>
        </div>
    );
}

export default PopupModal;