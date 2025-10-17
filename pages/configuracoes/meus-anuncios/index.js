import { useRouter } from "next/router";
import useUser from "/hooks/useUser";
import styles from "/styles/configuracoes/meus-anuncios.module.css";
import load from "styles/componentes/loading.module.css";
import { useEffect, useState } from "react";

export default function MeusAnuncios() {
  const router = useRouter();
  const { user, isLoading: userLoading, isError: userError } = useUser();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [userLoading, user, router]);

  useEffect(() => {
    if (user && user.id) {
      fetchUserListings();
    }
  }, [user]);

  const fetchUserListings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/listings");
      if (!response.ok) throw new Error("Falha ao carregar anúncios");

      const allListings = await response.json();
      const userListings = allListings.filter(
        (listing) => listing.user_id === user.id
      );
      setListings(userListings);
    } catch (err) {
      console.error("Erro ao carregar anúncios:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (listingId) => {
    if (!confirm("Tem certeza que deseja deletar este anúncio?")) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/listings/${listingId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Falha ao deletar anúncio");

      setListings(listings.filter((l) => l.id !== listingId));
    } catch (err) {
      console.error("Erro ao deletar anúncio:", err);
      alert("Erro ao deletar anúncio: " + err.message);
    }
  };

  if (userLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.mainContent}>
          <p className={styles.loadingMessage}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className={styles.container}>
        <div className={styles.mainContent}>
          <p className={styles.errorMessage}>
            Erro ao carregar página. Por favor, tente novamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContent}>
        <header className={styles.header}>
          <h2>Meus anúncios</h2>
          <div className={styles.divider} />
        </header>

        {loading ? (
          <div className={load.loadingContainer}>
            <div className={load.spinner}></div>
          </div>
        ) : error ? (
          <p className={styles.errorMessage}>
            Erro ao carregar anúncios: {error}
          </p>
        ) : listings.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <h2 className={styles.emptyTitle}>Nada por aqui ainda :(</h2>
            <p className={styles.emptyMessage}>
              Você ainda não tem nenhum anúncio publicado. Comece agora criando
              seu primeiro anúncio!
            </p>
            <button
              className={styles.createButton}
              onClick={() => router.push("/item/criar")}
            >
              Criar anúncio
            </button>
          </div>
        ) : (
          <>
            <div className={styles.listingsGrid}>
              {listings.map((listing) => (
                <div key={listing.id} className={styles.listingCard}>
                  <div className={styles.imageContainer}>
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0].image_url}
                        alt={listing.title}
                      />
                    ) : (
                      <span className={styles.noImage}>🖼️</span>
                    )}
                  </div>
                  <div className={styles.listingInfo}>
                    <h3 className={styles.listingTitle}>{listing.title}</h3>
                    <p className={styles.listingPrice}>
                      R$ {parseFloat(listing.price).toFixed(2)}
                    </p>
                    <div className={styles.listingDetails}>
                      <span className={styles.condition}>
                        {listing.listing_condition}
                      </span>
                      <span className={styles.quantity}>
                        Qtd: {listing.quantity}
                      </span>
                    </div>

                    <div className={styles.cardActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => router.push(`/item/${listing.id}/editar`)}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(listing.id)}
                      >
                        🗑️ Deletar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <button
                className={styles.createButton}
                onClick={() => router.push("/item/criar")}
              >
                ➕ Criar Novo Anúncio
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}