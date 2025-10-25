import { useRouter } from "next/router";
import styles from "styles/componentes/ListingCard.module.css";

export default function ListingCard({ listing }) {
  const router = useRouter();

  function handleClick() {
    router.push(`/item/${listing.id}`);
  }

  const firstImage = listing.images?.[0];
  const quantityText =
    listing.quantity > 1 ? `${listing.quantity} disponíveis` : "1 disponível";

  return (
    <div className={styles.listingCard} onClick={handleClick}>
      <div className={styles.imageContainer}>
        {firstImage ? (
          <img
            src={firstImage.image_url}
            alt={listing.title}
            className={styles.listingImage}
          />
        ) : (
          <div className={styles.noImage}>🖼️</div>
        )}
      </div>

      <div className={styles.listingInfo}>
        <h3 className={styles.listingTitle}>{listing.title}</h3>

        <div className={styles.listingDetails}>
          <span className={styles.condition}>{listing.condition}</span>
          <span className={styles.quantity}>{quantityText}</span>
        </div>
        {listing.username && (
          <p className={styles.seller}>Vendedor: {listing.username}</p>
        )}
        <p className={styles.listingPrice}>
          R$ {Number(listing.price).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
