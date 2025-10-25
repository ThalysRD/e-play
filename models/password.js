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

  // Enviar email com link
  await email.send({
    from: "E-Play <contato@lojaeplay.com.br>",
    to: foundUser.email,
    subject: "Recuperar sua senha no E-Play",
    text: `${foundUser.username}, clique no link abaixo para resetar sua senha:

${webserver.origin}/recuperar-senha/resetar/${token.id}

Este link expira em 15 minutos.
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
