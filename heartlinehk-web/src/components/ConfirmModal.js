import "../styles/ConfirmModal.css";

const ConfirmModal = (props)=>{

    return (
        <div id={(props.modalId?props.modalId:"default-modal")} className="modal-container">
            <form className="confirm-modal" onSubmit={props.formSubmitHandler}>
                <p className="confirm-text">{(props.confirmText?props.confirmText:"Changes might be lost if you leave now. Confirm?")}</p>
                <button type="submit" name="confirm-btn" className="confirm-btn" onClick={props.formSubmitHandler}>確定</button>
                <button type="submit" name="cancel-btn" className="cancel-btn" onClick={props.formSubmitHandler}>取消</button>
            </form>
        </div>
    );
}

export default ConfirmModal;