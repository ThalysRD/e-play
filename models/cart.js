import { ValidationError, NotFoundError } from "infra/errors";
import database from "../infra/database.js";

async function createForUser(userId) {
    if (!userId) {
        throw new ValidationError({
            message: "userId é obrigatório para criar um carrinho.",
            action: "Forneça um userId válido.",
        });
    }
    const cart = await getByUserId(userId);
    if (cart) return cart;
    const result = await database.query({
        text: `
      INSERT INTO carts (user_id)
      VALUES ($1)
      RETURNING *;
    `,
        values: [userId],
    });
    return result.rows[0];
}

async function getByUserId(userId) {
    const result = await database.query({
        text: `SELECT * FROM carts WHERE user_id = $1 LIMIT 1;`,
        values: [userId],
    });
    return result.rows[0] || null;
}

async function getOrCreateByUserId(userId) {
    const cart = await getByUserId(userId);
    if (cart) return cart;
    return await createForUser(userId);
}

async function getWithItemsByUserId(userId) {
    const result = await database.query({
        text: `
SELECT
c.*,
COALESCE(
  (
    SELECT json_agg(ci_row ORDER BY ci_row.listing_id)
    FROM (
      SELECT
        ci.cart_id,
        ci.listing_id,
        ci.quantity,
        ci.price_locked,
        l.title,
        (
          SELECT li.image_url
          FROM listing_images li
          WHERE li.listing_id = ci.listing_id
          ORDER BY li.display_order ASC
          LIMIT 1
        ) AS image_url
      FROM cart_items ci
      INNER JOIN listings l ON ci.listing_id = l.id
      WHERE ci.cart_id = c.id
    ) AS ci_row
  ),
  '[]'::json
) AS items
FROM carts c
WHERE c.user_id = $1
LIMIT 1;
`,
        values: [userId],
    });

    if (result.rowCount === 0) {
        throw new NotFoundError({
            message: "Carrinho não encontrado para este usuário.",
            action: "Crie um carrinho antes de consultar os itens.",
        });
    }

    return result.rows[0];
}

async function addItemForUser(userId, listingId, quantity = 1, priceLocked = null) {
    if (!userId || !listingId) {
        throw new ValidationError({
            message: "userId e listingId são obrigatórios.",
            action: "Forneça os valores corretos.",
        });
    }
    if (quantity <= 0) {
        throw new ValidationError({
            message: "A quantidade deve ser maior que zero.",
            action: "Informe uma quantidade positiva.",
        });
    }
    const cart = await getOrCreateByUserId(userId);
    const existing = await database.query({
        text: `
      SELECT cart_id, listing_id, quantity
      FROM cart_items
      WHERE cart_id = $1 AND listing_id = $2
      LIMIT 1;
    `,
        values: [cart.id, listingId],
    });
    if (existing.rowCount > 0) {
        const newQty = existing.rows[0].quantity + quantity;
        await database.query({
            text: `
        UPDATE cart_items
        SET quantity = $3,
            price_locked = COALESCE($4, price_locked)
        WHERE cart_id = $1 AND listing_id = $2;
      `,
            values: [cart.id, listingId, newQty, priceLocked],
        });
    } else {
        await database.query({
            text: `
        INSERT INTO cart_items (cart_id, listing_id, quantity, price_locked)
        VALUES ($1, $2, $3, $4);
      `,
            values: [cart.id, listingId, quantity, priceLocked],
        });
    }
    await database.query({
        text: `UPDATE carts SET updated_at = timezone('utc', now()) WHERE id = $1;`,
        values: [cart.id],
    });
    return await getWithItemsByUserId(userId);
}

const cart = {
    createForUser,
    getByUserId,
    getOrCreateByUserId,
    getWithItemsByUserId,
    addItemForUser,
};

export default cart;