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

  return {
    checkout,
    isLoading: isMutating,
    error,
    data,
  };
}
