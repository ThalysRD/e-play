import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import order from "models/order.js";
import listing from "models/listing.js";
import session from "models/session.js";
import cart from "models/cart.js";

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
    
    // Buscar carrinho do usuário
    const userCart = await cart.getWithItemsByUserId(userSession.user_id);
    
    if (!userCart.items || userCart.items.length === 0) {
      return response.status(400).json({
        message: "Seu carrinho está vazio.",
      });
    }

    const orders = [];
    let subtotalGeral = 0;

    // Validar e calcular subtotal de todos os itens
    for (const item of userCart.items) {
      // Buscar produto atualizado para garantir preço e estoque corretos
      const product = await listing.findOneById(item.listing_id);
      
      if (!product) {
        return response.status(404).json({
          message: `Produto "${item.title}" não encontrado.`,
        });
      }

      if (product.quantity < item.quantity) {
        return response.status(400).json({
          message: `Quantidade indisponível para "${product.title}". Apenas ${product.quantity} unidade(s) em estoque.`,
        });
      }

      // Usar o preço atual do produto (não o price_locked do carrinho)
      const itemTotal = Number(product.price) * Number(item.quantity);
      subtotalGeral += itemTotal;
    }

    // Calcular frete (grátis acima de R$ 200)
    const shippingCost = subtotalGeral >= 200 ? 0 : 15;
    const totalGeralComFrete = subtotalGeral + shippingCost;

    // Criar pedidos (um por item)
    for (const item of userCart.items) {
      const product = await listing.findOneById(item.listing_id);
      
      // Calcular proporção do frete para este item baseado no seu valor
      const itemSubtotal = Number(product.price) * Number(item.quantity);
      const itemProportionOfTotal = itemSubtotal / subtotalGeral;
      const itemShippingCost = shippingCost * itemProportionOfTotal;
      const itemTotalPrice = itemSubtotal + itemShippingCost;

      const newOrder = await order.create(
        userSession.user_id,
        item.listing_id,
        Number(item.quantity),
        itemTotalPrice
      );

      // Reduzir o estoque do produto
      await listing.decreaseQuantity(item.listing_id, Number(item.quantity));

      orders.push(newOrder);
    }

    // Limpar o carrinho após criar os pedidos
    await cart.clearCartForUser(userSession.user_id);

    return response.status(201).json({
      orders,
      summary: {
        subtotal: subtotalGeral,
        shipping: shippingCost,
        total: totalGeralComFrete,
        itemCount: userCart.items.length,
      },
      message: "Pedidos criados com sucesso",
    });
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}
