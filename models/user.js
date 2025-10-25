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

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);
  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: "SELECT * FROM users WHERE username = $1 LIMIT 1;",
      values: [username],
    });
    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "o nome de usuário informado não foi encontrado no sistema",
        action: "verifique se o nome de usuário está digitado corretamente",
      });
    }
    return results.rows[0];
  }
}

async function findOneByEmail(email) {
  const userFound = await runSelectQuery(email);
  return userFound;

  async function runSelectQuery(email) {
    const results = await database.query({
      text: "SELECT * FROM users WHERE email = $1 LIMIT 1;",
      values: [email],
    });
    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "o email informado não foi encontrado no sistema",
        action: "verifique se o email do usuário está digitado corretamente",
      });
    }
    return results.rows[0];
  }
}

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.username);
  await hashPasswordInObject(userInputValues);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function runInsertQuery(userInputValues) {
    const results = await database.query({
      text: "INSERT INTO users (name,username,email,password,permissions) VALUES ($1,$2,$3,$4,$5) RETURNING *;",
      values: [
        userInputValues.name,
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
        ["read:validate_token"],
      ],
    });
    return results.rows[0];
  }
}

async function update(userInputValues) {
  const currentUser = await findOneById(userInputValues.id);

  if ("username" in userInputValues) {
    await validateUniqueUsername(userInputValues.username);
  }

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }

  if ("password" in userInputValues) {
    await hashPasswordInObject(userInputValues);
  }

  const userWithNewValues = { ...currentUser, ...userInputValues };

  const updatedUser = await runUpdateQuery(userWithNewValues);
  return updatedUser;

  async function runUpdateQuery(userWithNewValues) {
    const results = await database.query({
      text: `
        UPDATE
          users
        SET
          username = $2,
          email = $3,
          password = $4,
          cpf = $5,
          cnpj = $6,
          address = $7,
          zip_code = $8,
          profile_image_url = $9,
          phone_number = $10,
          profile_bio = $11,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [
        userWithNewValues.id,
        userWithNewValues.username,
        userWithNewValues.email,
        userWithNewValues.password,
        userWithNewValues.cpf || null,
        userWithNewValues.cnpj || null,
        userInputValues.address || null,
        userWithNewValues.zipCode || null,
        userWithNewValues.profileImageUrl || null,
        userWithNewValues.phoneNumber || null,
        userWithNewValues.profileBio || null,
      ],
    });

    return results.rows[0];
  }
}

async function setPermissions(userId, permissions) {
  const updatedUser = await runUpdateQuery(userId, permissions);
  console.log(updatedUser);
  return updatedUser;
  async function runUpdateQuery(userId, permissions) {
    const results = await database.query({
      text: `
        UPDATE
          users
        SET
          permissions = $2,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [userId, permissions],
    });
    return results.rows[0];
  }
}

async function validateUniqueUsername(username) {
  const results = await database.query({
    text: `
      SELECT
        username
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      ;`,
    values: [username],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "Esse nome de usuário informado já está sendo utilizado.",
      action: "Utilize outro nome de usuário para realizar esta operação.",
    });
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
  findOneByUsername,
  create,
  validateUniqueEmail,
  validateUniqueUsername,
  findOneByEmail,
  update,
  setPermissions,
};

export default user;
