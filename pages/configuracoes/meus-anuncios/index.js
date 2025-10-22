import { useRouter } from "next/router";
import useUser from "/hooks/useUser";
import styles from "/styles/configuracoes/meus-anuncios.module.css";
import load from "styles/componentes/loading.module.css";
import { useEffect, useState } from "react";
import ListingCardEdit from "components/ListingCardEdit";
import Modal from "components/ModalPadrao";
import { FaPlus } from "react-icons/fa";

export default function MeusAnuncios() {
  const router = useRouter();
  const { user, isLoading: userLoading, isError: userError } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState(null);
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

  const handleDelete = async () => {
    if (!selectedListingId) return;

    try {
      const response = await fetch(`/api/v1/listings/${selectedListingId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Falha ao deletar anúncio");

      setListings(listings.filter((l) => l.id !== selectedListingId));
      setIsModalOpen(false);
      setSelectedListingId(null);
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
            ><FaPlus style={{ marginRight: "8px" }} />
              Criar anúncio
            </button>
          </div>
        ) : (
          <><div style={{ marginTop: "40px" }}>
            <button
              className={styles.createButton2}
              onClick={() => router.push("/item/criar")}
            >
              <FaPlus style={{ marginRight: "8px" }} />
              Criar anúncio
            </button>
          </div>
            <div className={styles.listingsGrid}>
              {listings.map((listing) => (
                <ListingCardEdit
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  price={listing.price}
                  condition={listing.listing_condition}
                  quantity={listing.quantity}
                  image={
                    listing.images && listing.images.length > 0
                      ? listing.images[0].image_url
                      : null
                  }
                  onEdit={() => router.push(`/item/editar/${listing.id}`)}
                  onDelete={() => {
                    setSelectedListingId(listing.id);
                    setIsModalOpen(true);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedListingId(null);
        }}
        onConfirm={handleDelete}
        title="Excluir anúncio"
        message="Tem certeza que deseja excluir este anúncio? Essa ação não poderá ser desfeita."
      />
    </div>
  );
}
