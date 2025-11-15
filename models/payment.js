import database from "infra/database.js";
import webserver from "infra/webserver.js";
import { ValidationError, NotFoundError } from "infra/errors";

// Usar a API correta do Mercado Pago com SDK ou endpoint correto
const ACCESS_TOKEN = process.env.ACCESS_TOKEN_MERCADOPAGO_KEY;

async function createPayment(buyerId, orderId, totalPrice, description, email) {
  if (!buyerId || !orderId || !totalPrice || !email) {
    throw new ValidationError({
      message: "buyerId, orderId, totalPrice e email são obrigatórios",
      action: "Forneça todos os parâmetros necessários",
    });
  }

  if (totalPrice <= 0) {
    throw new ValidationError({
      message: "totalPrice deve ser maior que zero",
      action: "Forneça um valor positivo",
    });
  }

  if (!ACCESS_TOKEN) {
    throw new ValidationError({
      message: "Token de acesso do Mercado Pago não configurado",
      action: "Configure ACCESS_TOKEN_MERCADOPAGO_KEY nas variáveis de ambiente",
    });
  }

  try {
    const isProduction = !ACCESS_TOKEN.startsWith("TEST-");
    console.log("🔍 Tipo de credencial:", isProduction ? "PRODUÇÃO" : "TESTE");

    // Dados da preferência usando o formato correto
    const preferenceData = {
      items: [
        {
          id: String(orderId),
          title: description || "Compra E-Play",
          quantity: 1,
          unit_price: Math.round(parseFloat(totalPrice) * 100) / 100,
        },
      ],
      payer: {
        email: email,
      },
      back_urls: {
        success: `${webserver.origin}/status?status=success`,
        failure: `${webserver.origin}/status?status=failure`,
        pending: `${webserver.origin}/status?status=pending`,
      },
      external_reference: String(orderId),
      notification_url: `${webserver.origin}/api/v1/payments/webhook`,
    };

    // auto_return é apenas para credenciais de teste
    if (!isProduction) {
      preferenceData.auto_return = "approved";
    }

    console.log("🚀 Enviando preferência para Mercado Pago");
    console.log("Token válido:", !!ACCESS_TOKEN);
    console.log("Token type:", ACCESS_TOKEN.substring(0, 20) + "...");
    console.log("Back URLs:", preferenceData.back_urls.success);

    // Endpoint correto para ambas as credenciais (teste e produção)
    const url = new URL("https://api.mercadopago.com/checkout/preferences");
    url.searchParams.append("access_token", ACCESS_TOKEN);

    console.log("📤 POST para:", url.toString().replace(ACCESS_TOKEN, "***TOKEN***"));

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceData),
    });

    console.log("📥 Status da resposta:", response.status);

    const responseData = await response.json();

    if (!response.ok) {
      console.error("❌ Erro da API Mercado Pago:");
      console.error("Status:", response.status);
      console.error("Response:", JSON.stringify(responseData, null, 2));
      
      const errorMessage = responseData.message || responseData.error || "Erro desconhecido";
      throw new Error(`API Mercado Pago retornou ${response.status}: ${errorMessage}`);
    }

    console.log("✅ Preferência criada com sucesso!");
    console.log("Preference ID:", responseData.id);

    const preference = responseData;

    // Validar resposta
    if (!preference.id) {
      throw new Error("Resposta inválida do Mercado Pago: falta preferenceId");
    }

    if (!preference.init_point && !preference.sandbox_init_point) {
      throw new Error("Resposta inválida do Mercado Pago: falta init_point");
    }

    // Salvar informações de pagamento no banco
    await savePaymentRecord(buyerId, orderId, preference.id, totalPrice, "pending");

    // Adicionar preference_id às URLs de retorno
    const initPoint = preference.init_point ? `${preference.init_point}&preference_id=${preference.id}` : null;
    const sandboxInitPoint = preference.sandbox_init_point ? `${preference.sandbox_init_point}&preference_id=${preference.id}` : null;

    return {
      preferenceId: preference.id,
      initPoint: initPoint || preference.init_point,
      sandboxInitPoint: sandboxInitPoint || preference.sandbox_init_point,
    };
  } catch (error) {
    console.error("💥 Erro completo na integração:", error.message);
    throw new Error(`Erro na integração com Mercado Pago: ${error.message}`);
  }
}

async function savePaymentRecord(buyerId, orderId, preferenceId, amount, status) {
  try {
    await database.query({
      text: `
        INSERT INTO payments (buyer_id, order_id, preference_id, amount, status)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (order_id) DO UPDATE
        SET preference_id = $3, amount = $4, status = $5, updated_at = timezone('utc', now())
      `,
      values: [buyerId, orderId, preferenceId, amount, status],
    });
  } catch (error) {
    console.error("Erro ao salvar registro de pagamento:", error);
  }
}

async function getPaymentByOrderId(orderId) {
  if (!orderId) {
    throw new ValidationError({
      message: "Order ID é obrigatório",
      action: "Forneça um ID de pedido válido",
    });
  }

  const results = await database.query({
    text: `
      SELECT * FROM payments 
      WHERE order_id = $1 
      LIMIT 1
    `,
    values: [orderId],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Pagamento não encontrado",
      action: "Verifique o ID do pedido e tente novamente",
    });
  }

  return results.rows[0];
}

async function getPaymentWithDetails(preferenceId) {
  if (!preferenceId) {
    throw new ValidationError({
      message: "Preference ID é obrigatório",
      action: "Forneça um ID de preferência válido",
    });
  }

  const results = await database.query({
    text: `
      SELECT 
        p.id as payment_id,
        p.preference_id,
        p.amount,
        p.status as payment_status,
        p.created_at as payment_created_at,
        o.id as order_id,
        o.buyer_id,
        o.listing_id,
        o.quantity,
        o.total_price,
        o.status as order_status,
        l.title,
        l.price,
        l.images
      FROM payments p
      INNER JOIN orders o ON p.order_id = o.id
      INNER JOIN listings l ON o.listing_id = l.id
      WHERE p.preference_id = $1
    `,
    values: [preferenceId],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Pagamento não encontrado",
      action: "Verifique o ID da preferência e tente novamente",
    });
  }

  // Agrupar os resultados por payment
  const payment = {
    id: results.rows[0].payment_id,
    preference_id: results.rows[0].preference_id,
    amount: results.rows[0].amount,
    status: results.rows[0].payment_status,
    created_at: results.rows[0].payment_created_at,
    buyer_id: results.rows[0].buyer_id,
    orders: results.rows.map(row => ({
      order_id: row.order_id,
      listing_id: row.listing_id,
      quantity: row.quantity,
      total_price: row.total_price,
      order_status: row.order_status,
      product: {
        title: row.title,
        price: row.price,
        images: row.images,
      },
    })),
  };

  return payment;
}

async function updatePaymentStatus(orderId, status, externalReference) {
  if (!orderId || !status) {
    throw new ValidationError({
      message: "orderId e status são obrigatórios",
      action: "Forneça ambos os parâmetros",
    });
  }

  const results = await database.query({
    text: `
      UPDATE payments 
      SET status = $2, external_reference = $3, updated_at = timezone('utc', now())
      WHERE order_id = $1
      RETURNING *
    `,
    values: [orderId, status, externalReference],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Pagamento não encontrado",
      action: "Verifique o ID do pedido e tente novamente",
    });
  }

  return results.rows[0];
}

async function getPaymentByPreferenceId(preferenceId) {
  if (!preferenceId) {
    throw new ValidationError({
      message: "Preference ID é obrigatório",
      action: "Forneça um ID de preferência válido",
    });
  }

  const results = await database.query({
    text: `
      SELECT * FROM payments 
      WHERE preference_id = $1 
      LIMIT 1
    `,
    values: [preferenceId],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Pagamento não encontrado",
      action: "Verifique o ID da preferência e tente novamente",
    });
  }

  return results.rows[0];
}

const payment = {
  createPayment,
  getPaymentByOrderId,
  getPaymentWithDetails,
  updatePaymentStatus,
  getPaymentByPreferenceId,
};

export default payment;
