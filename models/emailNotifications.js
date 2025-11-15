import email from "infra/email.js";
import webserver from "infra/webserver.js";

async function sendPurchaseConfirmation(buyerEmail, buyerName, orders, totalAmount) {
  const itemsHtml = orders
    .map(
      (order) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">
        ${order.product.title}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">
        ${order.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
        R$ ${Number(order.total_price).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
          th { background: #f0f0f0; padding: 10px; text-align: left; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Compra Confirmada!</h1>
          </div>
          <div class="content">
            <p>Olá ${buyerName},</p>
            <p>Seu pagamento foi aprovado com sucesso! Aqui estão os detalhes da sua compra:</p>
            
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th style="text-align: center;">Quantidade</th>
                  <th style="text-align: right;">Preço</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="total">
              Total: R$ ${Number(totalAmount).toFixed(2)}
            </div>
            
            <p style="margin-top: 30px;">
              Você pode acompanhar o status do seu pedido em:
              <a href="${webserver.origin}/configuracoes/meus-pedidos">Meus Pedidos</a>
            </p>
            
            <p>Obrigado por comprar na E-Play! 🎮</p>
          </div>
          <div class="footer">
            <p>E-Play - Sua loja de games</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await email.send({
    from: "E-Play <noreply@eplay.com>",
    to: buyerEmail,
    subject: "✅ Compra Confirmada - E-Play",
    html,
  });
}

async function sendPurchaseFailure(buyerEmail, buyerName, orders, totalAmount) {
  const itemsHtml = orders
    .map(
      (order) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">
        ${order.product.title}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">
        ${order.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
        R$ ${Number(order.total_price).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
          th { background: #f0f0f0; padding: 10px; text-align: left; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Pagamento Não Aprovado</h1>
          </div>
          <div class="content">
            <p>Olá ${buyerName},</p>
            <p>Infelizmente, não foi possível processar seu pagamento para o seguinte pedido:</p>
            
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th style="text-align: center;">Quantidade</th>
                  <th style="text-align: right;">Preço</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <p><strong>Valor total:</strong> R$ ${Number(totalAmount).toFixed(2)}</p>
            
            <p>Por favor, tente novamente ou entre em contato com nosso suporte.</p>
            
            <a href="${webserver.origin}/carrinho" class="btn">Voltar ao Carrinho</a>
          </div>
          <div class="footer">
            <p>E-Play - Sua loja de games</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await email.send({
    from: "E-Play <noreply@eplay.com>",
    to: buyerEmail,
    subject: "❌ Pagamento Não Aprovado - E-Play",
    html,
  });
}

async function sendNewSaleNotification(sellerEmail, sellerName, order, buyerAddress) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
          .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }
          .btn { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Nova Venda!</h1>
          </div>
          <div class="content">
            <p>Olá ${sellerName},</p>
            <p>Você acabou de fazer uma venda! Confira os detalhes:</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">Produto Vendido</h3>
              <p><strong>${order.product.title}</strong></p>
              <p>Quantidade: ${order.quantity}</p>
              <p>Valor: R$ ${Number(order.total_price).toFixed(2)}</p>
              <p>Pedido: #${order.order_id}</p>
            </div>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">📦 Endereço de Entrega</h3>
              <p>${buyerAddress.name}</p>
              <p>${buyerAddress.street}, ${buyerAddress.number}</p>
              ${buyerAddress.complement ? `<p>${buyerAddress.complement}</p>` : ''}
              <p>${buyerAddress.neighborhood}</p>
              <p>${buyerAddress.city} - ${buyerAddress.state}</p>
              <p>CEP: ${buyerAddress.zipcode}</p>
            </div>
            
            <p><strong>Próximos passos:</strong></p>
            <ol>
              <li>Prepare o produto para envio</li>
              <li>Atualize o status para "Preparando envio"</li>
              <li>Após enviar, atualize para "Enviado" e adicione o código de rastreio</li>
            </ol>
            
            <a href="${webserver.origin}/configuracoes/minhas-vendas" class="btn">Gerenciar Vendas</a>
          </div>
          <div class="footer">
            <p>E-Play - Sua loja de games</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await email.send({
    from: "E-Play <noreply@eplay.com>",
    to: sellerEmail,
    subject: "🎉 Nova Venda - E-Play",
    html,
  });
}

export default {
  sendPurchaseConfirmation,
  sendPurchaseFailure,
  sendNewSaleNotification,
};
