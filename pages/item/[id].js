import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import load from "styles/componentes/loading.module.css";
import Link from "next/link";
import styles from "styles/item/detalhes.module.css";
import useUser from "hooks/useUser";
import SearchBar from "components/SearchBar";
import Modal from "components/ModalPadrao";
import ImageGallery from "components/ImageGallery";
import { useCarrinho } from "contexts/CarrinhoContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as faStarSolid } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";

export default function ProductDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { adicionarItem } = useCarrinho();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);

  const [toast, setToast] = useState({
    visible: false,
    type: "success",
    message: "",
  });

  function showSuccess(message) {
    setToast({ visible: true, type: "success", message });
  }

  function showError(message) {
    setToast({ visible: true, type: "error", message });
  }

  useEffect(() => {
    if (id) fetchListing();
  }, [id]);

  useEffect(() => {
    if (router.isReady && router.query.refresh) {
      fetchListing();
    }
  }, [router.isReady, router.query.refresh]);

  async function fetchListing() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/v1/listings/${id}`);
      if (!response.ok) {
        throw new Error("Anúncio não encontrado");
      }
      const data = await response.json();
      setListing(data);
    } catch (err) {
      console.error("[ProductDetails] Error fetching listing:", err);
      setError(err.message || "Falha ao carregar anúncio");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!toast.visible) return;
    const t = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 5000);
    return () => clearTimeout(t);
  }, [toast.visible]);

  async function handleAddToCart() {
    if (!listing || isAddingToCart) return;
    setIsAddingToCart(true);
    const imageUrl = listing.images && listing.images.length > 0 ? listing.images[0].image_url : null;
    console.log(listing.images[0])
    const itemParaAdicionar = {
      listing_id: listing.id,
      price_locked: Number(listing.price),
      quantity: 1,
      title: listing.title,
      image_url: imageUrl
    };
    try {
      await adicionarItem(itemParaAdicionar);
      showSuccess(`"${listing.title}" foi adicionado ao carrinho!`);

    } catch (err) {
      console.error("Erro ao adicionar ao carrinho:", err);
      showError("Falha ao adicionar o item. Tente novamente.");
    } finally {
      setIsAddingToCart(false);
    }
  }

  function handleBuyNow() {
    // router.push('/carrinho/finalizacao-compra');
    alert("Funcionalidade de compra em desenvolvimento!");
  }

  function handleEdit() {
    if (!listing) return;
    router.push(`/item/editar/${listing.id}`);
  }

  function openDeleteModal() {
    setIsModalOpen(true);
  }

  async function confirmDelete() {
    if (!listing) return;
    try {
      const response = await fetch(`/api/v1/listings/${listing.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Falha ao deletar anúncio");
      router.push("/configuracoes/meus-anuncios");
    } catch (err) {
      alert("Erro ao deletar anúncio: " + err.message);
    } finally {
      setIsModalOpen(false);
    }
  }

  useEffect(() => {
    if (user && listing) {
      setIsInWishlist(user.wish_list?.includes(listing.id) || false);
    }
  }, [user, listing]);

  async function handleToggleWishlist() {
    if (!user || !listing || isUpdatingWishlist) return;
    setIsUpdatingWishlist(true);
    const previousState = isInWishlist;
    setIsInWishlist(!previousState);

    try {
      const response = await fetch("/api/v1/user/wishlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      if (!response.ok) throw new Error("Falha ao atualizar a lista de desejos");

      showSuccess(!previousState ? "Adicionado aos favoritos!" : "Removido dos favoritos!");
    } catch (err) {
      console.error(err);
      setIsInWishlist(previousState);
      showError("Erro ao atualizar favoritos. Tente novamente.");
    } finally {
      setIsUpdatingWishlist(false);
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
            {isOwnListing ? null : (
              <button
                className={`${styles.fav} ${isInWishlist ? styles.isFavorited : ""}`}
                onClick={handleToggleWishlist}
                disabled={isUpdatingWishlist}
                aria-label={isInWishlist ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                title={isInWishlist ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                <FontAwesomeIcon icon={isInWishlist ? faStarSolid : faStarRegular} />
              </button>
            )}

            <div className={styles.row}>
              {listing.username && (
                <div className={styles.seller}>
                  <div>Visite a loja</div>
                  <Link href={`/vendedor/${listing.username}`} className={styles.sellerName}>
                    {listing.username}
                  </Link>
                </div>
              )}
              <h1 className={styles.title}>{listing.title}</h1>
            </div>

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
                  {listing.quantity} {listing.quantity === 1 ? "disponível" : "disponíveis"}
                </div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>Categoria</div>
                <div className={styles.detailValue}>
                  {listing.category_id === 1 && "PlayStation"}
                  {listing.category_id === 2 && "Xbox"}
                  {listing.category_id === 3 && "Nintendo"}
                  {listing.category_id === 4 && "PC"}
                  {listing.category_id === 5 && "Retro"}
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

            <div className={styles.actionButtons}>
              {isOwnListing ? (
                <>
                  <button className={styles.editButton} onClick={handleEdit}>
                    ✏️ Editar Anúncio
                  </button>
                  <button className={styles.deleteButton} onClick={openDeleteModal}>
                    🗑️ Deletar Anúncio
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={styles.cartButton}
                    onClick={handleAddToCart}
                    disabled={listing.quantity === 0 || isAddingToCart}
                  >
                    {isAddingToCart ? "Adicionando..." : "Adicionar ao Carrinho"}
                  </button>
                  <button
                    className={styles.buyButton}
                    onClick={handleBuyNow}
                    disabled={listing.quantity === 0}
                  >
                    {listing.quantity === 0 ? "Esgotado" : "Comprar Agora"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir anúncio"
        message="Tem certeza que deseja excluir este anúncio? Essa ação não poderá ser desfeita."
      />

      {toast.visible && (
        <div
          className={
            toast.type === "success"
              ? styles.toastNotificationSuccess
              : styles.toastNotificationError
          }
          role="status"
          aria-live="polite"
        >
          {toast.type === "success" ? "✅ " : "❌ "}
          {toast.message}
        </div>
      )}
    </div>
  );
}
