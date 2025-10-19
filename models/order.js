import database from "infra/database.js";
import { NotFoundError } from "infra/errors";

// Enumerate de status validos
const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELED: 'canceled'
};

// Validações
function validateOrderData(orderData) {
  const errors = [];
  
  if (!orderData.total_amount || orderData.total_amount <= 0) {
    errors.push("Total amount deve ser maior que zero");
  }
  
  if (orderData.status && !Object.values(ORDER_STATUS).includes(orderData.status)) {
    errors.push(`Status inválido: ${orderData.status}`);
  }
  
  if (!orderData.shipping_address) {
    errors.push("Endereço de entrega é obrigatório");
  }
  
  if (!orderData.payment_method) {
    errors.push("Método de pagamento é obrigatório");
  }
  
  if (errors.length > 0) {
    throw new Error(`Dados inválidos: ${errors.join(', ')}`);
  }
}

async function findAllByUserId(userId) {
  if (!userId) {
    throw new Error("User ID é obrigatório");
  }

  const results = await database.query({
    text: `
      SELECT 
        id,
        user_id,
        total_amount,
        status,
        items,
        shipping_address,
        payment_method,
        created_at,
        updated_at,
        canceled_at
      FROM 
        orders 
      WHERE 
        user_id = $1 
      ORDER BY 
        created_at DESC;`,
    values: [userId],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Usuário não possui pedidos.",
      action: "Verifique se este usuário possui pedidos e tente novamente.",
    });
  }

  return results.rows;
}

async function findOneById(orderId) {
  if (!orderId) {
    throw new Error("Order ID é obrigatório");
  }

  const results = await database.query({
    text: `
      SELECT 
        id,
        user_id,
        total_amount,
        status,
        items,
        shipping_address,
        payment_method,
        created_at,
        updated_at,
        canceled_at
      FROM 
        orders 
      WHERE 
        id = $1 
      LIMIT 1;`,
    values: [orderId],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Pedido não encontrado.",
      action: "Verifique o ID do pedido e tente novamente.",
    });
  }

  return results.rows[0];
}

async function create(userId, orderData) {
  if (!userId) {
    throw new Error("User ID é obrigatório");
  }

  // Validar dados do pedido
  validateOrderData(orderData);

  const { 
    total_amount, 
    status = ORDER_STATUS.PENDING,
    items = [],
    shipping_address,
    payment_method 
  } = orderData;

  const results = await database.query({
    text: `
      INSERT INTO orders (
        user_id, 
        total_amount, 
        status, 
        items, 
        shipping_address, 
        payment_method,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, NOW(), NOW()) 
      RETURNING *`,
    values: [
      userId, 
      total_amount, 
      status, 
      JSON.stringify(items), // Se a coluna for JSONB, o Postgres fara a conversao
      shipping_address, 
      payment_method
    ],
  });

  return results.rows[0];
}

async function updateStatus(orderId, newStatus) {
  if (!orderId) {
    throw new Error("Order ID é obrigatório");
  }

  if (!newStatus) {
    throw new Error("Novo status é obrigatório");
  }

  // Valida se o status eh valido
  if (!Object.values(ORDER_STATUS).includes(newStatus)) {
    throw new Error(`Status inválido: ${newStatus}. Use um dos seguintes: ${Object.values(ORDER_STATUS).join(', ')}`);
  }

  const results = await database.query({
    text: `
      UPDATE orders
      SET 
        status = $2,
        updated_at = NOW(),
        canceled_at = CASE 
          WHEN $2 = 'canceled' THEN NOW() 
          ELSE canceled_at 
        END
      WHERE 
        id = $1
      RETURNING *`,
    values: [orderId, newStatus],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Pedido não encontrado para atualização.",
      action: "Verifique o ID do pedido e tente novamente.",
    });
  }

  return results.rows[0];
}

async function cancelById(orderId) {
  if (!orderId) {
    throw new Error("Order ID é obrigatório");
  }

  const results = await database.query({
    text: `
      UPDATE orders
      SET
        status = $2,
        canceled_at = NOW(),
        updated_at = NOW()
      WHERE
        id = $1
        AND status NOT IN ($3, $4)
      RETURNING *;`,
    values: [
      orderId, 
      ORDER_STATUS.CANCELED, 
      ORDER_STATUS.CANCELED, 
      ORDER_STATUS.DELIVERED
    ],
  });

  if (results.rowCount === 0) {
    // buscar o pedido para dar uma mensagem mais especifica
    const existingOrder = await database.query({
      text: "SELECT status FROM orders WHERE id = $1",
      values: [orderId]
    });

    if (existingOrder.rowCount === 0) {
      throw new NotFoundError({
        message: "Pedido não encontrado.",
        action: "Verifique o ID do pedido e tente novamente.",
      });
    }

    const currentStatus = existingOrder.rows[0].status;
    throw new Error({
      message: `Não foi possível cancelar o pedido com status '${currentStatus}'.`,
      action: currentStatus === ORDER_STATUS.DELIVERED 
        ? "Pedidos entregues não podem ser cancelados." 
        : "O pedido já está cancelado.",
    });
  }

  return results.rows[0];
}

// buscar pedidos por status
async function findAllByStatus(status) {
  if (!Object.values(ORDER_STATUS).includes(status)) {
    throw new Error(`Status inválido: ${status}`);
  }

  const results = await database.query({
    text: `
      SELECT * FROM orders 
      WHERE status = $1 
      ORDER BY created_at DESC;`,
    values: [status],
  });

  return results.rows;
}

// Função para obter estatisticas de pedidos de um usuario
async function getUserOrderStats(userId) {
  if (!userId) {
    throw new Error("User ID é obrigatório");
  }

  const results = await database.query({
    text: `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = $2) as pending_orders,
        COUNT(*) FILTER (WHERE status = $3) as delivered_orders,
        COUNT(*) FILTER (WHERE status = $4) as canceled_orders,
        SUM(total_amount) FILTER (WHERE status = $3) as total_spent
      FROM orders 
      WHERE user_id = $1;`,
    values: [
      userId,
      ORDER_STATUS.PENDING,
      ORDER_STATUS.DELIVERED,
      ORDER_STATUS.CANCELED
    ],
  });

  return results.rows[0];
}

const order = {
  create,
  findAllByUserId,
  findOneById,
  updateStatus,
  cancelById,
  findAllByStatus,
  getUserOrderStats,
  // Exportar tambem as constantes de status
  STATUS: ORDER_STATUS
};

export default order;