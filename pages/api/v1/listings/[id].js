import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import listing from "models/listing.js";
import session from "models/session.js";

const router = createRouter();

router.get(getHandler);
router.patch(patchHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  try {
    const { id } = request.query;

    const listingData = await listing.findOneById(id);
    const images = await listing.findImagesById(id);

    return response.status(200).json({
      ...listingData,
      images,
    });
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}

async function patchHandler(request, response) {
  try {
    const { id } = request.query;
    const sessionId = request.cookies.session_id;

    if (!sessionId) {
      return response.status(401).json({ error: "Não autenticado" });
    }

    const userSession = await session.findOneValidByToken(sessionId);
    if (!userSession) {
      return response.status(401).json({ error: "Sessão inválida" });
    }

    const existingListing = await listing.findOneById(id);
    if (!existingListing) {
      return response.status(404).json({ error: "Anúncio não encontrado" });
    }

    if (existingListing.user_id !== userSession.user_id) {
      return response
        .status(403)
        .json({ error: "Você não tem permissão para editar este anúncio" });
    }

    const finalImages = request.body.images || [];
    if (finalImages.length === 0) {
      return response
        .status(400)
        .json({ error: "O anúncio deve ter pelo menos 1 imagem" });
    }

    const finalImages = request.body.images || [];
    if (finalImages.length === 0) {
      return response.status(400).json({ error: "O anúncio deve ter pelo menos 1 imagem" });
    }

    const updatedListing = await listing.updateById(id, request.body);

    const images = await listing.findImagesById(id);

    return response.status(200).json({
      ...updatedListing,
      images,
    });
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
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

    return response
      .status(200)
      .json({ success: true, message: "Anúncio deletado com sucesso" });
  } catch (error) {
    return controller.errorHandlers.onError(error, request, response);
  }
}
