import { useEffect, useState } from "react";
import load from "styles/componentes/loading.module.css";
import SearchBar from "components/SearchBar";
import ListingCard from "components/ListingCard";
import styles from "styles/catalogo/home.module.css";

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings() {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/listings");

      if (!response.ok) {
        throw new Error("Erro ao carregar anúncios :(");
      }

      const data = await response.json();
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.catalogoBackground}>
      <header className={styles.header}>
        <SearchBar />
      </header>

      <main className={styles.mainContent}>
        <div className={styles.container}>
          {loading && (
            <div className={load.loadingContainer}>
              <div className={load.spinner}></div>
            </div>
          )}

          {error && <div className={styles.errorMessage}>{error}</div>}

          {!loading && !error && listings.length === 0 && (
            <div className={styles.emptyMessage}>
              <p>Nenhum anúncio encontrado.</p>
            </div>
          )}

          {!loading && !error && listings.length > 0 && (
            <>
              {/*<section className={styles.featuredSection}>
                <h2 className={styles.sectionTitle}>Recomendados 🔥</h2>
                <div className={styles.listingsGrid}>
                  {listings.slice(0, 4).map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </section>

              <section className={styles.featuredSection}>
                <h2 className={styles.sectionTitle}>Mais Vendidos 🏆</h2>
                <div className={styles.listingsGrid}>
                  {listings.slice(4, 8).map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </section>

              <section className={styles.featuredSection}>
                <h2 className={styles.sectionTitle}>Promoções 💸</h2>
                <div className={styles.listingsGrid}>
                  {listings.slice(8, 12).map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </section>*/}

              <section className={styles.catalogSection}>
                <div className={styles.listingsGrid}>
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
