import email from "infra/email.js";
import database from "infra/database.js";
import user from "models/user.js";
import webserver from "infra/webserver.js";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000;

async function findOneyValidById(tokenId) {
  const activationTokenObject = await runSelectQuery(tokenId);

  return activationTokenObject;

  async function runSelectQuery(tokenId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          id = $1
          AND expires_at > NOW()
          AND used_at IS NULL
        LIMIT
          1
      ;`,
      values: [tokenId],
    });
    return results.rows[0];
  }
}

async function markTokenUsed(activationToken) {
  const usedActivationToken = await runUpdateQuery(activationToken);

  return usedActivationToken;

  async function runUpdateQuery(activationToken) {
    const results = await database.query({
      text: `
        UPDATE
          user_activation_tokens
        SET
          used_at = timezone('utc', now()),
          used = True,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [activationToken],
    });

    return results.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const activatedUser = await user.setPermissions(userId, ["create:session"]);
  return activatedUser;
}

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1,$2)
        RETURNING
          *
      ;`,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "E-Play <contato@lojaeplay.com.br>",
    to: user.email,
    suject: "Ative seu cadastro no E-Play!",
    text: `${user.username}, clique no link abaixo para finalizar seu cadastro no E-Play:
    
${webserver.origin}/cadastro/ativar/${activationToken.id}

    `,
  });
}

const activation = {
  create,
  sendEmailToUser,
  findOneyValidById,
  markTokenUsed,
  activateUserByUserId,
};

export default activation;
