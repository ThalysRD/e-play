import React, { createContext, useContext, useState, useEffect } from "react";

const CarrinhoContext = createContext();

export const useCarrinho = () => {
  const context = useContext(CarrinhoContext);
  if (!context) {
    throw new Error("useCarrinho deve ser usado dentro de um CarrinhoProvider");
  }
  return context;
};

export const CarrinhoProvider = ({ children }) => {
  const [itens, setItens] = useState([]);

  useEffect(() => {
    const itensArmazenados = localStorage.getItem("carrinho");
    if (itensArmazenados) {
      try {
        setItens(JSON.parse(itensArmazenados));
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("carrinho", JSON.stringify(itens));
  }, [itens]);

  const adicionarItem = (produto) => {
    setItens((itensAtuais) => {
      const itemExistente = itensAtuais.find((item) => item.id === produto.id);

      if (itemExistente) {
        return itensAtuais.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item,
        );
      }

      return [...itensAtuais, { ...produto, quantidade: 1 }];
    });
  };

  const removerItem = (produtoId) => {
    setItens((itensAtuais) =>
      itensAtuais.filter((item) => item.id !== produtoId),
    );
  };

  const atualizarQuantidade = (produtoId, novaQuantidade) => {
    if (novaQuantidade < 1) {
      removerItem(produtoId);
      return;
    }

    setItens((itensAtuais) =>
      itensAtuais.map((item) =>
        item.id === produtoId ? { ...item, quantidade: novaQuantidade } : item,
      ),
    );
  };

  const limparCarrinho = () => {
    setItens([]);
  };

  const calcularSubtotal = () => {
    return itens.reduce(
      (total, item) => total + item.preco * item.quantidade,
      0,
    );
  };

  const calcularFrete = () => {
    const subtotal = calcularSubtotal();
    return subtotal >= 200 ? 0 : 15;
  };

  const calcularTotal = () => {
    return calcularSubtotal() + calcularFrete();
  };

  const quantidadeTotal = itens.reduce(
    (total, item) => total + item.quantidade,
    0,
  );

  return (
    <CarrinhoContext.Provider
      value={{
        itens,
        adicionarItem,
        removerItem,
        atualizarQuantidade,
        limparCarrinho,
        calcularSubtotal,
        calcularFrete,
        calcularTotal,
        quantidadeTotal,
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
};
