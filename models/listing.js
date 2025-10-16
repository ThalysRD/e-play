import { ValidationError, NotFoundError } from "infra/errors.js";
import database from "../infra/database.js";
import user from "./user.js"

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

const listing = {
  create
}


export default listing