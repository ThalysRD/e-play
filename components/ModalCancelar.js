import styles from "styles/componentes/ModalLogoutCancel.module.css"

export default function ModalCancelar({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className={styles.modalBackground} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3>Cancelar</h3>
                <p>Você tem certeza que deseja descartar as alterações? Seu progresso será perdido.</p>
                <div className={styles.modalActions}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        Não
                    </button>
                    <button className={styles.confirmButton} onClick={onConfirm}>
                        Sim
                    </button>
                </div>
            </div>
        </div>
    );
}