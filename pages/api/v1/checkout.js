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
    const { items, totalPrice } = request.body;

    // Validar se há items ou se é compra direta (listingId)
    const isSingleItem = request.body.listingId && request.body.quantity;
    
    if (!isSingleItem && (!items || items.length === 0)) {
      return response.status(400).json({
        message: "Nenhum item no carrinho para finalizar a compra.",
      });
    }

    if (!totalPrice || totalPrice <= 0) {
      return response.status(400).json({
        message: "Valor total inválido.",
      });
    }

    // Se for compra direta (um único item), converter para array
    const checkoutItems = isSingleItem 
      ? [{ listingId: request.body.listingId, quantity: request.body.quantity, price: request.body.totalPrice }]
      : items;

    console.log("Iniciando checkout para:", {
      userId: userSession.user_id,
      itemCount: checkoutItems.length,
      totalPrice,
    });

    // Criar pedidos para cada item
    const orders = [];
    for (const item of checkoutItems) {
      const newOrder = await order.create(
        userSession.user_id,
        item.listingId,
        Number(item.quantity),
        Number(item.price || item.priceLocked)
      );
      orders.push(newOrder);
      console.log("Pedido criado:", newOrder.id);
    }

    // Buscar dados do usuário para o pagamento
    const userData = await user.findOneById(userSession.user_id);

    console.log("Criando preferência de pagamento para email:", userData.email);

    // Criar preferência de pagamento no Mercado Pago com todos os itens
    const description = checkoutItems.length === 1 
      ? `Pedido ${orders[0].id}`
      : `${checkoutItems.length} itens - E-Play`;

    const paymentPreference = await payment.createPayment(
      userSession.user_id,
      orders[0].id, // Usar o primeiro pedido como referência
      totalPrice,
      description,
      userData.email
    );

    console.log("Preferência de pagamento criada:", paymentPreference.preferenceId);

    return response.status(201).json({
      orders,
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
