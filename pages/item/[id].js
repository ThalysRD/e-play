import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import load from "styles/componentes/loading.module.css";
import Link from "next/link";
import styles from "styles/item/detalhes.module.css";
import useUser from "hooks/useUser";
import SearchBar from "components/SearchBar";

import ImageGallery from "components/ImageGallery";

export default function ProductDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id]);

  async function fetchListing() {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/listings/${id}`);

      if (!response.ok) {
        throw new Error("Anúncio não encontrado");
      }

      const data = await response.json();
      setListing(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart() {
    alert("Funcionalidade de carrinho em desenvolvimento!");
  }

  function handleBuyNow() {
    alert("Funcionalidade de compra em desenvolvimento!");
  }

  function handleEdit() {
    router.push(`/item/${listing.id}/editar`);
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja deletar este anúncio?")) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/listings/${listing.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Falha ao deletar anúncio");
      }

      alert("Anúncio deletado com sucesso!");
      router.push("/configuracoes/meus-anuncios");
    } catch (err) {
      alert("Erro ao deletar anúncio: " + err.message);
    }
  }

  const isOwnListing = user && listing && user.id === listing.user_id;

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.container}>
          <header className={styles.header}>
            <SearchBar />
          </header>
          <div className={load.loadingContainer}>
            <div className={load.spinner}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.container}>
          <header className={styles.header}>
            <SearchBar />
          </header>
          <div className={styles.errorMessage}>
            {error || "Anúncio não encontrado"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>

        <header className={styles.header}>
          <SearchBar />
        </header>

        <div className={styles.productContainer}>
          <ImageGallery images={listing.images} title={listing.title} />

          {/* Informações do Produto */}
          <div className={styles.productInfo}>
            <h1 className={styles.title}>{listing.title}</h1>

            <div className={styles.price}>
              R$ {Number(listing.price).toFixed(2)}
            </div>

            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Condição</div>
                <div className={styles.detailValue}>{listing.condition}</div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Quantidade</div>
                <div className={styles.detailValue}>
                  {listing.quantity} disponível{listing.quantity > 1 ? "is" : ""}
                </div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Categoria</div>
                <div className={styles.detailValue}>
                  {listing.category_id === "1" && "PlayStation"}
                  {listing.category_id === "2" && "Xbox"}
                  {listing.category_id === "3" && "Nintendo"}
                  {listing.category_id === "4" && "PC"}
                  {listing.category_id === "5" && "Retro"}
                </div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Publicado em</div>
                <div className={styles.detailValue}>
                  {new Date(listing.created_at).toLocaleDateString("pt-BR")}
                </div>
              </div>
            </div>

            {listing.description && (
              <div className={styles.description}>
                <div className={styles.descriptionTitle}>Descrição</div>
                <p className={styles.descriptionText}>{listing.description}</p>
              </div>
            )}

            {listing.username && (
              <div className={styles.seller}>
                <div className={styles.sellerTitle}>Vendedor</div>
                <div className={styles.sellerName}>{listing.username}</div>
                {listing.email && (
                  <div className={styles.sellerEmail}>{listing.email}</div>
                )}
              </div>
            )}

            <div className={styles.actionButtons}>
              {isOwnListing ? (
                <>
                  <button
                    className={styles.editButton}
                    onClick={handleEdit}
                  >
                    ✏️ Editar Anúncio
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={handleDelete}
                  >
                    🗑️ Deletar Anúncio
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={styles.buyButton}
                    onClick={handleBuyNow}
                    disabled={listing.quantity === 0}
                  >
                    {listing.quantity === 0 ? "Esgotado" : "Comprar Agora"}
                  </button>
                  <button
                    className={styles.cartButton}
                    onClick={handleAddToCart}
                    disabled={listing.quantity === 0}
                  >
                    Adicionar ao Carrinho
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
