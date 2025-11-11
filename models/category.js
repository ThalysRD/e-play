import { ValidationError } from "infra/errors"; // Importando o erro de validação
import database from "../infra/database"; // Importando a conexão do banco


async function create(categoryInput) {
  // 1. Primeiro, validamos se essa categoria já existe para não criar duplicados
  await validateUniqueCategoryName(categoryInput.name);

  // 2. Se a validação passar (não lançar erro), executamos a query de inserção
  const results = await runInsertQuery(categoryInput.name);
  return results;

  async function runInsertQuery(name) {
    const results = await database.query({
      text: "INSERT INTO categorias (name) VALUES ($1) RETURNING *;",
      values: [name],
    });
    // RETURNING * faz o banco retornar a linha que acabou de ser inserida
    return results.rows[0];
  }
}


async function findAllCategories() {
  const results = await database.query({
    text: "SELECT * FROM categorias ORDER BY name ASC;", // Query que lista tudo, ordenado por nome
  });

  // Retorna todas as linhas encontradas. Se a tabela estiver vazia, retorna []
  return results.rows;
}


async function validateUniqueCategoryName(name) {
  const results = await database.query({
    text: "SELECT name FROM categorias WHERE LOWER(name) = LOWER($1);",
    values: [name],
  });

  // Se a contagem de linhas for > 0, o nome já existe
  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O nome dessa categoria já está em uso.",
      action: "Utilize outro nome para criar a categoria.",
    });
  }
}

// Exporta um objeto 'category' com as funções que podem ser usadas por outros arquivos
const category = {
  create,
  findAllCategories,
};

export default category;