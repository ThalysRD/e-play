import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import session from "models/session.js";
import cart from "models/cart.js";
import cartItems from "models/cart_items.js";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);
router.patch(patchHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
    try {
        const userId = await requireUserId(request);
        const cartWithItems = await cart.getWithItemsByUserId(userId).catch(async (e) => {
            if (e?.name === "NotFoundError") {
                await cart.createForUser(userId);
                return await cart.getWithItemsByUserId(userId);
            }
            throw e;
        });
        return response.status(200).json(cartWithItems);
    } catch (error) {
        return controller.errorHandlers.onError(error, request, response);
    }
}

async function postHandler(request, response) {
    try {
        const userId = await requireUserId(request);
        const { listingId, quantity = 1, priceLocked = null } = request.body || {};
        if (!listingId) {
            return response.status(400).json({ error: "listingId é obrigatório" });
        }
        await cart.addItemForUser(
            userId,
            listingId,
            Number(quantity) || 1,
            priceLocked ?? null
        );
        // Retornar apenas o item adicionado em vez do carrinho completo
        const c = await cart.getOrCreateByUserId(userId);
        const cartItem = await cartItems.getItemByListingId(c.id, listingId);
        return response.status(200).json({ success: true, item: cartItem });
    } catch (error) {
        return controller.errorHandlers.onError(error, request, response);
    }
}

async function patchHandler(request, response) {
    try {
        const userId = await requireUserId(request);
        const { listingId, quantity } = request.body || {};
        if (!listingId) {
            return response.status(400).json({ error: "listingId é obrigatório" });
        }
        if (quantity === undefined || quantity === null) {
            return response.status(400).json({ error: "quantity é obrigatório" });
        }
        const c = await cart.getOrCreateByUserId(userId);
        await cartItems.setItemQuantity(c.id, listingId, Number(quantity));
        // Retornar apenas o item atualizado em vez do carrinho completo
        const cartItem = await cartItems.getItemByListingId(c.id, listingId);
        return response.status(200).json({ success: true, item: cartItem });
    } catch (error) {
        return controller.errorHandlers.onError(error, request, response);
    }
}

async function deleteHandler(request, response) {
    try {
        const userId = await requireUserId(request);
        const { listingId } = request.body || {};
        if (!listingId) {
            return response.status(400).json({ error: "listingId é obrigatório" });
        }
        const c = await cart.getOrCreateByUserId(userId);
        await cartItems.removeItem(c.id, listingId);
        // Retornar apenas confirmação em vez do carrinho completo
        return response.status(200).json({ success: true, itemRemoved: listingId });
    } catch (error) {
        return controller.errorHandlers.onError(error, request, response);
    }
}

async function requireUserId(request) {
    const sessionId = request.cookies.session_id;
    if (!sessionId) {
        const err = new Error("Não autenticado");
        err.status = 401;
        throw err;
    }
    const userSession = await session.findOneValidByToken(sessionId);
    if (!userSession) {
        const err = new Error("Sessão inválida");
        err.status = 401;
        throw err;
    }
    return userSession.user_id;
}
