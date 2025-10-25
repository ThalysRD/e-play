import bcryptjs from "bcryptjs";
import database from "infra/database.js";
import email from "infra/email.js";
import user from "models/user.js";
import webserver from "infra/webserver.js";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutos

async function hash(password) {
  const rounds = getNumberOfRounds();
  return await bcryptjs.hash(password, rounds);
}

function getNumberOfRounds() {
  return process.env.NODE_ENV === "production" ? 14 : 1;
}

async function compare(providedPassword, storedPassword) {
  return await bcryptjs.compare(providedPassword, storedPassword);
}

async function sendRecoveryEmail(userEmail) {
  // Verificar se usuário existe
  const foundUser = await user.findOneByEmail(userEmail);
  if (!foundUser) {
    throw new Error("Email não encontrado no sistema");
  }

  // Criar token de recuperação
  const token = await createRecoveryToken(foundUser.id);

  // URL para resetar senha
  const resetUrl = `${webserver.origin}/recuperar-senha/resetar/${token.id}`;

  // Enviar email com link
  await email.send({
    from: "E-Play <contato@lojaeplay.com.br>",
    to: foundUser.email,
    subject: "Recuperar sua senha no E-Play 🔐",
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
              <h2 style="color: #3c1053; font-size: 20px; margin-top: 0;">Recuperar sua senha</h2>
              
              <p style="color: #666; font-size: 16px; margin: 20px 0;">
                Oi <strong>${foundUser.username}</strong>! 👋
              </p>

              <p style="color: #666; font-size: 16px; margin: 20px 0;">
                Recebemos uma solicitação para resetar sua senha no <strong>E-Play</strong>. Se você fez essa solicitação, clique no botão abaixo para definir uma nova senha:
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: #ec4079; color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background 0.2s;">
                  Resetar senha
                </a>
              </div>
              
              <p style="color: #999; font-size: 14px; text-align: center; margin: 20px 0;">
                Ou copie e cole este link no seu navegador:
              </p>
              
              <p style="background: #f9f9f9; padding: 15px; border-radius: 6px; word-break: break-all; font-size: 13px; color: #666;">
                ${resetUrl}
              </p>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="color: #856404; font-size: 14px; margin: 0;">
                  ⏱️ <strong>Este link expira em 15 minutos</strong>
                </p>
              </div>
              
              <p style="color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                Se você não solicitou uma recuperação de senha, ignore este email ou <a href="mailto:contato@lojaeplay.com.br" style="color: #ec4079; text-decoration: none;">entre em contato conosco</a>.
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

  return token;
}

async function createRecoveryToken(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const results = await database.query({
    text: `
      INSERT INTO password_recovery_tokens (user_id, expires_at)
      VALUES ($1, $2)
      RETURNING *
    `,
    values: [userId, expiresAt],
  });

  return results.rows[0];
}

async function resetPasswordWithToken(tokenId, newPassword) {
  // Verificar se token existe e é válido
  const token = await findValidRecoveryToken(tokenId);
  if (!token) {
    throw new Error("Token inválido ou expirado");
  }

  // Buscar usuário para comparar com senha anterior
  const userResult = await database.query({
    text: `SELECT password FROM users WHERE id = $1`,
    values: [token.user_id],
  });

  const currentUser = userResult.rows[0];
  if (!currentUser) {
    throw new Error("Usuário não encontrado");
  }

  // Verificar se a nova senha é diferente da anterior
  const isSamePassword = await compare(newPassword, currentUser.password);
  if (isSamePassword) {
    throw new Error("A nova senha deve ser diferente da anterior");
  }

  // Hash da nova senha
  const hashedPassword = await hash(newPassword);

  // Atualizar senha do usuário
  const results = await database.query({
    text: `
      UPDATE users
      SET password = $2, updated_at = timezone('utc', now())
      WHERE id = $1
      RETURNING id, email, username
    `,
    values: [token.user_id, hashedPassword],
  });

  const updatedUser = results.rows[0];

  // Marcar token como usado
  await markRecoveryTokenUsed(tokenId);

  return updatedUser;
}

async function findValidRecoveryToken(tokenId) {
  const results = await database.query({
    text: `
      SELECT *
      FROM password_recovery_tokens
      WHERE id = $1
        AND expires_at > NOW()
        AND used_at IS NULL
      LIMIT 1
    `,
    values: [tokenId],
  });

  return results.rows[0];
}

async function markRecoveryTokenUsed(tokenId) {
  await database.query({
    text: `
      UPDATE password_recovery_tokens
      SET used_at = timezone('utc', now()), updated_at = timezone('utc', now())
      WHERE id = $1
    `,
    values: [tokenId],
  });
}

const passwordModel = {
  hash,
  compare,
  sendRecoveryEmail,
  resetPasswordWithToken,
  createRecoveryToken,
  findValidRecoveryToken,
  markRecoveryTokenUsed,
};

export default passwordModel;
