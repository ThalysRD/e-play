import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import order from "models/order.js";
import listing from "models/listing.js";
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
    const { listingId, quantity, includeShipping = false } = request.body;

    if (!listingId || !quantity) {
      return response.status(400).json({
        message: "listingId e quantity são obrigatórios.",
      });
    }

    // Buscar o produto para calcular o preço correto
    const product = await listing.findOneById(listingId);
    
    if (!product) {
      return response.status(404).json({
        message: "Produto não encontrado.",
      });
    }

    if (product.quantity < quantity) {
      return response.status(400).json({
        message: `Quantidade indisponível. Apenas ${product.quantity} unidade(s) em estoque.`,
      });
    }

    // Calcular o total correto no backend
    const subtotal = Number(product.price) * Number(quantity);
    const shippingCost = includeShipping && subtotal < 200 ? 15 : 0;
    const totalPrice = subtotal + shippingCost;

    const newOrder = await order.create(
      userSession.user_id,
      listingId,
      Number(quantity),
      totalPrice
    );

    // Reduzir o estoque do produto
    await listing.decreaseQuantity(listingId, Number(quantity));

    return response.status(201).json({
      ...newOrder,
      message: "Pedido criado com sucesso",
    });
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}
