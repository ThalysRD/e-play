import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.DOCUMENT_ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
const IV_LENGTH = 16;

function getKey() {
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), "hex");
  return key;
}

async function encrypt(document) {
  const cleanDocument = document.replace(/\D/g, "");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(cleanDocument, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

async function decrypt(encryptedDocument) {
  if (!encryptedDocument) return "";
  const parts = encryptedDocument.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function formatCPF(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatCNPJ(cnpj) {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

async function formatForDisplay(encryptedDocument, type) {
  const decrypted = await decrypt(encryptedDocument);
  if (!decrypted) return "";
  
  if (type === "cpf" || decrypted.length === 11) {
    return formatCPF(decrypted);
  } else if (type === "cnpj" || decrypted.length === 14) {
    return formatCNPJ(decrypted);
  }
  return decrypted;
}

const document = {
  encrypt,
  decrypt,
  formatForDisplay,
};

export default document;
