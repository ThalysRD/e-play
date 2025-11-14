import React from "react";
import { useCarrinho } from "hooks/useCarrinho";
import styles from "styles/carrinho/carrinho.module.css";
import { IoTrash, IoAdd, IoRemove } from "react-icons/io5";
import { useRouter } from "next/router";
import { useState } from "react";
import load from "styles/componentes/loading.module.css";

const CarrinhoPage = () => {
  const {
    itens,
    removerItem,
    atualizarQuantidade,
    calcularSubtotal,
    calcularFrete,
    calcularTotal,
    isLoading
  } = useCarrinho();

  const router = useRouter();

  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const formatarPreco = (preco) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(preco);
  };

  const handleFinalizarCompra = () => {
    router.push('/carrinho/checkout');
  };

  const handleAtualizarQuantidade = async (productId, novaQuantidade) => {
    if (novaQuantidade < 1) {
      return handleRemoverItem(productId);
    }
    if (updatingItemId) return;
    setUpdatingItemId(productId);
    try {
      await atualizarQuantidade(productId, novaQuantidade);
    } catch (err) {
      console.error("Falha ao atualizar quantidade:", err);
      alert("Não foi possível atualizar o item. Tente novamente.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoverItem = async (productId) => {
    if (updatingItemId) return;
    setUpdatingItemId(productId);
    setIsRemoving(true);
    try {
      await removerItem(productId);
    } catch (err) {
      console.error("Falha ao remover item:", err);
      alert("Não foi possível remover o item. Tente novamente.");
    } finally {
      setIsRemoving(false);
      setUpdatingItemId(null);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.carrinhoContainer}>
        <div className={load.loadingContainer}>
          <div className={load.spinner}></div>
        </div>
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className={styles.carrinhoContainer}>
        <div className={styles.carrinhoVazio}>
          <h2>Seu carrinho está vazio</h2>
          <p>Adicione seus jogos ao carrinho para continuar comprando!</p>
          <button
            className={styles.voltarCatalogo}
            onClick={() => router.push("/")}
          >
            Voltar ao Catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.carrinhoContainer}>
      <div className={styles.carrinhoHeader}>
        <header className={styles.header}>
          <h2>Meu carrinho</h2>
          <div className={styles.divider}></div>
        </header>
      </div>

      <div className={styles.carrinhoContent}>
        <div className={styles.carrinhoItens}>
          {itens.map((item) => {
            const isItemUpdating = updatingItemId === item.listing_id;

            return (
              <div key={item.listing_id} className={`${styles.itemCarrinho} ${isItemUpdating ? styles.itemUpdating : ''}`}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.nome} className={styles.itemImagem} onClick={() => router.push(`/item/${item.listing_id}`)} />
                ) : (
                  <div className={styles.noImage} onClick={() => router.push(`/item/${item.listing_id}`)}>🖼️</div>
                )}

                <div className={styles.itemDetalhes}>
                  <h3 className={styles.itemNome}>{item.title}</h3>
                  <p className={styles.itemPreco}>{formatarPreco(item.price_locked)}</p>
                </div>

                <div className={styles.itemControles}>
                  <div className={styles.quantidadeControle}>
                    <button
                      className={styles.quantidadeBtn}
                      onClick={() => handleAtualizarQuantidade(item.listing_id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || isItemUpdating}
                    >
                      <IoRemove />
                    </button>
                    <span className={styles.quantidadeValor}>{item.quantity}</span>
                    <button
                      className={styles.quantidadeBtn}
                      onClick={() => handleAtualizarQuantidade(item.listing_id, item.quantity + 1)}
                      disabled={isItemUpdating}
                    >
                      <IoAdd />
                    </button>
                  </div>

                  <button
                    className={styles.removerBtn}
                    onClick={() => handleRemoverItem(item.listing_id)}
                    disabled={isItemUpdating}
                    aria-busy={isItemUpdating && isRemoving}
                    title={isItemUpdating && isRemoving ? "Removendo..." : "Remover item do carrinho"}
                  >
                    {isItemUpdating && isRemoving ? "Removendo..." : (<><IoTrash /> Remover</>)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.resumoPedido}>
          <h2>Resumo do Pedido</h2>
          <div className={styles.freteInfo}>
            {calcularFrete() === 0
              ? "🎉 Frete Grátis!"
              : "Frete grátis acima de R$ 200,00"}
          </div>
          <div className={styles.resumoLinha}>
            <span>Subtotal:</span>
            <span>{formatarPreco(calcularSubtotal())}</span>
          </div>
          <div className={styles.resumoLinha}>
            <span>Frete:</span>
            <span>
              {calcularFrete() === 0
                ? "Grátis"
                : formatarPreco(calcularFrete())}
            </span>
          </div>
          <div className={styles.resumoTotal}>
            <span>Total:</span>
            <span>{formatarPreco(calcularTotal())}</span>
          </div>
          <button
            className={styles.finalizarBtn}
            onClick={handleFinalizarCompra}
          >
            Finalizar Compra
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarrinhoPage;