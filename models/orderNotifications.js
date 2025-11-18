import email from "infra/email.js";

async function sendBuyerOrderConfirmation(buyerEmail, buyerName, orders, totalAmount) {
  const orderItemsHtml = orders.map(order => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${order.product_title}</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
        ${order.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        R$ ${Number(order.total_price).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
        }
        .order-table {
          width: 100%;
          background: white;
          border-radius: 8px;
          margin: 20px 0;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .total {
          background: #667eea;
          color: white;
          padding: 15px;
          text-align: right;
          font-size: 18px;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          color: #666;
          padding: 20px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎮 Pedido Confirmado!</h1>
      </div>
      <div class="content">
        <p>Olá <strong>${buyerName}</strong>,</p>
        <p>Seu pedido foi recebido com sucesso e está aguardando confirmação do vendedor.</p>
        
        <h3>Detalhes do Pedido:</h3>
        <table class="order-table">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 12px; text-align: left;">Produto</th>
              <th style="padding: 12px; text-align: center;">Quantidade</th>
              <th style="padding: 12px; text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${orderItemsHtml}
          </tbody>
        </table>
        
        <div class="total">
          Total: R$ ${totalAmount.toFixed(2)}
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 4px; margin-top: 20px;">
          <p style="margin: 0 0 10px 0;"><strong>📦 O que acontece agora?</strong></p>
          <ol style="margin: 0; padding-left: 20px;">
            <li>O vendedor foi notificado sobre sua compra</li>
            <li>Ele irá preparar o produto para envio</li>
            <li>Você receberá o código de rastreio por email</li>
            <li>Quando receber, confirme na plataforma clicando em "Confirmar Recebimento"</li>
          </ol>
        </div>
        
        <p style="margin-top: 20px; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/configuracoes/meus-pedidos" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 12px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block;
                    font-weight: bold;">
            Acompanhar Pedidos
          </a>
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Em caso de dúvidas, você pode acompanhar o status do pedido na plataforma ou entrar em contato com o vendedor.
        </p>
      </div>
      <div class="footer">
        <p>E-Play - Sua loja de games</p>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: "E-Play <contato@lojaeplay.com.br>",
    to: buyerEmail,
    subject: "🎮 Pedido Confirmado - E-Play",
    html: htmlContent,
  };

  await email.send(mailOptions);
}

async function sendSellerNewOrderNotification(sellerEmail, sellerName, order, buyerInfo) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .header {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
        }
        .info-box {
          background: white;
          border-left: 4px solid #f5576c;
          padding: 15px;
          margin: 15px 0;
          border-radius: 4px;
        }
        .highlight {
          background: #fff3cd;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }
        .footer {
          text-align: center;
          color: #666;
          padding: 20px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🛒 Nova Venda Realizada!</h1>
      </div>
      <div class="content">
        <p>Olá <strong>${sellerName}</strong>,</p>
        <p>Você tem uma nova venda! Um comprador adquiriu seu produto.</p>
        
        <div class="info-box">
          <h3 style="margin-top: 0;">📦 Detalhes do Produto:</h3>
          <p><strong>Produto:</strong> ${order.product_title}</p>
          <p><strong>Quantidade:</strong> ${order.quantity} unidade(s)</p>
          <p><strong>Valor Total:</strong> R$ ${Number(order.total_price).toFixed(2)}</p>
        </div>
        
        <div class="info-box">
          <h3 style="margin-top: 0;">👤 Dados do Comprador:</h3>
          <p><strong>Nome:</strong> ${buyerInfo.name}</p>
          <p><strong>Email:</strong> ${buyerInfo.email}</p>
          ${buyerInfo.phone_number ? `<p><strong>Telefone:</strong> ${buyerInfo.phone_number}</p>` : ''}
        </div>
        
        ${buyerInfo.hasAddress ? `
        <div class="info-box">
          <h3 style="margin-top: 0;">📍 Endereço de Entrega:</h3>
          <p>${buyerInfo.address_street}, ${buyerInfo.address_number}${buyerInfo.address_complement ? ` - ${buyerInfo.address_complement}` : ''}</p>
          <p>${buyerInfo.address_neighborhood}</p>
          <p>${buyerInfo.address_city} - ${buyerInfo.address_state}</p>
          <p>CEP: ${buyerInfo.address_zipcode}</p>
        </div>
        ` : `
        <div class="highlight">
          <strong>⚠️ Atenção:</strong> O comprador não cadastrou endereço de entrega. Entre em contato para combinar a forma de envio.
        </div>
        `}
        
        <div class="highlight">
          <p style="margin: 0;"><strong>📋 Próximos passos:</strong></p>
          <ol style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>Acesse <strong>"Minhas Vendas"</strong> na plataforma E-Play</li>
            <li>Entre em contato com o comprador se necessário</li>
            <li>Prepare o produto para envio</li>
            <li>Clique em <strong>"Iniciar Preparação"</strong> quando começar a separar o pedido</li>
            <li>Adicione o <strong>código de rastreio</strong> dos Correios ou transportadora</li>
            <li>Clique em <strong>"Marcar como Enviado"</strong> após postar o produto</li>
          </ol>
        </div>
        
        <div class="info-box" style="border-left-color: #4CAF50;">
          <h3 style="margin-top: 0; color: #4CAF50;">💡 Como gerenciar o pedido:</h3>
          <p><strong>1. Status "Pendente":</strong> O pedido foi criado e aguarda sua ação</p>
          <p><strong>2. Status "Em Preparação":</strong> Você está separando/embalando o produto</p>
          <p><strong>3. Status "Enviado":</strong> Produto foi postado (requer código de rastreio)</p>
          <p><strong>4. Status "Entregue":</strong> Comprador confirmou o recebimento</p>
          <p style="margin-bottom: 0;"><strong>⚠️ Importante:</strong> Só é possível marcar como enviado após adicionar o código de rastreio. Uma vez enviado ou cancelado, não é possível alterar o status.</p>
        </div>
        
        <p style="text-align: center; margin-top: 25px;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/configuracoes/minhas-vendas" 
             style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                    color: white; 
                    padding: 12px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block;
                    font-weight: bold;">
            Acessar Minhas Vendas
          </a>
        </p>
      </div>
      <div class="footer">
        <p>E-Play - Sua loja de games</p>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: "E-Play <contato@lojaeplay.com.br>",
    to: sellerEmail,
    subject: "🛍️ Nova Venda - E-Play",
    html: htmlContent,
  };

  await email.send(mailOptions);
}

async function sendStatusUpdateToBuyer(buyerEmail, buyerName, order, productTitle, newStatus) {
  const statusMessages = {
    processing: {
      title: "📦 Seu pedido está sendo preparado",
      message: "O vendedor começou a preparar seu pedido para envio.",
      color: "#2196F3"
    },
    shipped: {
      title: "🚚 Seu pedido foi enviado",
      message: `Seu pedido foi postado! Código de rastreio: <strong>${order.tracking_code || 'Aguardando'}</strong>`,
      color: "#FF9800"
    },
    canceled: {
      title: "❌ Pedido Cancelado",
      message: "Infelizmente seu pedido foi cancelado. O estoque foi devolvido.",
      color: "#f44336"
    }
  };

  const statusInfo = statusMessages[newStatus];

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .header {
          background: ${statusInfo.color};
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
        }
        .info-box {
          background: white;
          border-left: 4px solid ${statusInfo.color};
          padding: 15px;
          margin: 15px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          color: #666;
          padding: 20px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${statusInfo.title}</h1>
      </div>
      <div class="content">
        <p>Olá <strong>${buyerName}</strong>,</p>
        <p>${statusInfo.message}</p>
        
        <div class="info-box">
          <p><strong>Produto:</strong> ${productTitle}</p>
          <p><strong>Quantidade:</strong> ${order.quantity}</p>
          <p><strong>Valor Total:</strong> R$ ${Number(order.total_price).toFixed(2)}</p>
          <p><strong>Número do Pedido:</strong> ${order.id}</p>
        </div>
        
        <p style="text-align: center; margin-top: 25px;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/configuracoes/meus-pedidos" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 12px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block;
                    font-weight: bold;">
            Ver Meus Pedidos
          </a>
        </p>
      </div>
      <div class="footer">
        <p>E-Play - Sua loja de games</p>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: "E-Play <contato@lojaeplay.com.br>",
    to: buyerEmail,
    subject: `${statusInfo.title} - E-Play`,
    html: htmlContent,
  };

  await email.send(mailOptions);
}

async function sendDeliveryConfirmationToSeller(sellerEmail, sellerName, order, productTitle, buyerName) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .header {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
        }
        .info-box {
          background: white;
          border-left: 4px solid #4CAF50;
          padding: 15px;
          margin: 15px 0;
          border-radius: 4px;
        }
        .success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
        }
        .footer {
          text-align: center;
          color: #666;
          padding: 20px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✅ Entrega Confirmada!</h1>
      </div>
      <div class="content">
        <p>Olá <strong>${sellerName}</strong>,</p>
        
        <div class="success">
          <strong>🎉 Parabéns!</strong> O comprador confirmou o recebimento do produto.
        </div>
        
        <div class="info-box">
          <p><strong>Produto:</strong> ${productTitle}</p>
          <p><strong>Comprador:</strong> ${buyerName}</p>
          <p><strong>Quantidade:</strong> ${order.quantity}</p>
          <p><strong>Valor Total:</strong> R$ ${Number(order.total_price).toFixed(2)}</p>
          <p><strong>Número do Pedido:</strong> ${order.id}</p>
        </div>
        
        <p>A venda foi concluída com sucesso! Agradecemos por utilizar a E-Play.</p>
        
        <p style="text-align: center; margin-top: 25px;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/configuracoes/minhas-vendas" 
             style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                    color: white; 
                    padding: 12px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block;
                    font-weight: bold;">
            Ver Minhas Vendas
          </a>
        </p>
      </div>
      <div class="footer">
        <p>E-Play - Sua loja de games</p>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: "E-Play <contato@lojaeplay.com.br>",
    to: sellerEmail,
    subject: "✅ Entrega Confirmada - E-Play",
    html: htmlContent,
  };

  await email.send(mailOptions);
}

async function sendOrderCompletedToBuyer(buyerEmail, buyerName, order, productTitle) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .header {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
        }
        .info-box {
          background: white;
          border-left: 4px solid #4CAF50;
          padding: 15px;
          margin: 15px 0;
          border-radius: 4px;
        }
        .success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          text-align: center;
        }
        .footer {
          text-align: center;
          color: #666;
          padding: 20px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✅ Pedido Finalizado!</h1>
      </div>
      <div class="content">
        <p>Olá <strong>${buyerName}</strong>,</p>
        
        <div class="success">
          <h3 style="margin: 0;">🎉 Pedido Concluído com Sucesso!</h3>
          <p style="margin: 10px 0 0 0;">Obrigado por confirmar o recebimento.</p>
        </div>
        
        <p>Seu pedido foi finalizado. Esperamos que você esteja satisfeito com sua compra!</p>
        
        <div class="info-box">
          <p><strong>Produto:</strong> ${productTitle}</p>
          <p><strong>Quantidade:</strong> ${order.quantity}</p>
          <p><strong>Valor Total:</strong> R$ ${Number(order.total_price).toFixed(2)}</p>
          <p><strong>Número do Pedido:</strong> ${order.id}</p>
        </div>
        
        <p>Se você tiver algum problema com o produto, entre em contato com o vendedor através da plataforma.</p>
        
        <p style="text-align: center; margin-top: 25px;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 12px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block;
                    font-weight: bold;">
            Continuar Comprando
          </a>
        </p>
      </div>
      <div class="footer">
        <p>E-Play - Sua loja de games</p>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: "E-Play <contato@lojaeplay.com.br>",
    to: buyerEmail,
    subject: "✅ Pedido Finalizado - E-Play",
    html: htmlContent,
  };

  await email.send(mailOptions);
}

const orderNotifications = {
  sendBuyerOrderConfirmation,
  sendSellerNewOrderNotification,
  sendStatusUpdateToBuyer,
  sendDeliveryConfirmationToSeller,
  sendOrderCompletedToBuyer,
};

export default orderNotifications;
