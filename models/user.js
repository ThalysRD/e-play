import { ValidationError, NotFoundError } from "infra/errors";
import database from "../infra/database";
import password from "./password";

async function findOneById(id) {
  const userFound = await runSelectQuery(id);
  return userFound;

  async function runSelectQuery(id) {
    const results = await database.query({
      text: "SELECT * FROM users WHERE id = $1 LIMIT 1;",
      values: [id],
    });
    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "o ID informado não foi encontrado no sistema",
        action: "verifique se o id está digitado corretamente",
      });
    }
    return results.rows[0];
  }
}

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues.email);
  await hashPasswordInObject(userInputValues);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function runInsertQuery(userInputValues) {
    const results = await database.query({
      text: "INSERT INTO users (name,email,password_hash,role,cpf_cnpj) VALUES ($1,$2,$3,'user',$4) RETURNING *;",
      values: [
        userInputValues.name,
        userInputValues.email,
        userInputValues.password,
        userInputValues.cpf,
      ],
    });
    return results.rows[0];
  }
}

async function validateUniqueEmail(email) {
  const results = await database.query({
    text: "SELECT email FROM users WHERE LOWER(email)=LOWER($1);",
    values: [email],
  });
  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O email informado já está sendo utilizado.",
      action: "Utilize outro e-mail para realizar essa operação.",
    });
  }
}

async function hashPasswordInObject(userInputValues) {
  const hashedPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashedPassword;
}
const user = {
  findOneById,
  create,
};

export default user;
