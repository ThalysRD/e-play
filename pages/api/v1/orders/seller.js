import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import order from "models/order.js";
import session from "models/session.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  try {
    const sessionToken = request.cookies.session_id;
    if (!sessionToken) {
      return response.status(401).json({
        message: "Você precisa estar logado.",
      });
    }

    const userSession = await session.findOneValidByToken(sessionToken);
    
    // Buscar pedidos dos itens do vendedor
    const sellerOrders = await order.findAllBySellerListings(userSession.user_id);

    return response.status(200).json(sellerOrders);
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}
