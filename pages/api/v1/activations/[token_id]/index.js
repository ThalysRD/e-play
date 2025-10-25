import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import activation from "models/activation.js";
import session from "models/session.js";
import user from "models/user.js";
import * as cookie from "cookie";

const router = createRouter();

router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  try {
    const activationTokenId = request.query.token_id;

    if (!activationTokenId) {
      return response.status(400).json({
        message: "Token de ativação é obrigatório",
      });
    }

    const validActivationToken = await activation.findOneyValidById(activationTokenId);

    if (!validActivationToken) {
      // Token inválido ou expirado - buscar usuário e enviar novo token
      try {
        // Tentar buscar o token expirado para obter o user_id
        const expiredToken = await activation.findExpiredToken(activationTokenId);

        if (expiredToken) {
          // Token existe mas expirou - enviar novo
          const userData = await user.findOneById(expiredToken.user_id);
          const newToken = await activation.create(expiredToken.user_id);
          await activation.sendEmailToUser(userData, newToken);

          return response.status(400).json({
            message: "Seu token expirou, mas enviamos um novo link para seu email!",
            tokenExpired: true,
          });
        }
      } catch (err) {
        // Token não existe ou erro ao buscar
      }

      return response.status(400).json({
        message: "Token inválido ou expirado",
      });
    }

    await activation.markTokenUsed(activationTokenId);
    await activation.activateUserByUserId(validActivationToken.user_id);
    const newSession = await session.create(validActivationToken.user_id)

    const setCookie = cookie.serialize("session_id", newSession.token, {
      path: "/",
      maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });
    response.setHeader("Set-Cookie", setCookie);

    return response.status(200).json({
      message: "Conta ativada com sucesso!",
    });
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}
