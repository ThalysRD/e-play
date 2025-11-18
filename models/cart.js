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
        l.quantity as available_quantity,
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
    
    // Verificar quantidade disponível no estoque
    const listingResult = await database.query({
        text: `SELECT quantity, title FROM listings WHERE id = $1 LIMIT 1;`,
        values: [listingId],
    });
    
    if (listingResult.rowCount === 0) {
        throw new NotFoundError({
            message: "Produto não encontrado.",
            action: "Verifique o ID do produto.",
        });
    }
    
    const availableQuantity = listingResult.rows[0].quantity;
    const productTitle = listingResult.rows[0].title;
    
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
        
        if (newQty > availableQuantity) {
            throw new ValidationError({
                message: `Quantidade indisponível. "${productTitle}" tem apenas ${availableQuantity} unidade(s) em estoque.`,
                action: `Você já tem ${existing.rows[0].quantity} no carrinho. Máximo permitido: ${availableQuantity}.`,
            });
        }
        
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
        if (quantity > availableQuantity) {
            throw new ValidationError({
                message: `Quantidade indisponível. "${productTitle}" tem apenas ${availableQuantity} unidade(s) em estoque.`,
                action: `Máximo permitido: ${availableQuantity}.`,
            });
        }
        
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

async function mergeItemsForUser(userId, itemsToSync) {
    if (!userId || !itemsToSync || !Array.isArray(itemsToSync)) {
        throw new ValidationError({
            message: "userId e um array de itemsToSync são obrigatórios.",
            action: "Forneça os valores corretos.",
        });
    }
    if (itemsToSync.length === 0) {
        return await getWithItemsByUserId(userId);
    }
    const cart = await getOrCreateByUserId(userId);
    for (const item of itemsToSync) {
        const { listing_id, quantity, price_locked } = item;
        if (!listing_id || !quantity || Number(quantity) <= 0) {
            continue;
        }
        const numQuantity = Number(quantity);
        const numPriceLocked = price_locked !== undefined ? price_locked : null;

        // Verificar quantidade disponível
        const listingResult = await database.query({
            text: `SELECT quantity FROM listings WHERE id = $1 LIMIT 1;`,
            values: [listing_id],
        });
        
        if (listingResult.rowCount === 0) continue;
        
        const availableQuantity = listingResult.rows[0].quantity;

        const existing = await database.query({
            text: `
              SELECT quantity
              FROM cart_items
              WHERE cart_id = $1 AND listing_id = $2
              LIMIT 1;
            `,
            values: [cart.id, listing_id],
        });
        
        if (existing.rowCount > 0) {
            const newQty = existing.rows[0].quantity + numQuantity;
            
            // Limitar ao estoque disponível
            const finalQty = Math.min(newQty, availableQuantity);
            
            await database.query({
                text: `
                UPDATE cart_items
                SET quantity = $3,
                    price_locked = COALESCE($4, price_locked)
                WHERE cart_id = $1 AND listing_id = $2;
                `,
                values: [cart.id, listing_id, finalQty, numPriceLocked],
            });
        } else {
            // Limitar ao estoque disponível
            const finalQty = Math.min(numQuantity, availableQuantity);
            
            await database.query({
                text: `
                INSERT INTO cart_items (cart_id, listing_id, quantity, price_locked)
                VALUES ($1, $2, $3, $4);
                `,
                values: [cart.id, listing_id, finalQty, numPriceLocked],
            });
        }
    }
    await database.query({
        text: `UPDATE carts SET updated_at = timezone('utc', now()) WHERE id = $1;`,
        values: [cart.id],
    });
    return await getWithItemsByUserId(userId);
}

async function clearCartForUser(userId) {
    const cart = await getByUserId(userId);
    if (!cart) return;
    
    await database.query({
        text: `DELETE FROM cart_items WHERE cart_id = $1;`,
        values: [cart.id],
    });
    
    await database.query({
        text: `UPDATE carts SET updated_at = timezone('utc', now()) WHERE id = $1;`,
        values: [cart.id],
    });
}

const cart = {
    createForUser,
    getOrCreateByUserId,
    getWithItemsByUserId,
    addItemForUser,
    mergeItemsForUser,
    clearCartForUser,
};

export default cart;