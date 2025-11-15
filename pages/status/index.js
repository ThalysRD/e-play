import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styles from "styles/carrinho/checkout.module.css";

export default function StatusPage() {
  const router = useRouter();
  const { status, preference_id } = router.query;
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (preference_id) {
      fetchPaymentDetails();
    }
  }, [preference_id]);

  async function fetchPaymentDetails() {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/payments/details?preferenceId=${preference_id}`);
      
      if (!response.ok) {
        throw new Error("Erro ao buscar detalhes do pagamento");
      }

      const data = await response.json();
      setPaymentDetails(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatarPreco(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  function getStatusMessage() {
    switch (status) {
      case 'success':
        return {
          title: '✅ Pagamento Aprovado!',
          message: 'Seu pagamento foi processado com sucesso.',
          color: '#28a745'
        };
      case 'pending':
        return {
          title: '⏳ Pagamento Pendente',
          message: 'Aguardando confirmação do pagamento.',
          color: '#ffc107'
        };
      case 'failure':
        return {
          title: '❌ Pagamento Recusado',
          message: 'Não foi possível processar seu pagamento. Tente novamente.',
          color: '#dc3545'
        };
      default:
        return {
          title: 'Status Desconhecido',
          message: 'Verificando status do pagamento...',
          color: '#6c757d'
        };
    }
  }

  const statusInfo = getStatusMessage();

  if (loading) {
    return (
      <div className={styles.checkoutContainer}>
        <div className={styles.statusMessage}>
          <h1>Carregando...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.checkoutContainer}>
        <div className={styles.statusMessage} style={{ borderColor: '#dc3545' }}>
          <h1 style={{ color: '#dc3545' }}>Erro</h1>
          <p>{error}</p>
          <button 
            onClick={() => router.push('/')} 
            className={styles.finalizarBtn}
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.checkoutContainer}>
      <div className={styles.checkoutContent}>
        <div className={styles.formContainer}>
          <div style={{ 
            border: `2px solid ${statusInfo.color}`, 
            borderRadius: '8px', 
            padding: '20px',
            marginBottom: '30px'
          }}>
            <h1 style={{ color: statusInfo.color, marginBottom: '10px' }}>
              {statusInfo.title}
            </h1>
            <p style={{ fontSize: '16px', marginBottom: '20px' }}>
              {statusInfo.message}
            </p>
            {preference_id && (
              <p style={{ fontSize: '14px', color: '#666' }}>
                ID do Pedido: {preference_id}
              </p>
            )}
          </div>

          {paymentDetails && (
            <>
              <h2>Detalhes do Pagamento</h2>
              <div style={{ 
                background: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <p><strong>Valor Total:</strong> {formatarPreco(paymentDetails.amount)}</p>
                <p><strong>Status:</strong> {paymentDetails.status}</p>
                <p><strong>Data:</strong> {new Date(paymentDetails.created_at).toLocaleString('pt-BR')}</p>
              </div>

              <h2>Produtos</h2>
              <div className={styles.resumoItens}>
                {paymentDetails.orders.map((order, index) => {
                  const firstImage = order.product.images?.[0];
                  return (
                    <div className={styles.itemResumo} key={index}>
                      {firstImage && (
                        <img
                          src={firstImage}
                          alt={order.product.title}
                          className={styles.itemImagem}
                        />
                      )}
                      <div className={styles.itemDetalhes}>
                        <span className={styles.itemNome}>
                          {order.product.title}
                        </span>
                        <span className={styles.itemQuantidade}>
                          Quantidade: {order.quantity}
                        </span>
                        <span className={styles.itemPreco}>
                          {formatarPreco(order.total_price)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => router.push('/')} 
              className={styles.finalizarBtn}
            >
              Voltar para Home
            </button>
            {status === 'success' && (
              <button 
                onClick={() => router.push('/configuracoes/meus-pedidos')} 
                className={styles.finalizarBtn}
              >
                Ver Meus Pedidos
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
