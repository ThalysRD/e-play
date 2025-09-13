import database from "../infra/database";

async function findOneById(id) {
  const userFound = await runSelectQuery(id);
  return userFound;

  async function runSelectQuery(id) {
    const results = await database.query({
      text: "SELECT * FROM users WHERE id = $1 LIMIT 1;",
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

const user = {
  findOneById,
};

export default user;
