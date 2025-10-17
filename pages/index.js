import { useEffect, useState } from "react";
import Link from "next/link";
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
        throw new Error("Erro ao carregar anúncios");
      }

      const data = await response.json();
      setListings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.catalogoBackground}>
      <header className={styles.header}>
        <SearchBar />
        <Link href="/item/criar" className={styles.createButton}>
          + Criar Anúncio
        </Link>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>Catálogo de Jogos</h1>

          {loading && (
            <div className={styles.loadingMessage}>Carregando anúncios...</div>
          )}

          {error && (
            <div className={styles.errorMessage}>{error}</div>
          )}

          {!loading && !error && listings.length === 0 && (
            <div className={styles.emptyMessage}>
              <p>Nenhum anúncio encontrado.</p>
              <Link href="/item/criar" className={styles.createLink}>
                Seja o primeiro a criar um anúncio!
              </Link>
            </div>
          )}

          {!loading && !error && listings.length > 0 && (
            <div className={styles.listingsGrid}>
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}