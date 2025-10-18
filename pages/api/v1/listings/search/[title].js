import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import listing from "models/listing.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const { title } = request.query;

  if (!title || title.trim() === "") {
    return response.status(400).json({
      error: "Título é obrigatório"
    });
  }

  const listingsByTitle = await listing.findListingsByTitle(title);
  return response.status(200).json(listingsByTitle);
}
