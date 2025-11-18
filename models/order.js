import database from "infra/database.js";
import { NotFoundError, ValidationError } from "infra/errors";

const ORDER_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELED: "canceled",
};

async function create(buyerId, listingId, quantity, totalPrice, status = ORDER_STATUS.PENDING) {
  if (!buyerId || !listingId || !quantity || !totalPrice) {
    throw new ValidationError({
      message: "buyer_id, listing_id, quantity e total_price são obrigatórios",
      action: "Forneça todos os parâmetros necessários",
    });
  }

  if (quantity <= 0 || totalPrice <= 0) {
    throw new ValidationError({
      message: "quantity e total_price devem ser maiores que zero",
      action: "Forneça valores positivos",
    });
  }

  if (!Object.values(ORDER_STATUS).includes(status)) {
    throw new ValidationError({
      message: `Status inválido: ${status}`,
      action: `Use um dos seguintes: ${Object.values(ORDER_STATUS).join(", ")}`,
    });
  }

  const results = await database.query({
    text: `
      INSERT INTO orders (buyer_id, listing_id, quantity, total_price, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    values: [buyerId, listingId, quantity, totalPrice, status],
  });

  return results.rows[0];
}

async function findOneById(orderId) {
  if (!orderId) {
    throw new ValidationError({
      message: "Order ID é obrigatório",
      action: "Forneça um ID de pedido válido",
    });
  }

  const results = await database.query({
    text: `
      SELECT * FROM orders 
      WHERE id = $1 
      LIMIT 1
    `,
    values: [orderId],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Pedido não encontrado",
      action: "Verifique o ID do pedido e tente novamente",
    });
  }

  return results.rows[0];
}

async function findAllByBuyerId(buyerId) {
  if (!buyerId) {
    throw new ValidationError({
      message: "Buyer ID é obrigatório",
      action: "Forneça um ID de comprador válido",
    });
  }

  const results = await database.query({
    text: `
      SELECT * FROM orders 
      WHERE buyer_id = $1 
      ORDER BY created_at DESC
    `,
    values: [buyerId],
  });

  return results.rows;
}

async function findAllBySellerListings(sellerId) {
  if (!sellerId) {
    throw new ValidationError({
      message: "Seller ID é obrigatório",
      action: "Forneça um ID de vendedor válido",
    });
  }

  const results = await database.query({
    text: `
      SELECT o.* FROM orders o
      INNER JOIN listings l ON o.listing_id = l.id
      WHERE l.user_id = $1
      ORDER BY o.created_at DESC
    `,
    values: [sellerId],
  });

  return results.rows;
}

async function updateStatus(orderId, newStatus) {
  if (!orderId || !newStatus) {
    throw new ValidationError({
      message: "Order ID e novo status são obrigatórios",
      action: "Forneça ambos os parâmetros",
    });
  }

  if (!Object.values(ORDER_STATUS).includes(newStatus)) {
    throw new ValidationError({
      message: `Status inválido: ${newStatus}`,
      action: `Use um dos seguintes: ${Object.values(ORDER_STATUS).join(", ")}`,
    });
  }

  const results = await database.query({
    text: `
      UPDATE orders 
      SET status = $2, updated_at = timezone('utc', now())
      WHERE id = $1
      RETURNING *
    `,
    values: [orderId, newStatus],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Pedido não encontrado",
      action: "Verifique o ID do pedido e tente novamente",
    });
  }

  return results.rows[0];
}

async function cancelById(orderId) {
  if (!orderId) {
    throw new ValidationError({
      message: "Order ID é obrigatório",
      action: "Forneça um ID de pedido válido",
    });
  }

  // Verificar se pode cancelar
  const order = await findOneById(orderId);
  
  if (order.status === ORDER_STATUS.CANCELED) {
    throw new ValidationError({
      message: "Este pedido já foi cancelado",
      action: "Não é possível cancelar um pedido já cancelado",
    });
  }

  if (order.status === ORDER_STATUS.DELIVERED) {
    throw new ValidationError({
      message: "Pedidos entregues não podem ser cancelados",
      action: "Entre em contato com o suporte para solicitar uma devolução",
    });
  }

  return await updateStatus(orderId, ORDER_STATUS.CANCELED);
}

const order = {
  create,
  findOneById,
  findAllByBuyerId,
  findAllBySellerListings,
  updateStatus,
  cancelById,
  STATUS: ORDER_STATUS,
};

export default order;
