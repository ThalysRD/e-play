import { ValidationError, NotFoundError } from "infra/errors";
import database from "../infra/database";

async function findOneById(id) {
  const listingFound = await runSelectQuery(id);
  return listingFound;

  async function runSelectQuery(id) {
    const results = await database.query({
      text: "SELECT * FROM listings WHERE id = $1 LIMIT 1;",
      values: [id],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O ID do anúncio informado não foi encontrado no sistema",
        action: "Verifique se o ID está digitado corretamente",
      });
    }

    return results.rows[0];
  }
}


async function findByCategoryId(categoryId, options = {}) {
  const { active = true, limit = null, offset = 0 } = options;

  let query = "SELECT * FROM listings WHERE category_id = $1";
  const values = [categoryId];
  let paramCounter = 2;

  if (active !== null) {
    query += ` AND active = $${paramCounter}`;
    values.push(active);
    paramCounter++;
  }

  query += " ORDER BY created_at DESC";

  if (limit) {
    query += ` LIMIT $${paramCounter}`;
    values.push(limit);
    paramCounter++;
  }

  if (offset > 0) {
    query += ` OFFSET $${paramCounter}`;
    values.push(offset);
  }

  const results = await database.query({
    text: query,
    values: values,
  });

  return results.rows;
}

async function findAll(options = {}) {
  const { active = true, limit = 20, offset = 0 } = options;

  let query = "SELECT * FROM listings";
  const values = [];
  let paramCounter = 1;

  if (active !== null) {
    query += ` WHERE active = $${paramCounter}`;
    values.push(active);
    paramCounter++;
  }

  query += " ORDER BY created_at DESC";

  if (limit) {
    query += ` LIMIT $${paramCounter}`;
    values.push(limit);
    paramCounter++;
  }

  if (offset > 0) {
    query += ` OFFSET $${paramCounter}`;
    values.push(offset);
  }

  const results = await database.query({
    text: query,
    values: values,
  });

  return results.rows;
}

async function create(listingInputValues) {
  await validateRequiredFields(listingInputValues);
  await validateUserExists(listingInputValues.user_id);
  await validateCategoryExists(listingInputValues.category_id);

  const newListing = await runInsertQuery(listingInputValues);
  return newListing;

  async function runInsertQuery(listingInputValues) {
    const results = await database.query({
      text: `
        INSERT INTO listings (
          user_id, 
          category_id, 
          title, 
          description, 
          price, 
          condition, 
          quantity, 
          active, 
          listing_images
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *;
      `,
      values: [
        listingInputValues.user_id,
        listingInputValues.category_id,
        listingInputValues.title,
        listingInputValues.description,
        listingInputValues.price,
        listingInputValues.condition,
        listingInputValues.quantity || 1,
        listingInputValues.active !== false, // default true
        listingInputValues.listing_images || null,
      ],
    });

    return results.rows[0];
  }
}

async function update(id, updateValues) {
  const existingListing = await findOneById(id);

  if (
    updateValues.user_id &&
    updateValues.user_id !== existingListing.user_id
  ) {
    await validateUserExists(updateValues.user_id);
  }

  if (
    updateValues.category_id &&
    updateValues.category_id !== existingListing.category_id
  ) {
    await validateCategoryExists(updateValues.category_id);
  }

  const updatedListing = await runUpdateQuery(id, updateValues);
  return updatedListing;

  async function runUpdateQuery(id, updateValues) {
    const fields = [];
    const values = [];
    let paramCounter = 1;

    const allowedFields = [
      "category_id",
      "title",
      "description",
      "price",
      "condition",
      "quantity",
      "active",
      "listing_images",
    ];

    allowedFields.forEach((field) => {
      if (updateValues[field] !== undefined) {
        fields.push(`${field} = $${paramCounter}`);
        values.push(updateValues[field]);
        paramCounter++;
      }
    });

    if (fields.length === 0) {
      throw new ValidationError({
        message: "Nenhum campo válido foi fornecido para atualização",
        action: "Forneça pelo menos um campo válido para atualizar",
      });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const results = await database.query({
      text: `UPDATE listings SET ${fields.join(", ")} WHERE id = $${paramCounter} RETURNING *;`,
      values: values,
    });

    return results.rows[0];
  }
}

async function remove(id) {
  const existingListing = await findOneById(id);

  const results = await database.query({
    text: "DELETE FROM listings WHERE id = $1 RETURNING *;",
    values: [id],
  });

  return results.rows[0];
}

async function validateRequiredFields(listingInputValues) {
  const requiredFields = ["user_id", "category_id", "title", "price"];

  for (const field of requiredFields) {
    if (!listingInputValues[field] && listingInputValues[field] !== 0) {
      throw new ValidationError({
        message: `O campo '${field}' é obrigatório`,
        action: `Forneça um valor válido para o campo '${field}'`,
      });
    }
  }

  if (listingInputValues.price < 0) {
    throw new ValidationError({
      message: "O preço não pode ser negativo",
      action: "Forneça um preço válido (maior ou igual a zero)",
    });
  }

  if (listingInputValues.quantity && listingInputValues.quantity < 0) {
    throw new ValidationError({
      message: "A quantidade não pode ser negativa",
      action: "Forneça uma quantidade válida (maior ou igual a zero)",
    });
  }
}

async function validateUserExists(userId) {
  const results = await database.query({
    text: "SELECT id FROM users WHERE id = $1;",
    values: [userId],
  });

  if (results.rowCount === 0) {
    throw new ValidationError({
      message: "O usuário informado não existe no sistema",
      action: "Verifique se o ID do usuário está correto",
    });
  }
}

async function validateCategoryExists(categoryId) {
  const results = await database.query({
    text: "SELECT id FROM categories WHERE id = $1;",
    values: [categoryId],
  });

  if (results.rowCount === 0) {
    throw new ValidationError({
      message: "A categoria informada não existe no sistema",
      action: "Verifique se o ID da categoria está correto",
    });
  }
}

const listings = {
  findOneById,
  findByCategoryId,
  findAll,
  create,
  update,
  remove,
  validateUserExists,
  validateCategoryExists,
};

export default listings;