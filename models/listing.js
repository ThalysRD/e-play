import { ValidationError, NotFoundError } from "infra/errors.js";
import database from "../infra/database.js";
import user from "./user.js";
import listingImages from "./listingImage.js";

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

async function findListingsByTitle(listingTitle) {
  const listings = await runSelectQuery(listingTitle);
  return listings;

  async function runSelectQuery(listingTitle) {
    const results = await database.query({
      text: `
        SELECT
          l.*,
          u.username,
          u.email,
          (
            SELECT json_agg(
              json_build_object(
                'id', li.id,
                'image_url', li.image_url,
                'display_order', li.display_order
              ) ORDER BY li.display_order
            )
            FROM listing_images li
            WHERE li.listing_id = l.id
          ) as images
        FROM
          listings l
        LEFT JOIN
          users u ON l.user_id = u.id
        WHERE
          l.title ILIKE $1
        ORDER BY
          l.created_at DESC
      `,
      values: [`%${listingTitle}%`],
    });
    return results.rows;
  }
}

async function findAll() {
  const listings = await runSelectQuery();
  return listings;

  async function runSelectQuery() {
    const results = await database.query({
      text: `
        SELECT
          l.*,
          u.username,
          u.email,
          (
            SELECT json_agg(
              json_build_object(
                'id', li.id,
                'image_url', li.image_url,
                'display_order', li.display_order
              ) ORDER BY li.display_order
            )
            FROM listing_images li
            WHERE li.listing_id = l.id
          ) as images
        FROM
          listings l
        LEFT JOIN
          users u ON l.user_id = u.id
        ORDER BY
          l.created_at DESC
      `,
    });
    return results.rows;
  }
}

async function findOneById(listingId) {
  const listing = await runSelectQuery(listingId);
  return listing;

  async function runSelectQuery(listingId) {
    const results = await database.query({
      text: `
        SELECT
          listings.id,
          listings.user_id,
          listings.category_id,
          listings.title,
          listings.description,
          listings.price,
          listings.condition,
          listings.quantity,
          listings.active,
          listings.created_at,
          listings.updated_at,
          users.username,
          users.email
        FROM listings
        LEFT JOIN users ON listings.user_id = users.id
        WHERE listings.id = $1
      `,
      values: [listingId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Anúncio não encontrado.",
        action: "Verifique se o ID do anúncio está correto.",
      });
    }

    return results.rows[0];
  }
}

async function findImagesById(listingId) {
  const images = await runSelectQuery(listingId);
  return images;

  async function runSelectQuery(listingId) {
    const results = await database.query({
      text: `
        SELECT
          listing_images.id,
          listing_images.image_url,
          listing_images.display_order
        FROM listing_images
        WHERE listing_images.listing_id = $1
        ORDER BY listing_images.display_order
      `,
      values: [listingId],
    });
    return results.rows;
  }
}

async function create(userInputValues) {
  await validateUserExists(userInputValues.userId);
  const newListing = await runInsertQuery(userInputValues);
  return newListing;

  async function runInsertQuery(userInputValues) {
    try {
      const result = await database.transaction(async (client) => {
        const listingQueryText = `
          INSERT INTO 
            listings (user_id, category_id, title, description, price, condition, quantity)
          VALUES 
            ($1,$2,$3,$4,$5,$6,$7)
          RETURNING *
        `;

        const listingValues = [
          userInputValues.userId,
          userInputValues.categoryId,
          userInputValues.title,
          userInputValues.description,
          userInputValues.price,
          userInputValues.condition,
          userInputValues.quantity,
        ];

        const listingResult = await client.query(
          listingQueryText,
          listingValues,
        );
        const listing = listingResult.rows[0];

        const images = userInputValues.images || [];
        const createdImages = [];

        for (const imageUrl of images) {
          if (!imageUrl) continue;
          const newImage = await listingImages.create(
            { listing_id: listing.id, image_url: imageUrl },
            { client },
          );
          createdImages.push(newImage);
        }

        return { ...listing, images: createdImages };
      });
      return result;
    } catch (error) {
      throw new ValidationError({
        message: `Falha ao criar anúncio`,
        action: error.message,
      });
    }
  }
}

async function updateById(listingId, updatedFields) {
  await validateListingExists(listingId);
  const updated = await runUpdateQuery(listingId, updatedFields);
  return updated;

  async function runUpdateQuery(listingId, updatedFields) {
    try {
      const result = await database.transaction(async (client) => {
        const allowedFields = {
          title: true,
          description: true,
          price: true,
          condition: true,
          quantity: true,
          category_id: true,
          categoryId: "category_id",
        };

        const setClauses = [];
        const values = [];
        let valueCount = 1;

        for (const key in updatedFields) {
          if (key === "images") continue;

          const fieldName =
            allowedFields[key] === true ? key : allowedFields[key];

          if (
            fieldName &&
            updatedFields[key] !== undefined &&
            updatedFields[key] !== null
          ) {
            setClauses.push(`${fieldName} = $${valueCount++}`);
            values.push(updatedFields[key]);
          }
        }

        if (setClauses.length > 0) {
          values.push(listingId);
          const updateQuery = {
            text: `UPDATE listings SET ${setClauses.join(", ")}, updated_at = NOW() WHERE id = $${valueCount} RETURNING *`,
            values,
          };
          await client.query(updateQuery);
        }

        if (updatedFields.images !== undefined) {
          const finalImages = updatedFields.images || [];

          await client.query(
            `DELETE FROM listing_images WHERE listing_id = $1`,
            [listingId],
          );

          if (finalImages.length > 0) {
            for (let i = 0; i < finalImages.length; i++) {
              const imageUrl = finalImages[i];
              if (!imageUrl) continue;

              await client.query(
                `INSERT INTO listing_images (listing_id, image_url, display_order, created_at, updated_at) 
                 VALUES ($1, $2, $3, NOW(), NOW())`,
                [listingId, imageUrl, i],
              );
            }
          }
        }

        return findOneById(listingId);
      });
      return result;
    } catch (error) {
      throw new ValidationError({
        message: `Falha ao atualizar anúncio`,
        action: error.message,
      });
    }
  }
}

async function validateUserExists(userId) {
  const result = await user.findOneById(userId);
  if (!result) {
    throw new ValidationError({
      message: "O usuário informado não existe no sistema",
      action: "Verifique se o ID do usuário está correto",
    });
  }
}

async function deleteById(listingId) {
  await validateListingExists(listingId);
  const result = await runDeleteQuery(listingId);
  return result;

  async function runDeleteQuery(listingId) {
    await database.query({
      text: `DELETE FROM listing_images WHERE listing_id = $1`,
      values: [listingId],
    });

    const results = await database.query({
      text: `DELETE FROM listings WHERE id = $1 RETURNING id`,
      values: [listingId],
    });

    return results.rows[0];
  }
}

async function validateListingExists(listingId) {
  try {
    await findOneById(listingId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new NotFoundError({
      message: "Anúncio não encontrado.",
      action: "Verifique se o ID do anúncio está correto.",
    });
  }
}

async function decreaseQuantity(listingId, quantityToDecrease) {
  if (!listingId || !quantityToDecrease || quantityToDecrease <= 0) {
    throw new ValidationError({
      message: "listingId e quantidade válida são obrigatórios",
      action: "Forneça os parâmetros corretos",
    });
  }

  const results = await database.query({
    text: `
      UPDATE listings
      SET quantity = quantity - $2,
          updated_at = timezone('utc', now())
      WHERE id = $1 AND quantity >= $2
      RETURNING *
    `,
    values: [listingId, quantityToDecrease],
  });

  if (results.rowCount === 0) {
    throw new ValidationError({
      message: "Não foi possível reduzir o estoque. Quantidade insuficiente.",
      action: "Verifique o estoque disponível.",
    });
  }

  return results.rows[0];
}

const listing = {
  findAll,
  findOneById,
  findImagesById,
  create,
  deleteById,
  findListingsByTitle,
  updateById,
  decreaseQuantity,
};

export default listing;
