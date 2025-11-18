import { ValidationError, NotFoundError } from "infra/errors";
import database from "../infra/database";
import password from "./password";
import document from "./document";

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

async function findOneWithListingsByUsername(username) {
  const userFound = await runSelectQuery(username);
  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
        SELECT
          u.*,
          COALESCE(
            (
              SELECT json_agg(listing_with_images ORDER BY listing_with_images.created_at DESC)
              FROM (
                SELECT
                  l.*,
                  (
                    SELECT COALESCE(
                      json_agg(
                        json_build_object(
                          'id', li.id,
                          'image_url', li.image_url,
                          'display_order', li.display_order
                        ) ORDER BY li.display_order
                      ), '[]'::json
                    )
                    FROM listing_images li
                    WHERE li.listing_id = l.id
                  ) as images
                FROM listings l
                WHERE l.user_id = u.id
              ) as listing_with_images
            ), '[]'::json
          ) as listings
        FROM
          users u
        WHERE
          u.username = $1
        LIMIT 1;
      `,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O nome de usuário informado não foi encontrado no sistema",
        action: "Verifique se o nome de usuário está correto",
      });
    }
    return results.rows[0];
  }
}

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.username);
  await hashPasswordInObject(userInputValues);
  await hashDocumentsInObject(userInputValues);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function runInsertQuery(userInputValues) {
    const results = await database.query({
      text: "INSERT INTO users (name,username,email,password,cpf,cnpj,permissions) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *;",
      values: [
        userInputValues.name,
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
        userInputValues.cpf || null,
        userInputValues.cnpj || null,
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

  if ("cpf" in userInputValues || "cnpj" in userInputValues) {
    await hashDocumentsInObject(userInputValues);
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
          profile_image_url = $7,
          phone_number = $8,
          profile_bio = $9,
          name = $10,
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
        userWithNewValues.profile_image_url || null,
        userWithNewValues.phone_number || null,
        userWithNewValues.profile_bio || null,
        userWithNewValues.name || null,
      ],
    });

    return results.rows[0];
  }
}

async function setPermissions(userId, permissions) {
  const updatedUser = await runUpdateQuery(userId, permissions);
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
      action: "Você pode tentar fazer login ou recuperar sua senha.",
    });
  }
}

async function updateWishlist(userId, wishList) {
  const results = await database.query({
    text: `
      UPDATE
        users
      SET
        wish_list = $2,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        wish_list
    ;`,
    values: [userId, wishList || []],
  });
  return results.rows[0];
}

async function hashPasswordInObject(userInputValues) {
  const hashedPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashedPassword;
}

async function hashDocumentsInObject(userInputValues) {
  if (userInputValues.cpf) {
    const encryptedCpf = await document.encrypt(userInputValues.cpf);
    userInputValues.cpf = encryptedCpf;
  }
  if (userInputValues.cnpj) {
    const encryptedCnpj = await document.encrypt(userInputValues.cnpj);
    userInputValues.cnpj = encryptedCnpj;
  }
}

async function updateAddress(userId, addressData) {
  if (!userId) {
    throw new ValidationError({
      message: "User ID é obrigatório",
      action: "Forneça um ID de usuário válido",
    });
  }

  const {
    address_street,
    address_number,
    address_complement,
    address_neighborhood,
    address_city,
    address_state,
    address_zipcode,
  } = addressData;

  const results = await database.query({
    text: `
      UPDATE users
      SET
        address_street = $2,
        address_number = $3,
        address_complement = $4,
        address_neighborhood = $5,
        address_city = $6,
        address_state = $7,
        address_zipcode = $8,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING *
    `,
    values: [
      userId,
      address_street,
      address_number,
      address_complement,
      address_neighborhood,
      address_city,
      address_state,
      address_zipcode,
    ],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Usuário não encontrado",
      action: "Verifique o ID do usuário e tente novamente",
    });
  }

  return results.rows[0];
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
  findOneWithListingsByUsername,
  updateWishlist,
  updateAddress,
};

export default user;
