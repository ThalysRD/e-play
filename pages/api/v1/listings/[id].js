import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import listing from "models/listing.js";

const router = createRouter();

router.get(getHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  try {
    const { id } = request.query;

    const listingData = await listing.findOneById(id);

    return response.status(200).json(listingData);
  } catch (error) {
    return controller.errorHandlers(error, request, response);
  }
}

async function deleteHandler(request, response) {
  try {
    const { id } = request.query;
    const sessionId = request.cookies.session_id;

    if (!sessionId) {
      return response.status(401).json({ error: "Não autenticado" });
    }

    const listingData = await listing.findOneById(id);
    if (!listingData) {
      return response.status(404).json({ error: "Anúncio não encontrado" });
    }

    await listing.deleteById(id);

    return response.status(200).json({ success: true, message: "Anúncio deletado com sucesso" });
  } catch (error) {
    return controller.errorHandlers(error, request, response);
  }
}
