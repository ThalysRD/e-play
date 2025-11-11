// models/cart_items.js
import { ValidationError, NotFoundError } from "infra/errors";
import database from "../infra/database.js";

async function addItem(cartId, listingId, quantity = 1, priceLocked = null) {
    if (!cartId || !listingId) {
        throw new ValidationError({
            message: "cartId e listingId são obrigatórios.",
            action: "Forneça os identificadores corretos.",
        });
    }
    if (quantity <= 0) {
        throw new ValidationError({
            message: "A quantidade deve ser maior que zero.",
            action: "Informe uma quantidade positiva.",
        });
    }
    const existing = await database.query({
        text: `
      SELECT quantity
      FROM cart_items
      WHERE cart_id = $1 AND listing_id = $2
      LIMIT 1;
    `,
        values: [cartId, listingId],
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
            values: [cartId, listingId, newQty, priceLocked],
        });
    } else {
        await database.query({
            text: `
        INSERT INTO cart_items (cart_id, listing_id, quantity, price_locked)
        VALUES ($1, $2, $3, $4);
      `,
            values: [cartId, listingId, quantity, priceLocked],
        });
    }
    await touchCart(cartId);
    return await getItem(cartId, listingId);
}

async function setItemQuantity(cartId, listingId, quantity) {
    if (!cartId || !listingId) {
        throw new ValidationError({
            message: "cartId e listingId são obrigatórios.",
            action: "Forneça os identificadores corretos.",
        });
    }
    if (quantity <= 0) {
        await removeItem(cartId, listingId);
        return null;
    }
    const result = await database.query({
        text: `
      UPDATE cart_items
      SET quantity = $3
      WHERE cart_id = $1 AND listing_id = $2
      RETURNING cart_id, listing_id, quantity, price_locked;
    `,
        values: [cartId, listingId, quantity],
    });
    if (result.rowCount === 0) {
        throw new NotFoundError({
            message: "Item não encontrado no carrinho.",
            action: "Verifique se o listing faz parte do carrinho informado.",
        });
    }
    await touchCart(cartId);
    return result.rows[0];
}

async function removeItem(cartId, listingId) {
    const del = await database.query({
        text: `
      DELETE FROM cart_items
      WHERE cart_id = $1 AND listing_id = $2
      RETURNING cart_id, listing_id;
    `,
        values: [cartId, listingId],
    });
    if (del.rowCount === 0) {
        throw new NotFoundError({
            message: "Item não encontrado para remoção.",
            action: "Garanta que cart_id e listing_id estejam corretos.",
        });
    }
    await touchCart(cartId);
    return true;
}

async function clearCart(cartId) {
    await database.query({
        text: `DELETE FROM cart_items WHERE cart_id = $1;`,
        values: [cartId],
    });
    await touchCart(cartId);
    return true;
}

async function listItems(cartId) {
    const result = await database.query({
        text: `
      SELECT cart_id, listing_id, quantity, price_locked
      FROM cart_items
      WHERE cart_id = $1
      ORDER BY listing_id;
    `,
        values: [cartId],
    });
    return result.rows;
}

async function getItem(cartId, listingId) {
    const result = await database.query({
        text: `
      SELECT cart_id, listing_id, quantity, price_locked
      FROM cart_items
      WHERE cart_id = $1 AND listing_id = $2
      LIMIT 1;
    `,
        values: [cartId, listingId],
    });
    return result.rows[0] || null;
}

async function touchCart(cartId) {
    await database.query({
        text: `UPDATE carts SET updated_at = timezone('utc', now()) WHERE id = $1;`,
        values: [cartId],
    });
}

const cartItems = {
    addItem,
    setItemQuantity,
    removeItem,
    clearCart,
    listItems,
    getItem,
};

export default cartItems;