import React from "react";
import styles from "styles/carrinho/carrinho.module.css";


const CarrinhoPage = () => {
  return (
    <div className={styles.carrinhoBackground}>
      <header className={styles.header}>
        <h2>Carrinho</h2>
      </header>
      <main className={styles.body}>
        <div className={styles.optionsContainer}>
          <p>Meus itens aqui!</p>
        </div>
      </main>
    </div>
  );
};

export default CarrinhoPage;
