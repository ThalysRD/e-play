import { ValidationError, NotFoundError } from "infra/errors.js";
import database from "../infra/database.js";
import user from "./user.js"


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
          l.id = $1
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

async function create(userInputValues) {
  await validateUserExists(userInputValues.userId)

  const newListing = await runInsertQuery(userInputValues)
  return newListing


  async function runInsertQuery(userInputValues) {
    const results = await database.query({
      text: `
        INSERT INTO 
          listings (user_id, category_id, title, description, price, condition, quantity)
        VALUES 
          ($1,$2,$3,$4,$5,$6,$7)
        RETURNING
          *
      ;`,
      values: [
        userInputValues.userId,
        userInputValues.categoryId,
        userInputValues.title,
        userInputValues.description,
        userInputValues.price,
        userInputValues.condition,
        userInputValues.quantity
      ]
    })
    return results.rows[0]
  }
}


async function validateUserExists(userId) {
  const result = await user.findOneById(userId)
  if (!result) {
    throw new ValidationError({
      message: "O usuário informado não existe no sistema",
      action: "Verifique se o ID do usuário está correto",
    });
  }
}

async function deleteById(listingId) {
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

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Anúncio não encontrado.",
        action: "Verifique se o ID do anúncio está correto.",
      });
    }

    return results.rows[0];
  }
}

const listing = {
  findAll,
  findOneById,
  create,
  deleteById
}


export default listing