import styles from "styles/componentes/ModalLogout.module.css"

export default function ModalLogout({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className={styles.modalBackground} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3>Sair do E-play</h3>
                <p>Você tem certeza que deseja sair da sua conta?</p>
                <div className={styles.modalActions}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        Cancelar
                    </button>
                    <button className={styles.confirmButton} onClick={onConfirm}>
                        Sair
                    </button>
                </div>
            </div>
        </div>
    );
}