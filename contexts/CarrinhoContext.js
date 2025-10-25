import React, { createContext, useContext, useState, useEffect } from 'react';
import useUser from '../hooks/useUser';

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
  const { user } = useUser();

  useEffect(() => {
    if (localStorage.getItem('carrinho')) {
      localStorage.removeItem('carrinho');
    }

    if (!user || !user.id) {
      setItens([]);
      return;
    }

    const cartKey = `carrinho_${user.id}`;

    const itensArmazenados = localStorage.getItem(cartKey);

    if (itensArmazenados) {
      try {
        setItens(JSON.parse(itensArmazenados));
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        setItens([]);
      }
    } else {
      setItens([]);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.id) {
      const cartKey = `carrinho_${user.id}`;

      if (itens.length > 0) {
        localStorage.setItem(cartKey, JSON.stringify(itens));
      } else {
        localStorage.removeItem(cartKey);
      }
    }

  }, [itens, user]);

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
