import email from "infra/email.js";
import crypto from "node:crypto";
import database from "infra/database.js";

async function createActivationToken(userId) {
  // Gera token único
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

  // // Salva o token no banco
  // await database.query({
  //   text: `
  //     UPDATE users 
  //     SET email_verification_token = $1, 
  //         email_verification_expires_at = $2,
  //         updated_at = NOW()
  //     WHERE id = $3
  //   `,
  //   values: [token, expiresAt, userId]
  // });

  return token;
}

async function sendEmailToUser(user) {
  try {
    // Cria token de ativação
    const activationToken = await createActivationToken(user.id);

    // Constrói o link de ativação
    const activationLink = `${process.env.NEXT_PUBLIC_SITE_URL}/api/v1/users/verify?token=${activationToken}&email=${encodeURIComponent(user.email)}`;

    await email.send({
      from: "E-Play <contato@eplay.com.br>",
      to: user.email,
      subject: "Ative seu cadastro no E-Play",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bem-vindo ao E-Play, ${user.name}!</h2>
          
          <p>Olá <strong>${user.username}</strong>,</p>
          
          <p>Obrigado por se cadastrar no E-Play.</p>
          
          <p>Para ativar seu cadastro, clique no link abaixo:</p>
          
          <a href="${activationLink}">Ativar cadastro</a>
          
          <p>Atenciosamente,<br>Equipe do E-Play</p>
        </div>
      `
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
  }
}

const activation = {
  sendEmailToUser
}

export default activation