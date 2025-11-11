import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import order from "models/order.js";
import payment from "models/payment.js";
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
        message: "Você precisa estar logado para finalizar a compra.",
      });
    }

    const userSession = await session.findOneValidByToken(sessionToken);
    const { listingId, quantity, totalPrice } = request.body;

    if (!listingId || !quantity || !totalPrice) {
      return response.status(400).json({
        message: "listingId, quantity e totalPrice são obrigatórios.",
      });
    }

    console.log("Iniciando checkout para:", {
      userId: userSession.user_id,
      listingId,
      quantity,
      totalPrice,
    });

    // Criar pedido
    const newOrder = await order.create(
      userSession.user_id,
      listingId,
      Number(quantity),
      Number(totalPrice)
    );

    console.log("Pedido criado:", newOrder.id);

    // Buscar dados do usuário para o pagamento
    const userData = await user.findOneById(userSession.user_id);

    console.log("Criando preferência de pagamento para email:", userData.email);

    // Criar preferência de pagamento no Mercado Pago
    const paymentPreference = await payment.createPayment(
      userSession.user_id,
      newOrder.id,
      totalPrice,
      `Pedido ${newOrder.id}`,
      userData.email
    );

    console.log("Preferência de pagamento criada:", paymentPreference.preferenceId);

    return response.status(201).json({
      order: newOrder,
      payment: {
        preferenceId: paymentPreference.preferenceId,
        initPoint: paymentPreference.initPoint,
        sandboxInitPoint: paymentPreference.sandboxInitPoint,
      },
      message: "Compra finalizada, redirecionando para pagamento...",
    });
  } catch (error) {
    console.error("Erro no checkout:", error);
    return controller.errorHandlers.onError(error, request, response);
  }
}
