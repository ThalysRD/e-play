import nodemailer from "nodemailer";
import { Resend } from "resend";

const provider = process.env.EMAIL_PROVIDER || "mailhog";

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
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST || "localhost",
    port: process.env.EMAIL_SMTP_PORT || 1025,
    auth: {
      user: process.env.EMAIL_SMTP_USER || "",
      pass: process.env.EMAIL_SMTP_PASSWORD || "",
    },
    secure: false,
  });
}

async function send(mailOptions) {
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error(`Falha ao enviar email: ${error.message}`);
  }
}

const email = {
  send,
};

export default email;
