import { ValidationError, NotFoundError } from "infra/errors";
import database from "../infra/database";
import password from "./password";

async function findOneById(id) {
  const userFound = await runSelectQuery(id);
  return userFound;

  async function runSelectQuery(id) {
    const results = await database.query({
      text: "SELECT * FROM users WHERE user_id = $1 LIMIT 1;",
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

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueCpf(userInputValues.cpf);
  await validateUniqueCnpj(userInputValues.cnpj);
  validateCpfOrCnpj(userInputValues); // Remove await pois a função é síncrona
  await hashPasswordInObject(userInputValues);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function runInsertQuery(userInputValues) {
    const results = await database.query({
      text: "INSERT INTO users (name,username,email,password_hash,role,cpf,cnpj,address,zip_code) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *;",
      values: [
        userInputValues.name,
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
        userInputValues.role || "user",
        userInputValues.cpf || null,
        userInputValues.cnpj || null,
        userInputValues.address || null,
        userInputValues.zip_code || null,
      ],
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
      message: "O username informado já está sendo utilizado.",
      action: "Utilize outro username para realizar esta operação.",
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

async function validateUniqueCpf(cpf) {
  if (!cpf) return; // Se CPF não foi fornecido, não precisa validar unicidade

  const results = await database.query({
    text: "SELECT cpf FROM users WHERE cpf = $1;",
    values: [cpf],
  });
  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O CPF informado já foi cadastrado por outro usuário.",
      action: "Informe um CPF válido para realizar essa operação.",
    });
  }
}

async function validateUniqueCnpj(cnpj) {
  if (!cnpj) return; // Se CNPJ não foi fornecido, não precisa validar unicidade

  const results = await database.query({
    text: "SELECT cnpj FROM users WHERE cnpj = $1;",
    values: [cnpj],
  });
  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O CNPJ informado já foi cadastrado por outro usuário.",
      action: "Informe um CNPJ válido para realizar essa operação.",
    });
  }
}

// Cache para evitar revalidações desnecessárias
const validationCache = new Map();

function validateCpfOrCnpj(userInputValues) {
  const { cpf, cnpj } = userInputValues;

  // Pelo menos um documento deve ser fornecido
  if (!cpf && !cnpj) {
    throw new ValidationError({
      message: "É obrigatório informar CPF ou CNPJ.",
      action:
        "Informe um CPF válido ou um CNPJ válido para realizar o cadastro.",
    });
  }

  // Se CPF foi fornecido, validar formato e dígitos verificadores
  if (cpf) {
    // Verifica cache primeiro
    const cacheKey = `cpf_${cpf}`;
    if (validationCache.has(cacheKey)) {
      if (!validationCache.get(cacheKey)) {
        throw new ValidationError({
          message: "O CPF informado não é válido.",
          action:
            "Informe um CPF válido no formato 000.000.000-00 ou apenas números.",
        });
      }
    } else {
      const isValid = isValidCpf(cpf);
      validationCache.set(cacheKey, isValid);
      if (!isValid) {
        throw new ValidationError({
          message: "O CPF informado não é válido.",
          action:
            "Informe um CPF válido no formato 000.000.000-00 ou apenas números.",
        });
      }
    }
  }

  // Se CNPJ foi fornecido, validar formato e dígitos verificadores
  if (cnpj) {
    // Verifica cache primeiro
    const cacheKey = `cnpj_${cnpj}`;
    if (validationCache.has(cacheKey)) {
      if (!validationCache.get(cacheKey)) {
        throw new ValidationError({
          message: "O CNPJ informado não é válido.",
          action:
            "Informe um CNPJ válido no formato 00.000.000/0000-00 ou apenas números.",
        });
      }
    } else {
      const isValid = isValidCnpj(cnpj);
      validationCache.set(cacheKey, isValid);
      if (!isValid) {
        throw new ValidationError({
          message: "O CNPJ informado não é válido.",
          action:
            "Informe um CNPJ válido no formato 00.000.000/0000-00 ou apenas números.",
        });
      }
    }
  }

  // Limpar cache se ficar muito grande (evitar memory leak)
  if (validationCache.size > 1000) {
    validationCache.clear();
  }
}

function isValidCpf(cpf) {
  // Remove caracteres não numéricos
  const cleanCpf = cpf.replace(/[^\d]/g, "");

  // Verificações rápidas para casos inválidos
  if (cleanCpf.length !== 11 || /^(\d)\1+$/.test(cleanCpf)) {
    return false;
  }

  // Validação otimizada dos dígitos verificadores
  let sum = 0;
  let weight = 10;

  // Primeiro dígito verificador
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf[i]) * weight--;
  }
  let digit1 = ((sum * 10) % 11) % 10;

  if (digit1 !== parseInt(cleanCpf[9])) return false;

  // Segundo dígito verificador
  sum = 0;
  weight = 11;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf[i]) * weight--;
  }
  let digit2 = ((sum * 10) % 11) % 10;

  return digit2 === parseInt(cleanCpf[10]);
}

function isValidCnpj(cnpj) {
  // Remove caracteres não numéricos
  const cleanCnpj = cnpj.replace(/[^\d]/g, "");

  // Verificações rápidas para casos inválidos
  if (cleanCnpj.length !== 14 || /^(\d)\1+$/.test(cleanCnpj)) {
    return false;
  }

  // Validação otimizada dos dígitos verificadores
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  // Primeiro dígito
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCnpj[i]) * weights1[i];
  }
  let digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  if (digit1 !== parseInt(cleanCnpj[12])) return false;

  // Segundo dígito
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCnpj[i]) * weights2[i];
  }
  let digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  return digit2 === parseInt(cleanCnpj[13]);
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
  validateUniqueCpf,
  validateUniqueCnpj,
  validateCpfOrCnpj,
  isValidCpf,
  isValidCnpj,
};

export default user;
