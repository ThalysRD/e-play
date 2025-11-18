import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import session from "models/session";
import document from "models/document.js";

const router = createRouter();

router.get(getHandler);
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const sessionToken = request.cookies.session_id;

  const sessionObject = await session.findOneValidByToken(sessionToken);
  const renewedSessionObject = await session.renew(sessionObject.id);
  controller.setSessionCookie(renewedSessionObject.token, response);

  const userFound = await user.findOneById(sessionObject.user_id);

  // Descriptografar e formatar CPF/CNPJ para exibição
  if (userFound.cpf) {
    userFound.cpf = await document.formatForDisplay(userFound.cpf, "cpf");
  }
  if (userFound.cnpj) {
    userFound.cnpj = await document.formatForDisplay(userFound.cnpj, "cnpj");
  }

  // Remover senha do retorno
  delete userFound.password;

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  return response.status(200).json(userFound);
}

async function patchHandler(request, response) {
  const sessionToken = request.cookies.session_id;

  if (!sessionToken) {
    return response.status(401).json({
      message: "Você precisa estar logado.",
    });
  }

  const sessionObject = await session.findOneValidByToken(sessionToken);
  
  const {
    address_street,
    address_number,
    address_complement,
    address_neighborhood,
    address_city,
    address_state,
    address_zipcode,
  } = request.body;

  const updatedUser = await user.updateAddress(sessionObject.user_id, {
    address_street,
    address_number,
    address_complement,
    address_neighborhood,
    address_city,
    address_state,
    address_zipcode,
  });

  return response.status(200).json(updatedUser);
}
