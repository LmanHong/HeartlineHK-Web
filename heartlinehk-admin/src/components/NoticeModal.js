import "../styles/NoticeModal.css";

const NoticeModal = (props)=>{

    return (
        <div id={(props.modalId?props.modalId:"default-modal")} className="modal-container">
            <form className="notice-modal">
                <p className="notice-text">{(props.noticeText?props.noticeText:"Default Text for Notice Modal.")}</p>
                <button type="submit" name="confirm-btn" className="confirm-btn" onClick={props.formSubmitHandler}>確定</button>
            </form>
        </div>
    );
}

export default NoticeModal;