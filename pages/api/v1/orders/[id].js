import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import order from "models/order.js";
import session from "models/session.js";

const router = createRouter();

router.get(getHandler);
router.patch(patchHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  try {
    const { id } = request.query;

    const sessionToken = request.cookies.session_id;
    if (!sessionToken) {
      return response.status(401).json({
        message: "Você precisa estar logado.",
      });
    }

    const userSession = await session.findOneValidByToken(sessionToken);
    const foundOrder = await order.findOneById(id);

    // Validar se o usuário é o comprador ou o vendedor do item
    if (foundOrder.buyer_id !== userSession.user_id) {
      return response.status(403).json({
        message: "Você não tem permissão para acessar este pedido.",
      });
    }

    return response.status(200).json(foundOrder);
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}

async function patchHandler(request, response) {
  try {
    const { id } = request.query;
    const { status } = request.body;

    if (!status) {
      return response.status(400).json({
        message: "Status é obrigatório.",
      });
    }

    const sessionToken = request.cookies.session_id;
    if (!sessionToken) {
      return response.status(401).json({
        message: "Você precisa estar logado.",
      });
    }

    const userSession = await session.findOneValidByToken(sessionToken);
    const foundOrder = await order.findOneById(id);

    // Apenas o comprador pode atualizar o status do pedido
    if (foundOrder.buyer_id !== userSession.user_id) {
      return response.status(403).json({
        message: "Você não tem permissão para atualizar este pedido.",
      });
    }

    const updatedOrder = await order.updateStatus(id, status);

    return response.status(200).json({
      ...updatedOrder,
      message: "Pedido atualizado com sucesso",
    });
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}

async function deleteHandler(request, response) {
  try {
    const { id } = request.query;

    const sessionToken = request.cookies.session_id;
    if (!sessionToken) {
      return response.status(401).json({
        message: "Você precisa estar logado.",
      });
    }

    const userSession = await session.findOneValidByToken(sessionToken);
    const foundOrder = await order.findOneById(id);

    // Apenas o comprador pode cancelar o pedido
    if (foundOrder.buyer_id !== userSession.user_id) {
      return response.status(403).json({
        message: "Você não tem permissão para cancelar este pedido.",
      });
    }

    const canceledOrder = await order.cancelById(id);

    return response.status(200).json({
      ...canceledOrder,
      message: "Pedido cancelado com sucesso",
    });
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}
