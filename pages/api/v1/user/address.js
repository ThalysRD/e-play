import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import session from "models/session.js";

const router = createRouter();

router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  try {
    const sessionToken = request.cookies.session_id;
    if (!sessionToken) {
      return response.status(401).json({
        message: "Você precisa estar logado para atualizar o endereço.",
      });
    }

    const userSession = await session.findOneValidByToken(sessionToken);
    const { 
      address_street,
      address_number,
      address_complement,
      address_neighborhood,
      address_city,
      address_state,
      address_zipcode 
    } = request.body;

    if (!address_street || !address_number || !address_neighborhood || !address_city || !address_state || !address_zipcode) {
      return response.status(400).json({
        message: "Rua, número, bairro, cidade, estado e CEP são obrigatórios.",
      });
    }

    const updatedUser = await user.updateAddress(userSession.user_id, {
      address_street,
      address_number,
      address_complement,
      address_neighborhood,
      address_city,
      address_state,
      address_zipcode,
    });

    return response.status(200).json({
      message: "Endereço atualizado com sucesso.",
      user: {
        address_street: updatedUser.address_street,
        address_number: updatedUser.address_number,
        address_complement: updatedUser.address_complement,
        address_neighborhood: updatedUser.address_neighborhood,
        address_city: updatedUser.address_city,
        address_state: updatedUser.address_state,
        address_zipcode: updatedUser.address_zipcode,
      },
    });
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}
