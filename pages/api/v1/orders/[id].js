import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import order from "models/order.js";
import listing from "models/listing.js";
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
    const { status, trackingCode } = request.body;

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

    // Buscar o listing para verificar se o usuário é o vendedor
    const listingData = await listing.findOneById(foundOrder.listing_id);

    // Verificar se o usuário é o vendedor ou o comprador
    const isSeller = listingData.seller_id === userSession.user_id;
    const isBuyer = foundOrder.buyer_id === userSession.user_id;

    // Validar permissões baseado no papel do usuário
    if (isSeller) {
      // Vendedor pode atualizar para: preparing_shipment, shipped
      if (!["preparing_shipment", "shipped"].includes(status)) {
        return response.status(403).json({
          message: "Vendedores só podem atualizar para 'preparing_shipment' ou 'shipped'.",
        });
      }
    } else if (isBuyer) {
      // Comprador pode atualizar para: delivered
      if (status !== "delivered") {
        return response.status(403).json({
          message: "Compradores só podem atualizar para 'delivered'.",
        });
      }
    } else {
      return response.status(403).json({
        message: "Você não tem permissão para atualizar este pedido.",
      });
    }

    // Atualizar o status
    const updatedOrder = await order.updateStatus(id, status);

    // Se forneceu código de rastreio, atualizar também
    if (trackingCode && status === "shipped") {
      await order.updateTrackingCode(id, trackingCode);
    }

    return response.status(200).json({
      order: updatedOrder,
      message: "Status do pedido atualizado com sucesso.",
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
