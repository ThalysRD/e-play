import React from "react";
import { useCarrinho } from "contexts/CarrinhoContext";
import styles from "styles/carrinho/carrinho.module.css";
import { IoTrash, IoAdd, IoRemove } from "react-icons/io5";
import { useRouter } from "next/router";

const CarrinhoPage = () => {
  const {
    itens,
    removerItem,
    atualizarQuantidade,
    calcularSubtotal,
    calcularFrete,
    calcularTotal,
  } = useCarrinho();

  const router = useRouter();

  const formatarPreco = (preco) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(preco);
  };

  const handleFinalizarCompra = () => {
    /*router.push('/carrinho/finalizacao-compra');*/
    alert("Funcionalidade de compra em desenvolvimento!");
  };

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
            const firstImage = item.imagem?.[0];

            return (
              <div key={item.id} className={styles.itemCarrinho}>
                {firstImage ? (
                  <img
                    src={firstImage.image_url}
                    alt={item.nome}
                    className={styles.itemImagem}
                  />
                ) : (
                  <div className={styles.noImage}>🖼️</div>
                )}

                <div className={styles.itemDetalhes}>
                  <h3 className={styles.itemNome}>{item.nome}</h3>
                  <p className={styles.itemPreco}>{formatarPreco(item.preco)}</p>
                </div>

                <div className={styles.itemControles}>
                  <div className={styles.quantidadeControle}>
                    <button
                      className={styles.quantidadeBtn}
                      onClick={() => atualizarQuantidade(item.id, item.quantidade - 1)}
                      disabled={item.quantidade <= 1}
                    >
                      <IoRemove />
                    </button>
                    <span className={styles.quantidadeValor}>{item.quantidade}</span>
                    <button
                      className={styles.quantidadeBtn}
                      onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)}
                    >
                      <IoAdd />
                    </button>
                  </div>

                  <button
                    className={styles.removerBtn}
                    onClick={() => removerItem(item.id)}
                  >
                    <IoTrash />
                    Remover
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
