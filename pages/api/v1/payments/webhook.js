import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import payment from "models/payment.js";
import order from "models/order.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  try {
    const { type, data } = request.body;

    // Webhook do Mercado Pago para notificações de pagamento
    if (type === "payment") {
      const paymentId = data.id;

      // Aqui você buscaria os detalhes do pagamento na API do Mercado Pago
      // Por enquanto, vamos apenas confirmar que recebemos a notificação
      console.log(`Notificação de pagamento recebida: ${paymentId}`);

      return response.status(200).json({
        message: "Webhook recebido com sucesso",
      });
    }

    return response.status(400).json({
      message: "Tipo de notificação não suportado",
    });
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}
