import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import session from "models/session.js";
import user from "models/user.js";

const router = createRouter();

router.patch(patchHandler);

export default router.handler(controller.errorHandlers);
async function patchHandler(request, response) {
    try {
        const { listingId } = request.body;
        if (!listingId) {
            return response.status(400).json({ error: "listingId é obrigatório" });
        }

        const sessionId = request.cookies.session_id;
        if (!sessionId) {
            return response.status(401).json({ error: "Não autenticado" });
        }

        const userSession = await session.findOneValidByToken(sessionId);
        if (!userSession) {
            return response.status(401).json({ error: "Sessão inválida" });
        }

        const currentUser = await user.findOneById(userSession.user_id);
        if (!currentUser) {
            return response.status(404).json({ error: "Usuário não encontrado" });
        }

        const currentWishlist = currentUser.wish_list || [];
        let newWishlist;

        if (currentWishlist.includes(listingId)) {
            newWishlist = currentWishlist.filter((id) => id !== listingId);
        } else {
            newWishlist = [...currentWishlist, listingId];
        }

        const updatedUser = await user.updateWishlist(currentUser.id, newWishlist);

        return response.status(200).json(updatedUser);
    } catch (error) {
        return controller.errorHandlers.onError(error, request, response);
    }
}