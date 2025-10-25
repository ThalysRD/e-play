import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import password from "models/password.js";

const router = createRouter();

router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  try {
    const { tokenId } = request.query;
    const { newPassword } = request.body;

    if (!tokenId) {
      return response.status(400).json({
        message: "Token é obrigatório",
      });
    }

    if (!newPassword) {
      return response.status(400).json({
        message: "Nova senha é obrigatória",
      });
    }

    // Resetar a senha com o token
    const result = await password.resetPasswordWithToken(tokenId, newPassword);

    return response.status(200).json({
      message: "Senha resetada com sucesso!",
      user: {
        id: result.id,
        email: result.email,
      },
    });
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}
