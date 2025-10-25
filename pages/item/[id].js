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

export default function ProductDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { adicionarItem } = useCarrinho();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id]);

  useEffect(() => {
    if (router.isReady && router.query.refresh) {
      fetchListing();
    }
  }, [router.query.refresh]);

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
      console.error('[ProductDetails] Error fetching listing:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
        setToastMessage("Adicionado ao carrinho!"); // Limpa a mensagem
      }, 5000); // 5000ms = 5 segundos

      // Limpa o timer se o componente for desmontado
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  function handleAddToCart() {
    if (!listing) return;
    const itemParaAdicionar = {
      id: listing.id,
      nome: listing.title,
      preco: Number(listing.price),
      imagem: listing.images && listing.images.length > 0 ? listing.images[0] : null,
      estoque: listing.quantity
    };

    adicionarItem(itemParaAdicionar);
    setToastMessage(`"${listing.title}" foi adicionado ao carrinho!`);
    setShowToast(true);
  }

  function handleBuyNow() {
    /*router.push('/carrinho/finalizacao-compra');*/
    alert("Funcionalidade de compra em desenvolvimento!");
  }

  function handleEdit() {
    router.push(`/item/editar/${listing.id}`);
  }

  function openDeleteModal() {
    setIsModalOpen(true);
  }

  async function confirmDelete() {
    try {
      const response = await fetch(`/api/v1/listings/${listing.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Falha ao deletar anúncio");
      }

      router.push("/configuracoes/meus-anuncios");
    } catch (err) {
      alert("Erro ao deletar anúncio: " + err.message);
    } finally {
      setIsModalOpen(false);
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
                  {listing.quantity}{" "}
                  {listing.quantity === 1 ? "disponível" : "disponíveis"}
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
                    onClick={openDeleteModal}
                  >
                    🗑️ Deletar Anúncio
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={styles.cartButton}
                    onClick={handleAddToCart}
                    disabled={listing.quantity === 0}
                  >
                    Adicionar ao Carrinho
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

      {showToast && (
        <div className={styles.toastNotification}>
          ✅ {toastMessage}
        </div>
      )}
    </div>
  );
}
