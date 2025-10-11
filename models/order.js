import database from "infra/database.js";
import { NotFoundError } from "infra/errors";

async function findAllByUserId(userId) {
  const ordersFound = await runSelectQuery(userId);
  return ordersFound;

  async function runSelectQuery(userId) {
    const results = await database.query({
      text: `
        SELECT 
          * 
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
}

async function findOneById(orderId) {
  const orderFound = await runSelectQuery(orderId);
  return orderFound;

  async function runSelectQuery(orderId) {
    const results = await database.query({
      text: "SELECT * FROM orders WHERE id = $1 LIMIT 1;",
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
}

async function create(userId, orderData) {
  const newOrder = await runInsertQuery(userId, orderData);
  return newOrder;

  async function runInsertQuery(userId, orderData) {
    const { 
      total_amount, 
      status = 'pending',
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
          payment_method
        ) VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *`,
      values: [
        userId, 
        total_amount, 
        status, 
        JSON.stringify(items), 
        shipping_address, 
        payment_method
      ],
    });

    return results.rows[0];
  }
}

async function updateStatus(orderId, newStatus) {
  const updatedOrder = await runUpdateQuery(orderId, newStatus);
  return updatedOrder;

  async function runUpdateQuery(orderId, newStatus) {
    const results = await database.query({
      text: `
        UPDATE
          orders
        SET 
          status = $2,
          updated_at = NOW()
        WHERE 
          id = $1
        RETURNING 
          *`,
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
}

async function cancelById(orderId) {
  const canceledOrder = await runUpdateQuery(orderId);
  return canceledOrder;

  async function runUpdateQuery(orderId) {
    const results = await database.query({
      text: `
        UPDATE
          orders
        SET
          status = 'canceled',
          canceled_at = NOW(),
          updated_at = NOW()
        WHERE
          id = $1
          AND status NOT IN ('canceled', 'delivered')
        RETURNING
          *;`,
      values: [orderId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Não foi possível cancelar o pedido.",
        action: "O pedido pode já estar cancelado ou entregue.",
      });
    }

    return results.rows[0];
  }
}

const order = {
  create,
  findAllByUserId,
  findOneById,
  updateStatus,
  cancelById,
};

export default order;