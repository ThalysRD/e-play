import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import session from "models/session.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  try {
    const { id } = request.query;
    
    const sessionToken = request.cookies.session_id;
    if (!sessionToken) {
      return response.status(401).json({
        message: "Você precisa estar logado.",
      });
    }

    const sessionObject = await session.findOneValidByToken(sessionToken);
    
    // Buscar usuário
    const userFound = await user.findOneById(id);

    if (!userFound) {
      return response.status(404).json({
        message: "Usuário não encontrado.",
      });
    }

    // Retornar apenas dados públicos necessários (sem informações sensíveis)
    const safeUserData = {
      id: userFound.id,
      name: userFound.name,
      username: userFound.username,
      address_street: userFound.address_street,
      address_number: userFound.address_number,
      address_complement: userFound.address_complement,
      address_neighborhood: userFound.address_neighborhood,
      address_city: userFound.address_city,
      address_state: userFound.address_state,
      address_zipcode: userFound.address_zipcode,
    };

    return response.status(200).json(safeUserData);
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}
