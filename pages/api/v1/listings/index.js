import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import listing from "models/listing.js";

const router = createRouter();

router.post(postHandler);
// router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);


async function postHandler(request, response) {

  const userInputValues = request.body

  const newListing = await listing.create(userInputValues)

  return response.status(200).json(newListing)
}