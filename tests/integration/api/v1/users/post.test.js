import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import password from "models/password";
import status from "pages/api/v1/status";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Usuário anônimo", () => {
    test("Com dados únicos e válidos", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Teste da Silva",
          username: "teste123",
          email: "teste@teste.com",
          password: "senha123",
        }),
      });

      expect(response.status).toBe(201);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        name: "Teste da Silva",
        username: "teste123",
        email: "teste@teste.com",
        password: responseBody.password,
        role: "user",
        phone_number: null,
        profile_bio: null,
        sales_count: 0,
        seller_rating: "0.00",
        profile_image_url: null,
        status: "active",
        cpf: null,
        cnpj: null,
        address: null,
        zip_code: null,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername("teste123");
      const correctPasswordMatch = await password.compare(
        "senha123",
        userInDatabase.password, //
      );

      const incorrectPasswordMatch = await password.compare(
        "SenhaErrada",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
  });
});
