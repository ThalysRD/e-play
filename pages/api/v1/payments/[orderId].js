import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import payment from "models/payment.js";
import session from "models/session.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  try {
    const { orderId } = request.query;

    if (!orderId) {
      return response.status(400).json({
        message: "orderId é obrigatório.",
      });
    }

    const sessionToken = request.cookies.session_id;
    if (!sessionToken) {
      return response.status(401).json({
        message: "Você precisa estar logado.",
      });
    }

    const userSession = await session.findOneValidByToken(sessionToken);

    // Buscar pagamento
    const foundPayment = await payment.getPaymentByOrderId(orderId);

    // Validar se o usuário é o comprador
    if (foundPayment.buyer_id !== userSession.user_id) {
      return response.status(403).json({
        message: "Você não tem permissão para acessar este pagamento.",
      });
    }

    return response.status(200).json(foundPayment);
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}
