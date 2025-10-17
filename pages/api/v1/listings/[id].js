import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import listing from "models/listing.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  try {
    const { id } = request.query;

    const listingData = await listing.findOneById(id);

    return response.status(200).json(listingData);
  } catch (error) {
    return controller.errorHandler(error, request, response);
  }
}
