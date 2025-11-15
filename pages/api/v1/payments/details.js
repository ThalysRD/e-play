import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import payment from "models/payment.js";
import session from "models/session.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  try {
    const sessionToken = request.cookies.session_id;
    if (!sessionToken) {
      return response.status(401).json({
        message: "Você precisa estar logado para ver os detalhes do pagamento.",
      });
    }

    const userSession = await session.findOneValidByToken(sessionToken);
    const { preferenceId } = request.query;

    if (!preferenceId) {
      return response.status(400).json({
        message: "preferenceId é obrigatório.",
      });
    }

    const paymentDetails = await payment.getPaymentWithDetails(preferenceId);

    // Verificar se o pagamento pertence ao usuário logado
    if (paymentDetails.buyer_id !== userSession.user_id) {
      return response.status(403).json({
        message: "Você não tem permissão para ver este pagamento.",
      });
    }

    return response.status(200).json(paymentDetails);
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}
