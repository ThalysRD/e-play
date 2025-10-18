import styles from "/styles/componentes/ListingCardEdit.module.css";

export default function ListingCardEdit({
  id,
  title,
  price,
  condition,
  quantity,
  image,
  onEdit,
  onDelete,
}) {
  return (
    <div className={styles.listingCard}>
      <div className={styles.imageContainer}>
        {image ? (
          <img src={image} alt={title} />
        ) : (
          <span className={styles.noImage}>🖼️</span>
        )}
      </div>

      <div className={styles.listingInfo}>
        <h3 className={styles.listingTitle}>{title}</h3>

        <p className={styles.listingPrice}>R$ {parseFloat(price).toFixed(2)}</p>

        <div className={styles.listingDetails}>
          <span className={styles.condition}>{condition}</span>
          <span className={styles.quantity}>Qtd: {quantity}</span>
        </div>

        <div className={styles.cardActions}>
          <button className={styles.editButton} onClick={onEdit}>
            ✏️ Editar
          </button>
          <button className={styles.deleteButton} onClick={onDelete}>
            🗑️ Deletar
          </button>
        </div>
      </div>
    </div>
  );
}
