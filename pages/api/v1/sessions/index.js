import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import session from "models/session.js";
import activation from "models/activation.js";
import user from "models/user.js";
import * as cookie from "cookie";

const router = createRouter();

router.post(postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputValues = request.body;
  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  if (!authenticatedUser.permissions.includes("create:sessions")) {
    const newActivationToken = await activation.create(authenticatedUser.id);
    await activation.sendEmailToUser(authenticatedUser, newActivationToken);


    return response.status(403).json({
      message: "Você precisa confirmar seu email para fazer login. Um novo link de ativação foi enviado para seu email.",
    });
  }

  const newSession = await session.create(authenticatedUser.id);

  const setCookie = cookie.serialize("session_id", newSession.token, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  response.setHeader("Set-Cookie", setCookie);

  return response.status(201).json(newSession);
}

async function deleteHandler(request, response) {
  const sessionToken = request.cookies.session_id;

  const sessionObject = await session.findOneValidByToken(sessionToken);
  const expiredSession = await session.expireById(sessionObject.id);
  controller.clearSessionCookie(response);

  return response.status(200).json(expiredSession);
}
