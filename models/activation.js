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
  const activationUrl = `${webserver.origin}/cadastro/ativar/${activationToken.id}`;

  await email.send({
    from: "E-Play <contato@lojaeplay.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no E-Play! 🎮",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3c1053 0%, #000428 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🎮 E-Play</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #3c1053; font-size: 20px; margin-top: 0;">Bem-vindo, ${user.username}!</h2>
              
              <p style="color: #666; font-size: 16px; margin: 20px 0;">
                Obrigado por se cadastrar no <strong>E-Play</strong>! Para finalizar seu cadastro e começar a comprar e vender, clique no botão abaixo:
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${activationUrl}" style="display: inline-block; background: #ec4079; color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background 0.2s;">
                  Ativar minha conta
                </a>
              </div>
              
              <p style="color: #999; font-size: 14px; text-align: center; margin: 20px 0;">
                Ou copie e cole este link no seu navegador:
              </p>
              
              <p style="background: #f9f9f9; padding: 15px; border-radius: 6px; word-break: break-all; font-size: 13px; color: #666;">
                ${activationUrl}
              </p>
              
              <p style="color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                ⏱️ <strong>Este link expira em 15 minutos</strong>
              </p>
              
              <p style="color: #999; font-size: 12px; margin-top: 10px;">
                Se você não se cadastrou, ignore este email.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                E-Play © 2025 | Todos os direitos reservados
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

async function findExpiredToken(tokenId) {
  const results = await database.query({
    text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        id = $1
        AND used_at IS NULL
      LIMIT
        1
    ;`,
    values: [tokenId],
  });
  return results.rows[0];
}

const activation = {
  create,
  sendEmailToUser,
  findOneyValidById,
  findExpiredToken,
  markTokenUsed,
  activateUserByUserId,
};

export default activation;
