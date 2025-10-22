import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "styles/catalogo/catalogo.module.css";
import SearchBar from "components/SearchBar";
import load from "styles/componentes/loading.module.css";
import ListingCard from "components/ListingCard";

export default function CatalogoPage() {
  const router = useRouter();
  const q = typeof router.query?.query === "string" ? router.query.query : "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchResults() {
      if (!q) {
        setResults([]);
        setErr("");
        return;
      }
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`/api/v1/listings/search/${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("Sem resultados para a pesquisa.");
        const data = await res.json();
        if (!cancelled) setResults(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          setResults([]);
          setErr(e.message || "Erro ao buscar.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchResults();
    return () => {
      cancelled = true;
    };
  }, [q]);

  return (
    <div className={styles.catalogoBackground}>
      <header className={styles.header}>
        <SearchBar />
      </header>

      <main className={styles.mainContent}>
        <div className={styles.container}>

          {q && loading && <div className={load.loadingContainer}>
            <div className={load.spinner}></div>
          </div>}

          {q && !loading && !err && results.length === 0 && (
            <p className={styles.notFound}>Nenhum resultado para “{q}”.</p>
          )}

          {q && !loading && !err && results.length > 0 && (
            <div>
              <section className={styles.resultsSection}>
                <h3 className={styles.sectionTitle}>Resultados para “{q}” ({results.length}):</h3>
                <div className={styles.listingsGrid}>
                  {results.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
