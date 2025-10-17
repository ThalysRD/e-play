import { useState } from "react";
import styles from "styles/item/detalhes.module.css";

export default function ImageGallery({ images, title }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={styles.imageGallery}>
        <div className={styles.mainImageContainer}>
          <div className={styles.noImage}>Sem imagem</div>
        </div>
      </div>
    );
  }

  const currentImage = images[selectedIndex];

  return (
    <div className={styles.imageGallery}>
      <div className={styles.mainImageContainer}>
        <img
          src={currentImage.image_url}
          alt={title}
          className={styles.mainImage}
        />
      </div>

      {images.length > 1 && (
        <div className={styles.thumbnails}>
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`${styles.thumbnail} ${index === selectedIndex ? styles.active : ""
                }`}
              onClick={() => setSelectedIndex(index)}
            >
              <img
                src={image.image_url}
                alt={`${title} - ${index + 1}`}
                className={styles.thumbnailImage}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
