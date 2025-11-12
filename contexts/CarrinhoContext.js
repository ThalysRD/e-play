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

const LOCAL_CART_KEY = 'carrinho_local';

export const CarrinhoProvider = ({ children }) => {
  const [itens, setItens] = useState([]);
  const { user, isLoading: isUserLoading } = useUser();
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isUserLoading) {
      setIsCartLoading(true);
      return;
    }

    if (user && user.id) {
      const fetchCart = async () => {
        try {
          localStorage.removeItem(LOCAL_CART_KEY);
          setIsCartLoading(true);
          setError(null);
          const response = await fetch('/api/v1/user/cart');
          if (!response.ok) {
            if (response.status === 404) {
              setItens([]);
              return;
            }
            throw new Error('Falha ao buscar o carrinho da API');
          }
          const cartData = await response.json();
          setItens(cartData.items || []);
          localStorage.removeItem(LOCAL_CART_KEY);
        } catch (err) {
          console.error('Erro ao carregar carrinho da API:', err);
          setError(err.message);
          setItens([]);
        } finally {
          setIsCartLoading(false);
        }
      };
      fetchCart();

    } else {
      try {
        setIsCartLoading(true);
        const itensArmazenados = localStorage.getItem(LOCAL_CART_KEY);
        if (itensArmazenados) {
          setItens(JSON.parse(itensArmazenados));
        } else {
          setItens([]);
        }
      } catch (err) {
        console.error('Erro ao carregar carrinho local:', err);
        setError('Falha ao carregar o carrinho local.');
        setItens([]);
      } finally {
        setIsCartLoading(false);
      }
    }
  }, [user, isUserLoading]);


  useEffect(() => {
    if (user || isUserLoading) return;
    try {
      if (itens.length > 0) {
        localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(itens));
      } else {
        localStorage.removeItem(LOCAL_CART_KEY);
      }
    } catch (error) {
      console.error("Erro ao salvar carrinho local:", error);
    }
  }, [itens, user, isUserLoading]);


  const adicionarItem = async (produto) => {
    if (user && user.id) {
      const itemData = { listingId: produto.listing_id, quantity: 1 };
      try {
        const response = await fetch('/api/v1/user/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData),
        });
        if (!response.ok) throw new Error('Falha ao adicionar item na API');
        const updatedCart = await response.json();
        setItens(updatedCart.items || []);
      } catch (err) {
        console.error("Erro em adicionarItem (API):", err);
        setError(err.message);
        throw err;
      }

    } else {
      setItens((itensAtuais) => {
        const itemExistente = itensAtuais.find(
          (item) => item.listing_id === produto.listing_id
        );
        if (itemExistente) {
          return itensAtuais.map((item) =>
            item.listing_id === produto.listing_id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [...itensAtuais, { ...produto, quantity: 1 }];
      });
      return Promise.resolve();
    }
  };

  const removerItem = async (productId) => {
    if (user && user.id) {
      try {
        const response = await fetch(`/api/v1/user/cart`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId: productId }),
        });
        if (!response.ok) throw new Error('Falha ao remover item da API');
        const updatedCart = await response.json();
        setItens(updatedCart.items || []);
      } catch (err) {
        console.error("Erro em removerItem (API):", err);
        setError(err.message);
        throw err;
      }

    } else {
      setItens((itensAtuais) =>
        itensAtuais.filter((item) => item.listing_id !== productId)
      );
      return Promise.resolve();
    }
  };

  const atualizarQuantidade = async (productId, novaQuantidade) => {
    if (novaQuantidade < 1) return removerItem(productId);

    if (user && user.id) {
      try {
        const response = await fetch(`/api/v1/user/cart`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId: productId,
            quantity: novaQuantidade
          }),
        });
        if (!response.ok) throw new Error('Falha ao atualizar quantidade na API');
        const updatedCart = await response.json();
        setItens(updatedCart.items || []);
      } catch (err) {
        console.error("Erro em atualizarQuantidade (API):", err);
        setError(err.message);
        throw err;
      }

    } else {
      setItens((itensAtuais) =>
        itensAtuais.map((item) =>
          item.listing_id === productId ? { ...item, quantity: novaQuantidade } : item
        )
      );
      return Promise.resolve();
    }
  };

  const limparCarrinho = async () => {
    if (user && user.id) {
      try {
        await fetch('/api/v1/user/cart', {
          method: 'DELETE',
        });
        setItens([]);
      } catch (err) {
        console.error("Erro em limparCarrinho (API):", err);
        setError(err.message);
        throw err;
      }
    } else {
      setItens([]);
      return Promise.resolve();
    }
  };

  const calcularSubtotal = () => {
    return itens.reduce(
      (total, item) => total + (Number(item.price_locked) * item.quantity),
      0
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
    0
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
        isLoading: isUserLoading || isCartLoading,
        error
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
};