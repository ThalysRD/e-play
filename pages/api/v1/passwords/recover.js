import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import password from "models/password.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  try {
    const { email } = request.body;

    if (!email) {
      return response.status(400).json({
        message: "Email é obrigatório",
      });
    }

    // Enviar email com link de recuperação
    await password.sendRecoveryEmail(email);

    return response.status(200).json({
      message: "Email enviado com sucesso. Verifique sua caixa de entrada.",
    });
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}
