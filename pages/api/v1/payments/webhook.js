import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import payment from "models/payment.js";
import order from "models/order.js";
import user from "models/user.js";
import listing from "models/listing.js";
import emailNotifications from "models/emailNotifications.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  try {
    const { type, data } = request.body;

    console.log("📨 Webhook recebido:", { type, data });

    // Webhook do Mercado Pago para notificações de pagamento
    if (type === "payment") {
      const paymentId = data.id;

      console.log(`💳 Notificação de pagamento recebida: ${paymentId}`);

      // Buscar o pagamento na API do Mercado Pago para verificar o status
      const ACCESS_TOKEN = process.env.ACCESS_TOKEN_MERCADOPAGO_KEY;
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}?access_token=${ACCESS_TOKEN}`);
      
      if (!mpResponse.ok) {
        throw new Error("Erro ao buscar informações do pagamento no Mercado Pago");
      }

      const mpPayment = await mpResponse.json();
      const externalReference = mpPayment.external_reference; // order_id
      const status = mpPayment.status; // approved, pending, rejected, etc.

      console.log(`📊 Status do pagamento: ${status}`);

      // Atualizar status do pagamento no banco
      await payment.updatePaymentStatus(externalReference, status, paymentId);

      // Buscar detalhes do pedido
      const orderDetails = await order.findOneById(externalReference);
      const buyerData = await user.findOneById(orderDetails.buyer_id);
      const listingData = await listing.findOneById(orderDetails.listing_id);
      const sellerData = await user.findOneById(listingData.seller_id);

      // Processar baseado no status
      if (status === "approved") {
        // Atualizar status do pedido para "payment_approved"
        await order.updateStatus(externalReference, "payment_approved");

        console.log("✅ Pagamento aprovado, enviando emails...");

        // Enviar email de confirmação para o comprador
        const orderWithProduct = {
          ...orderDetails,
          product: {
            title: listingData.title,
          },
        };

        await emailNotifications.sendPurchaseConfirmation(
          buyerData.email,
          buyerData.username,
          [orderWithProduct],
          orderDetails.total_price
        );

        // Enviar email para o vendedor
        const buyerAddress = {
          name: buyerData.username,
          street: buyerData.address_street || "Não informado",
          number: buyerData.address_number || "S/N",
          complement: buyerData.address_complement,
          neighborhood: buyerData.address_neighborhood || "Não informado",
          city: buyerData.address_city || "Não informado",
          state: buyerData.address_state || "Não informado",
          zipcode: buyerData.address_zipcode || "Não informado",
        };

        await emailNotifications.sendNewSaleNotification(
          sellerData.email,
          sellerData.username,
          orderWithProduct,
          buyerAddress
        );

        console.log("📧 Emails enviados com sucesso!");
      } else if (status === "rejected" || status === "cancelled") {
        // Atualizar status do pedido para "payment_failed"
        await order.updateStatus(externalReference, "payment_failed");

        console.log("❌ Pagamento recusado, enviando email...");

        // Enviar email de falha para o comprador
        const orderWithProduct = {
          ...orderDetails,
          product: {
            title: listingData.title,
          },
        };

        await emailNotifications.sendPurchaseFailure(
          buyerData.email,
          buyerData.username,
          [orderWithProduct],
          orderDetails.total_price
        );

        console.log("📧 Email de falha enviado!");
      }

      return response.status(200).json({
        message: "Webhook processado com sucesso",
      });
    }

    return response.status(400).json({
      message: "Tipo de notificação não suportado",
    });
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error);
    return controller.errorHandlers.onError(error, request, response);
  }
}
