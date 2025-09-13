import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

test("POST no endpoint /api/v1/status/ deve retorna 405", async () => {
  const response = await fetch("http:/localhost:3000/api/v1/status", {
    method: "POST",
  });
  expect(response.status).toBe(405);

  const responseBody = await response.json();
  expect(responseBody).toEqual({
    name: "MethodNotAllowedError",
    message: "Método não permitido para este endpoint.",
    action: "Verifique se o método HTTP enviado é valido para este endpoint.",
    status_code: 405,
  });
});
