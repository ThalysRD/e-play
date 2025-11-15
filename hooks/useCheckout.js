import useSWRMutation from "swr/mutation";

async function sendCheckoutRequest(url, { arg }) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Erro ao finalizar compra");
  }

  return await response.json();
}

export default function useCheckout() {
  const { trigger, isMutating, data, error } = useSWRMutation(
    "/api/v1/checkout",
    sendCheckoutRequest
  );

  // Compra direta de um único item (botão "Comprar Agora")
  const checkout = async (listingId, quantity, totalPrice) => {
    try {
      const result = await trigger({
        listingId,
        quantity: Number(quantity),
        totalPrice: Number(totalPrice),
      });

      // Redirecionar para Mercado Pago
      if (result.payment.sandboxInitPoint) {
        window.location.href = result.payment.sandboxInitPoint;
      } else {
        window.location.href = result.payment.initPoint;
      }

      return result;
    } catch (err) {
      throw err;
    }
  };

  // Checkout do carrinho com múltiplos itens
  const checkoutCart = async (items, totalPrice) => {
    try {
      const result = await trigger({
        items: items.map(item => ({
          listingId: item.listing_id,
          quantity: Number(item.quantity),
          priceLocked: Number(item.price_locked),
        })),
        totalPrice: Number(totalPrice),
      });

      // Redirecionar para Mercado Pago
      if (result.payment.sandboxInitPoint) {
        window.location.href = result.payment.sandboxInitPoint;
      } else {
        window.location.href = result.payment.initPoint;
      }

      return result;
    } catch (err) {
      throw err;
    }
  };

  return {
    checkout,
    checkoutCart,
    isLoading: isMutating,
    error,
    data,
  };
}
