import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import order from "models/order.js";
import listing from "models/listing.js";
import session from "models/session.js";
import user from "models/user.js";
import orderNotifications from "models/orderNotifications.js";

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

    // Buscar o listing para verificar se o usuário é o vendedor
    const listingData = await listing.findOneById(foundOrder.listing_id);

    // Validar se o usuário é o comprador ou o vendedor do item
    const isSeller = listingData.seller_id === userSession.user_id;
    const isBuyer = foundOrder.buyer_id === userSession.user_id;

    if (!isSeller && !isBuyer) {
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

    // Buscar o listing para verificar se o usuário é o vendedor
    const listingData = await listing.findOneById(foundOrder.listing_id);

    // Verificar se o usuário é o vendedor ou o comprador
    const isSeller = listingData.user_id === userSession.user_id;
    const isBuyer = foundOrder.buyer_id === userSession.user_id;

    // Validar permissões baseado no papel do usuário
    if (isSeller) {
      // Vendedor pode atualizar para: processing, shipped, canceled
      if (!["processing", "shipped", "canceled"].includes(status)) {
        return response.status(403).json({
          message: "Vendedores só podem atualizar para 'processing', 'shipped' ou 'canceled'.",
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

    // Se estiver cancelando, devolver o estoque
    if (status === "canceled" && foundOrder.status !== "canceled") {
      await listing.increaseQuantity(foundOrder.listing_id, foundOrder.quantity);
    }

    // Atualizar o status
    const updatedOrder = await order.updateStatus(id, status);

    // Enviar emails de notificação
    try {
      // Buscar dados do comprador e vendedor
      const buyer = await user.findOneById(foundOrder.buyer_id);
      const seller = await user.findOneById(listingData.user_id);

      if (isSeller) {
        // Vendedor alterou status - notificar comprador
        if (status === "processing" || status === "shipped" || status === "canceled") {
          console.log(`[EMAIL] Enviando atualização de status "${status}" para comprador: ${buyer.email}`);
          await orderNotifications.sendStatusUpdateToBuyer(
            buyer.email,
            buyer.name,
            updatedOrder,
            listingData.title,
            status
          );
          console.log(`[EMAIL] ✓ Email de status enviado para ${buyer.email}`);
        }
      } else if (isBuyer && status === "delivered") {
        // Comprador confirmou entrega - notificar vendedor e comprador
        console.log(`[EMAIL] Enviando confirmação de entrega para vendedor: ${seller.email}`);
        await orderNotifications.sendDeliveryConfirmationToSeller(
          seller.email,
          seller.name,
          updatedOrder,
          listingData.title,
          buyer.name
        );
        console.log(`[EMAIL] ✓ Email de entrega enviado para vendedor`);
        
        console.log(`[EMAIL] Enviando finalização de pedido para comprador: ${buyer.email}`);
        await orderNotifications.sendOrderCompletedToBuyer(
          buyer.email,
          buyer.name,
          updatedOrder,
          listingData.title
        );
        console.log(`[EMAIL] ✓ Email de finalização enviado para comprador`);
      }
    } catch (emailError) {
      console.error("[EMAIL] ✗ Erro ao enviar email de notificação:", emailError.message);
      console.error(emailError);
      // Não interromper o processo se o email falhar
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
