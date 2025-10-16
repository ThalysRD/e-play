import SearchBar from "components/SearchBar";
import styles from "styles/catalogo/home.module.css";

export default function HomePage() {
  return (
    <div className={styles.catalogoBackground}>
      <header className={styles.header}>
        <SearchBar />
      </header>

      <main className={styles.body}>
        <div className={styles.homeContainer}>

          <div className={styles.recomendados}>
            <p>Recomendados 🔥</p>
            <div className={styles.cardsRow}>
              <div className={styles.card}></div>
              <div className={styles.card}></div>
            </div>
          </div>

          <div className={styles.recomendados}>
            <p>Mais Vendidos 🏆</p>
            <div className={styles.cardsRow}>
              <div className={styles.card}></div>
              <div className={styles.card}></div>
            </div>
          </div>

          <div className={styles.recomendados}>
            <p>Promoções 💸</p>
            <div className={styles.cardsRow}>
              <div className={styles.card}></div>
              <div className={styles.card}></div>
            </div>
          </div>

        </div>
      </main>
    </div >
  );
}