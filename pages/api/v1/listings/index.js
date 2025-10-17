import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import listing from "models/listing.js";
import listingImages from "models/listingImage";
import session from "models/session.js";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);
// router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);


async function getHandler(request, response) {
  try {
    const listings = await listing.findAll();
    return response.status(200).json(listings);
  } catch (error) {
    return controller.errorHandlers(error, request, response);
  }
}

async function postHandler(request, response) {
  const userInputValues = request.body;

  try {
    // 1) Verifica se o usuário está autenticado
    const sessionToken = request.cookies.session_id;
    if (!sessionToken) {
      return response.status(401).json({
        message: "Você precisa estar logado para criar um anúncio.",
      });
    }

    const userSession = await session.findOneValidByToken(sessionToken);

    // 2) Cria o listing com o userId da sessão
    const newListing = await listing.create({
      ...userInputValues,
      userId: userSession.user_id,
    });

    // 3) Recebe imagens (espera um array de URLs em `listing_images` ou `images`)
    //    Cada item pode ser string (url) ou objeto { image_url }
    const images = userInputValues.listing_images ?? userInputValues.images ?? [];

    let createdImages = [];
    if (Array.isArray(images) && images.length > 0) {
      // usa Promise.all para inserir em paralelo (cada insert calcula display_order)
      createdImages = await Promise.all(
        images.map((img) => {
          const imageUrl = typeof img === "string" ? img : img.image_url || img.url;
          return listingImages.create({
            listing_id: newListing.id,
            image_url: imageUrl,
          });
        })
      );
    }

    // 4) Resposta: listing + imagens criadas
    return response.status(201).json({
      ...newListing,
      images: createdImages,
      message: "Anúncio e imagens criados com sucesso",
    });
  } catch (error) {
    return controller.errorHandler(error, request, response);
  }
}