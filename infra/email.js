import nodemailer from "nodemailer";
import { Resend } from "resend";

const provider = process.env.EMAIL_PROVIDER || "mailhog";

// Remetente configurável. Sem domínio próprio, use o endereço da conta SMTP
// (ex.: "E-Play <seuemail@gmail.com>"), senão o provedor recusa ou reescreve.
const defaultFrom = process.env.EMAIL_FROM;

let transporter;

if (provider === "resend") {
  // Usar Resend em produção
  const resend = new Resend(process.env.RESEND_API_KEY);
  transporter = {
    sendMail: async (options) => {
      try {
        const result = await resend.emails.send({
          from: options.from,
          to: options.to,
          subject: options.subject,
          html: options.html || options.text,
        });
        if (result.error) {
          throw new Error(result.error.message);
        }
        return result;
      } catch (error) {
        throw new Error(`Resend error: ${error.message}`);
      }
    },
  };
} else {
  // Usar MailHog em desenvolvimento
  // SMTP: MailCatcher/MailHog em desenvolvimento ou qualquer servidor SMTP em produção
  // (ex.: Gmail com senha de app em smtp.gmail.com:587).
  const port = Number(process.env.EMAIL_SMTP_PORT) || 1025;
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST || "localhost",
    port,
    auth: {
      user: process.env.EMAIL_SMTP_USER || "",
      pass: process.env.EMAIL_SMTP_PASSWORD || "",
    },
    // Porta 465 usa TLS direto; as demais (587, 1025) usam STARTTLS quando disponível.
    secure: port === 465,
  });
}

async function send(mailOptions) {
  try {
    await transporter.sendMail({
      ...mailOptions,
      from: defaultFrom || mailOptions.from,
    });
  } catch (error) {
    throw new Error(`Falha ao enviar email: ${error.message}`);
  }
}

const email = {
  send,
};

export default email;
