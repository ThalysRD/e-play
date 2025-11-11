import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import order from "models/order.js";
import session from "models/session.js";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  try {
    const sessionToken = request.cookies.session_id;
    if (!sessionToken) {
      return response.status(401).json({
        message: "Você precisa estar logado para visualizar pedidos.",
      });
    }

    const userSession = await session.findOneValidByToken(sessionToken);
    const orders = await order.findAllByBuyerId(userSession.user_id);

    return response.status(200).json(orders);
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}

async function postHandler(request, response) {
  try {
    const sessionToken = request.cookies.session_id;
    if (!sessionToken) {
      return response.status(401).json({
        message: "Você precisa estar logado para criar um pedido.",
      });
    }

    const userSession = await session.findOneValidByToken(sessionToken);
    const { listingId, quantity, totalPrice } = request.body;

    if (!listingId || !quantity || !totalPrice) {
      return response.status(400).json({
        message: "listingId, quantity e totalPrice são obrigatórios.",
      });
    }

    const newOrder = await order.create(
      userSession.user_id,
      listingId,
      Number(quantity),
      Number(totalPrice)
    );

    return response.status(201).json({
      ...newOrder,
      message: "Pedido criado com sucesso",
    });
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}
