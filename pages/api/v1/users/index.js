import { createRouter } from "next-connect";
import user from "models/user.js";
import controller from "infra/controller.js";
import activation from "models/activation";

const router = createRouter();

router.post(postHandler);
router.patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputValues = request.body;

  const newUser = await user.create(userInputValues);
  const activationToken = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationToken);

  return response.status(201).json(newUser);
}

async function patchHandler(request, response) {
  const userInputValues = request.body;

  const updatedUser = await user.update(userInputValues);

  return response.status(200).json(updatedUser);
}
