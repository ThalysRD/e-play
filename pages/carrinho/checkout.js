import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import useUser from "hooks/useUser";
import { useCarrinho } from "hooks/useCarrinho";
import styles from "styles/carrinho/checkout.module.css";
import load from "styles/componentes/loading.module.css";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: userLoading, mutate } = useUser();
  const {
    itens,
    calcularSubtotal,
    calcularFrete,
    calcularTotal,
    isLoading: cartLoading,
  } = useCarrinho();

  const [isProcessing, setIsProcessing] = useState(false);
  const [addressForm, setAddressForm] = useState({
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    address_zipcode: "",
  });

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [userLoading, user, router]);

  useEffect(() => {
    if (user) {
      setAddressForm({
        address_street: user.address_street || "",
        address_number: user.address_number || "",
        address_complement: user.address_complement || "",
        address_neighborhood: user.address_neighborhood || "",
        address_city: user.address_city || "",
        address_state: user.address_state || "",
        address_zipcode: user.address_zipcode || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (!cartLoading && itens.length === 0) {
      router.push("/carrinho");
    }
  }, [cartLoading, itens, router]);

  const hasAddress = () => {
    return (
      addressForm.address_street &&
      addressForm.address_number &&
      addressForm.address_neighborhood &&
      addressForm.address_city &&
      addressForm.address_state &&
      addressForm.address_zipcode
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveAddress = async () => {
    if (!hasAddress()) {
      alert("Por favor, preencha todos os campos obrigatórios do endereço.");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/v1/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(addressForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao salvar endereço");
      }

      await mutate();
      alert("Endereço salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      alert(error.message || "Não foi possível salvar o endereço. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalizarCompra = async () => {
    if (!hasAddress()) {
      alert("Por favor, cadastre seu endereço de entrega antes de finalizar a compra.");
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/v1/orders/checkout-cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao finalizar compra");
      }

      const data = await response.json();

      alert(
        `Pedido realizado com sucesso!\n\nSubtotal: R$ ${data.summary.subtotal.toFixed(2)}\nFrete: R$ ${data.summary.shipping.toFixed(2)}\nTotal: R$ ${data.summary.total.toFixed(2)}\n\n${data.summary.itemCount} pedido(s) criado(s).`
      );

      router.push("/configuracoes/meus-pedidos");
    } catch (error) {
      console.error("Erro ao finalizar compra:", error);
      alert(error.message || "Não foi possível finalizar a compra. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatarPreco = (preco) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(preco);
  };

  if (userLoading || cartLoading) {
    return (
      <div className={styles.checkoutContainer}>
        <div className={load.loadingContainer}>
          <div className={load.spinner}></div>
        </div>
      </div>
    );
  }

  if (!user || itens.length === 0) {
    return null;
  }

  const subtotal = calcularSubtotal();
  const frete = calcularFrete();
  const total = calcularTotal();
  const userHasAddress = user.address_street && user.address_zipcode;

  return (
    <div className={styles.checkoutContainer}>
      <div className={styles.checkoutContent}>
        <header className={styles.header}>
          <h2>Finalizar Compra</h2>
          <div className={styles.divider}></div>
        </header>

        <div className={styles.mainContent}>
          {/* Endereço de Entrega */}
          <section className={styles.section}>
            <h3>📍 Endereço de Entrega</h3>
            
            {!userHasAddress && (
              <div className={styles.alertWarning}>
                <strong>⚠️ Atenção:</strong> Você precisa cadastrar um endereço de entrega para finalizar a compra.
              </div>
            )}

            <div className={styles.addressForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label htmlFor="address_zipcode">CEP *</label>
                  <input
                    type="text"
                    id="address_zipcode"
                    name="address_zipcode"
                    value={addressForm.address_zipcode}
                    onChange={handleInputChange}
                    placeholder="00000-000"
                    maxLength="9"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ flex: 3 }}>
                  <label htmlFor="address_street">Rua *</label>
                  <input
                    type="text"
                    id="address_street"
                    name="address_street"
                    value={addressForm.address_street}
                    onChange={handleInputChange}
                    placeholder="Nome da rua"
                  />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label htmlFor="address_number">Número *</label>
                  <input
                    type="text"
                    id="address_number"
                    name="address_number"
                    value={addressForm.address_number}
                    onChange={handleInputChange}
                    placeholder="123"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="address_complement">Complemento</label>
                  <input
                    type="text"
                    id="address_complement"
                    name="address_complement"
                    value={addressForm.address_complement}
                    onChange={handleInputChange}
                    placeholder="Apto, bloco, etc (opcional)"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="address_neighborhood">Bairro *</label>
                  <input
                    type="text"
                    id="address_neighborhood"
                    name="address_neighborhood"
                    value={addressForm.address_neighborhood}
                    onChange={handleInputChange}
                    placeholder="Nome do bairro"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ flex: 2 }}>
                  <label htmlFor="address_city">Cidade *</label>
                  <input
                    type="text"
                    id="address_city"
                    name="address_city"
                    value={addressForm.address_city}
                    onChange={handleInputChange}
                    placeholder="Nome da cidade"
                  />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label htmlFor="address_state">Estado *</label>
                  <input
                    type="text"
                    id="address_state"
                    name="address_state"
                    value={addressForm.address_state}
                    onChange={handleInputChange}
                    placeholder="UF"
                    maxLength="2"
                  />
                </div>
              </div>

              {!userHasAddress && (
                <button
                  className={styles.saveAddressButton}
                  onClick={handleSaveAddress}
                  disabled={isProcessing || !hasAddress()}
                >
                  {isProcessing ? "Salvando..." : "Salvar Endereço"}
                </button>
              )}
            </div>
          </section>

          {/* Resumo do Pedido */}
          <section className={styles.section}>
            <h3>📦 Resumo do Pedido</h3>
            <div className={styles.orderSummary}>
              <div className={styles.summaryItems}>
                {itens.map((item) => (
                  <div key={item.listing_id} className={styles.summaryItem}>
                    <span>{item.title}</span>
                    <span>
                      {item.quantity}x {formatarPreco(item.price_locked)}
                    </span>
                  </div>
                ))}
              </div>

              <div className={styles.divider}></div>

              <div className={styles.summaryTotals}>
                <div className={styles.summaryRow}>
                  <span>Subtotal:</span>
                  <span>{formatarPreco(subtotal)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Frete:</span>
                  <span className={frete === 0 ? styles.free : ""}>
                    {frete === 0 ? "GRÁTIS" : formatarPreco(frete)}
                  </span>
                </div>
                <div className={`${styles.summaryRow} ${styles.total}`}>
                  <span>Total:</span>
                  <span>{formatarPreco(total)}</span>
                </div>
              </div>

              {subtotal < 200 && (
                <div className={styles.freteInfo}>
                  Faltam {formatarPreco(200 - subtotal)} para ganhar frete grátis!
                </div>
              )}
            </div>
          </section>

          {/* Botões de Ação */}
          <div className={styles.actions}>
            <button
              className={styles.backButton}
              onClick={() => router.push("/carrinho")}
              disabled={isProcessing}
            >
              Voltar ao Carrinho
            </button>
            <button
              className={styles.checkoutButton}
              onClick={handleFinalizarCompra}
              disabled={isProcessing || !hasAddress()}
            >
              {isProcessing ? "Processando..." : "Confirmar Pedido"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
