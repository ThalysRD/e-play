import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import payment from "models/payment.js";
import order from "models/order.js";
import session from "models/session.js";
import user from "models/user.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  try {
    const sessionToken = request.cookies.session_id;
    if (!sessionToken) {
      return response.status(401).json({
        message: "Você precisa estar logado para pagar.",
      });
    }

    const userSession = await session.findOneValidByToken(sessionToken);
    const { orderId } = request.body;

    if (!orderId) {
      return response.status(400).json({
        message: "orderId é obrigatório.",
      });
    }

    // Buscar pedido
    const foundOrder = await order.findOneById(orderId);

    // Validar se o usuário é o comprador
    if (foundOrder.buyer_id !== userSession.user_id) {
      return response.status(403).json({
        message: "Você não tem permissão para pagar este pedido.",
      });
    }

    // Buscar dados do usuário
    const userData = await user.findOneById(userSession.user_id);

    // Criar preferência de pagamento no Mercado Pago
    const paymentPreference = await payment.createPayment(
      userSession.user_id,
      orderId,
      foundOrder.total_price,
      `Pedido ${orderId}`,
      userData.email
    );

    return response.status(200).json({
      preferenceId: paymentPreference.preferenceId,
      initPoint: paymentPreference.initPoint,
      sandboxInitPoint: paymentPreference.sandboxInitPoint,
      message: "Preferência de pagamento criada com sucesso",
    });
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}
