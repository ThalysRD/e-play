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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !user.id) {
      setItens([]);
      setIsLoading(false);
      return;
    }

    const fetchCart = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/v1/user/cart');
        if (!response.ok) {
          if (response.status === 404) {
            setItens([]);
            return;
          }
          throw new Error('Falha ao buscar o carrinho');
        }
        const cartData = await response.json();
        setItens(cartData.items || []);
      } catch (err) {
        console.error('Erro ao carregar carrinho:', err);
        setError(err.message);
        setItens([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCart();
  }, [user]);

  const adicionarItem = async (itemData) => {
    try {
      const response = await fetch('/api/v1/user/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      if (!response.ok) {
        throw new Error('Falha ao adicionar item');
      }
      const updatedCart = await response.json();
      setItens(updatedCart.items || []);
    } catch (err) {
      console.error("Erro em adicionarItem:", err);
      throw err;
    }
  };

  const removerItem = async (productId) => {
    try {
      const response = await fetch(`/api/v1/user/cart`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: productId }),
      });
      if (!response.ok) {
        throw new Error('Falha ao remover item');
      }
      setItens((itensAtuais) =>
        itensAtuais.filter((item) => item.listing_id !== productId),
      );
    } catch (err) {
      console.error("Erro em removerItem:", err);
      throw err;
    }
  };

  const atualizarQuantidade = async (productId, novaQuantidade) => {
    if (novaQuantidade < 1) {
      return removerItem(productId);
    }
    try {
      const response = await fetch(`/api/v1/user/cart`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: productId,
          quantity: novaQuantidade
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar quantidade');
      }
      setItens((itensAtuais) =>
        itensAtuais.map((item) =>
          item.listing_id === productId ? { ...item, quantity: novaQuantidade } : item,
        ),
      );
    } catch (err) {
      console.error("Erro em atualizarQuantidade:", err);
      throw err;
    }
  };

  const limparCarrinho = async () => {
    try {
      await fetch('/api/v1/user/cart', {
        method: 'DELETE',
      });
      setItens([]);
    } catch (err) {
      console.error("Erro em limparCarrinho:", err);
      throw err;
    }
  };

  const calcularSubtotal = () => {
    return itens.reduce(
      (total, item) => total + (Number(item.price_locked) * item.quantity),
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
    (total, item) => total + item.quantity,
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
        isLoading,
        error
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
};