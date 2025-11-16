import nc from "next-connect";
import user from "../../../../models/user";
import session from "../../../../models/session";
import { validate } from "../../../../infra/controller";
import authentication from "../../../../models/authentication";

const patchHandler = async (req, res) => {
  try {
    const { profile_image_url } = req.body;
    const userToken = req.cookies.session_id;
    const userSession = await session.findOne(userToken);

    if (!userSession) {
      return res.status(401).json({
        error: {
          message: "Usuário não autenticado.",
        },
      });
    }

    const updatedUser = await user.update({
      id: userSession.user_id,
      profile_image_url,
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in patchHandler:", error);
    res.status(500).json({
      error: {
        message: "Ocorreu um erro ao atualizar a foto de perfil.",
        details: error.message,
      },
    });
  }
};

const apiRoute = nc({
  onError: (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).end("Something broke!");
  },
  onNoMatch: (req, res) => {
    res.status(405).end("Method Not Allowed");
  },
})
  .use(authentication.injectUser)
  .patch(validate(patchHandler));

export default apiRoute;
