import database from "infra/database.js";
import { ValidationError, InternalServerError } from "infra/errors.js";

async function create(userInputValues) {

  if (!userInputValues) {
    throw new ValidationError({
      message: "Dados da imagem são obrigatórios",
      action: "Forneça listingId e imageUrl",
    });
  }

  const listingId = userInputValues.listingId ?? userInputValues.listing_id;
  const imageUrl = userInputValues.imageUrl ?? userInputValues.image_url;

  if (!listingId) {
    throw new ValidationError({
      message: "listingId é obrigatório",
      action: "Forneça o id do anúncio ao adicionar uma imagem",
    });
  }

  if (!imageUrl) {
    throw new ValidationError({
      message: "imageUrl é obrigatório",
      action: "Forneça a URL da imagem",
    });
  }


  try {
    const imageCreated = await runInsertQuery(listingId, imageUrl)
    return imageCreated
    async function runInsertQuery(listingId, imageUrl) {
      const results = await database.query({
        text: `
        INSERT INTO listing_images (
          listing_id,
          image_url,
          display_order,
          created_at,
          updated_at
        ) VALUES (
          $1,
          $2,
          (
            SELECT COALESCE(MAX(display_order), -1) + 1
            FROM listing_images
            WHERE listing_id = $1
          ),
          timezone('utc', now()),
          timezone('utc', now())
        )
        RETURNING *;
      `,
        values: [listingId, imageUrl],
      });

      return results.rows[0];
    }
  } catch (error) {
    throw new InternalServerError({
      message: "Erro ao criar imagem do anúncio",
      action: "Tente novamente mais tarde",
      stack: error.stack,
      context: { listingId, imageUrl },
    });
  }
}

const listingImages = {
  create,
};

export default listingImages;