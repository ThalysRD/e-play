import database from "infra/database.js";
import { NotFoundError, ValidationError } from "infra/errors";

async function findAllByProductId(productId) {
  const reviewsFound = await runSelectByProductQuery(productId);
  return reviewsFound;

  async function runSelectByProductQuery(productId) {
    const results = await database.query({
      text: `
        SELECT
          r.*,
          u.name as user_name,
          u.avatar_url as user_avatar
        FROM
          reviews r
        INNER JOIN
          users u ON r.user_id = u.id
        WHERE
          r.product_id = $1
          AND r.deleted_at IS NULL
        ORDER BY
          r.created_at DESC;`,
      values: [productId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Produto não possui avaliações.",
        action: "Este produto ainda não foi avaliado.",
      });
    }

    return results.rows;
  }
}

async function findAllByUserId(userId) {
  const reviewsFound = await runSelectByUserQuery(userId);
  return reviewsFound;

  async function runSelectByUserQuery(userId) {
    const results = await database.query({
      text: `
        SELECT
          r.*,
          p.name as product_name,
          p.image_url as product_image
        FROM
          reviews r
        INNER JOIN
          products p ON r.product_id = p.id
        WHERE
          r.user_id = $1
          AND r.deleted_at IS NULL
        ORDER BY
          r.created_at DESC;`,
      values: [userId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Usuário não possui avaliações.",
        action: "Você ainda não avaliou nenhum produto.",
      });
    }

    return results.rows;
  }
}

async function findOneById(reviewId) {
  const reviewFound = await runSelectOneQuery(reviewId);
  return reviewFound;

  async function runSelectOneQuery(reviewId) {
    const results = await database.query({
      text: `
        SELECT
          r.*,
          u.name as user_name,
          u.avatar_url as user_avatar,
          p.name as product_name
        FROM
          reviews r
        INNER JOIN
          users u ON r.user_id = u.id
        INNER JOIN
          products p ON r.product_id = p.id
        WHERE
          r.id = $1
          AND r.deleted_at IS NULL
        LIMIT 1;`,
      values: [reviewId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Avaliação não encontrada.",
        action: "Verifique o ID da avaliação e tente novamente.",
      });
    }

    return results.rows[0];
  }
}

async function checkUserPurchase(userId, productId) {
  const purchaseFound = await runCheckPurchaseQuery(userId, productId);
  return purchaseFound;

  async function runCheckPurchaseQuery(userId, productId) {
    const results = await database.query({
      text: `
        SELECT
          o.id as order_id,
          o.created_at as purchase_date
        FROM
          orders o
        WHERE
          o.user_id = $1
          AND o.status = 'delivered'
          AND o.items::jsonb @> $2::jsonb
        LIMIT 1;`,
      values: [userId, JSON.stringify([{ product_id: productId }])],
    });

    return results.rowCount > 0 ? results.rows[0] : null;
  }
}

async function checkExistingReview(userId, productId) {
  const existingReview = await runCheckExistingQuery(userId, productId);
  return existingReview;

  async function runCheckExistingQuery(userId, productId) {
    const results = await database.query({
      text: `
        SELECT
          id,
          rating,
          created_at
        FROM
          reviews
        WHERE
          user_id = $1
          AND product_id = $2
          AND deleted_at IS NULL
        LIMIT 1;`,
      values: [userId, productId],
    });

    return results.rowCount > 0 ? results.rows[0] : null;
  }
}

async function create(userId, productId, reviewData) {
  // Verifica se o usuário comprou o produto
  const purchase = await checkUserPurchase(userId, productId);

  if (!purchase) {
    throw new ValidationError({
      message: "Você precisa ter comprado este produto para avaliá-lo.",
      action:
        "Apenas clientes que compraram o produto podem deixar avaliações.",
    });
  }

  // Verifica se já existe uma avaliação deste usuário para este produto
  const existingReview = await checkExistingReview(userId, productId);

  if (existingReview) {
    throw new ValidationError({
      message: "Você já avaliou este produto.",
      action:
        "Você pode editar sua avaliação existente ao invés de criar uma nova.",
    });
  }

  const newReview = await runInsertQuery(
    userId,
    productId,
    reviewData,
    purchase.order_id,
  );
  return newReview;

  async function runInsertQuery(userId, productId, reviewData, orderId) {
    const {
      rating,
      title,
      comment,
      pros = null,
      cons = null,
      recommended = true,
      verified_purchase = true,
      images = [],
    } = reviewData;

    // Validação do rating
    if (!rating || rating < 1 || rating > 5) {
      throw new ValidationError({
        message: "Avaliação inválida.",
        action: "A nota deve ser entre 1 e 5 estrelas.",
      });
    }

    const results = await database.query({
      text: `
        INSERT INTO reviews (
          user_id,
          product_id,
          order_id,
          rating,
          title,
          comment,
          pros,
          cons,
          recommended,
          verified_purchase,
          images
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
      values: [
        userId,
        productId,
        orderId,
        rating,
        title,
        comment,
        pros,
        cons,
        recommended,
        verified_purchase,
        JSON.stringify(images),
      ],
    });

    // Atualiza a média de avaliações do produto
    await updateProductRating(productId);

    return results.rows[0];
  }
}

async function update(reviewId, userId, reviewData) {
  const updatedReview = await runUpdateQuery(reviewId, userId, reviewData);
  return updatedReview;

  async function runUpdateQuery(reviewId, userId, reviewData) {
    const { rating, title, comment, pros, cons, recommended, images } =
      reviewData;

    // Validação do rating se fornecido
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw new ValidationError({
        message: "Avaliação inválida.",
        action: "A nota deve ser entre 1 e 5 estrelas.",
      });
    }

    const results = await database.query({
      text: `
        UPDATE
          reviews
        SET
          rating = COALESCE($3, rating),
          title = COALESCE($4, title),
          comment = COALESCE($5, comment),
          pros = COALESCE($6, pros),
          cons = COALESCE($7, cons),
          recommended = COALESCE($8, recommended),
          images = COALESCE($9, images),
          updated_at = NOW(),
          edited = true
        WHERE
          id = $1
          AND user_id = $2
          AND deleted_at IS NULL
        RETURNING
          *`,
      values: [
        reviewId,
        userId,
        rating,
        title,
        comment,
        pros,
        cons,
        recommended,
        images ? JSON.stringify(images) : undefined,
      ],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "Avaliação não encontrada ou você não tem permissão para editá-la.",
        action: "Verifique se você é o autor desta avaliação.",
      });
    }

    // Atualiza a média de avaliações do produto se o rating foi alterado
    if (rating !== undefined) {
      const review = results.rows[0];
      await updateProductRating(review.product_id);
    }

    return results.rows[0];
  }
}

async function deleteById(reviewId, userId) {
  const deletedReview = await runDeleteQuery(reviewId, userId);
  return deletedReview;

  async function runDeleteQuery(reviewId, userId) {
    const results = await database.query({
      text: `
        UPDATE
          reviews
        SET
          deleted_at = NOW(),
          updated_at = NOW()
        WHERE
          id = $1
          AND user_id = $2
          AND deleted_at IS NULL
        RETURNING
          *;`,
      values: [reviewId, userId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "Avaliação não encontrada ou já foi deletada.",
        action: "Verifique se você é o autor desta avaliação.",
      });
    }

    // Atualiza a média de avaliações do produto
    const review = results.rows[0];
    await updateProductRating(review.product_id);

    return results.rows[0];
  }
}

async function addHelpful(reviewId, userId) {
  const helpfulReview = await runAddHelpfulQuery(reviewId, userId);
  return helpfulReview;

  async function runAddHelpfulQuery(reviewId, userId) {
    // Primeiro verifica se o usuário já marcou como útil
    const checkResults = await database.query({
      text: `
        SELECT id FROM review_helpful
        WHERE review_id = $1 AND user_id = $2;`,
      values: [reviewId, userId],
    });

    if (checkResults.rowCount > 0) {
      throw new ValidationError({
        message: "Você já marcou esta avaliação como útil.",
        action:
          "Cada usuário pode marcar uma avaliação como útil apenas uma vez.",
      });
    }

    // Adiciona o voto de útil
    await database.query({
      text: `
        INSERT INTO review_helpful (review_id, user_id)
        VALUES ($1, $2);`,
      values: [reviewId, userId],
    });

    // Atualiza o contador na review
    const results = await database.query({
      text: `
        UPDATE reviews
        SET helpful_count = helpful_count + 1
        WHERE id = $1
        RETURNING *;`,
      values: [reviewId],
    });

    return results.rows[0];
  }
}

async function removeHelpful(reviewId, userId) {
  const unhelpfulReview = await runRemoveHelpfulQuery(reviewId, userId);
  return unhelpfulReview;

  async function runRemoveHelpfulQuery(reviewId, userId) {
    // Remove o voto de útil
    const deleteResults = await database.query({
      text: `
        DELETE FROM review_helpful
        WHERE review_id = $1 AND user_id = $2
        RETURNING id;`,
      values: [reviewId, userId],
    });

    if (deleteResults.rowCount === 0) {
      throw new NotFoundError({
        message: "Você não marcou esta avaliação como útil.",
        action: "Não há marcação para remover.",
      });
    }

    // Atualiza o contador na review
    const results = await database.query({
      text: `
        UPDATE reviews
        SET helpful_count = GREATEST(helpful_count - 1, 0)
        WHERE id = $1
        RETURNING *;`,
      values: [reviewId],
    });

    return results.rows[0];
  }
}

// Função auxiliar para atualizar a média de avaliações do produto
async function updateProductRating(productId) {
  await database.query({
    text: `
      UPDATE products
      SET
        rating = (
          SELECT AVG(rating)::numeric(2,1)
          FROM reviews
          WHERE product_id = $1
          AND deleted_at IS NULL
        ),
        review_count = (
          SELECT COUNT(*)
          FROM reviews
          WHERE product_id = $1
          AND deleted_at IS NULL
        ),
        updated_at = NOW()
      WHERE id = $1;`,
    values: [productId],
  });
}

const review = {
  create,
  findAllByProductId,
  findAllByUserId,
  findOneById,
  update,
  deleteById,
  addHelpful,
  removeHelpful,
  checkUserPurchase,
  checkExistingReview,
};

export default review;
