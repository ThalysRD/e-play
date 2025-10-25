import styles from "styles/componentes/ModalPadrao.module.css";

export default function ModalPadrao({
  isOpen,
  onClose,
  onConfirm,
  title = "",
  message = "",
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalBackground} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
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
