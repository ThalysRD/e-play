import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import order from "models/order.js";
import listing from "models/listing.js";
import session from "models/session.js";
import database from "infra/database.js";

const router = createRouter();

router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  try {
    const { id } = request.query;
    const { tracking_code } = request.body;

    if (!tracking_code || !tracking_code.trim()) {
      return response.status(400).json({
        message: "Código de rastreio é obrigatório.",
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

    // Verificar se o usuário é o vendedor
    if (listingData.user_id !== userSession.user_id) {
      return response.status(403).json({
        message: "Apenas o vendedor pode atualizar o código de rastreio.",
      });
    }

    // Atualizar o código de rastreio
    const query = {
      text: `
        UPDATE orders
        SET tracking_code = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *;
      `,
      values: [tracking_code.trim(), id],
    };

    const result = await database.query(query);

    if (result.rowCount === 0) {
      return response.status(404).json({
        message: "Pedido não encontrado.",
      });
    }

    return response.status(200).json({
      order: result.rows[0],
      message: "Código de rastreio atualizado com sucesso.",
    });
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}
