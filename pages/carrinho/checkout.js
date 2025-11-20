import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import useUser from "hooks/useUser";
import { useCarrinho } from "hooks/useCarrinho";
import styles from "styles/carrinho/checkout.module.css";
import load from "styles/componentes/loading.module.css";

const estados = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

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
  const isAddressFormComplete = hasAddress();

  return (
    <div className={styles.checkoutContainer}>
      <div className={styles.checkoutContent}>
        <div className={styles.formContainer}>

          <h2>Endereço de Entrega</h2>
          <form className={styles.enderecoForm}>
            <div className={styles.formBackground}>

              {!userHasAddress && (
                <div className={styles.alertWarning}>
                  <strong>⚠️ Atenção:</strong> Você precisa cadastrar um endereço de entrega para finalizar a compra.
                </div>
              )}

              <div className={styles.enderecoFormContainer1}>

                <div className={styles.fieldGroup}>
                  <label htmlFor="address_zipcode" className={styles.label}>CEP *</label>
                  <input
                    type="text"
                    id="address_zipcode"
                    name="address_zipcode"
                    className={styles.input}
                    value={addressForm.address_zipcode}
                    onChange={handleInputChange}
                    placeholder="00000-000"
                    maxLength="9"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="address_street" className={styles.label}>Rua *</label>
                  <input
                    type="text"
                    id="address_street"
                    name="address_street"
                    className={styles.input}
                    value={addressForm.address_street}
                    onChange={handleInputChange}
                    placeholder="Nome da rua"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="address_number" className={styles.label}>Número *</label>
                  <input
                    type="text"
                    id="address_number"
                    name="address_number"
                    className={styles.input}
                    value={addressForm.address_number}
                    onChange={handleInputChange}
                    placeholder="123"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="address_complement" className={styles.label}>Complemento</label>
                  <input
                    type="text"
                    id="address_complement"
                    name="address_complement"
                    className={styles.input}
                    value={addressForm.address_complement}
                    onChange={handleInputChange}
                    placeholder="Apto, bloco, etc (opcional)"
                  />
                </div>
              </div>

              <div className={styles.enderecoFormContainer2}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="address_neighborhood" className={styles.label}>Bairro *</label>
                  <input
                    type="text"
                    id="address_neighborhood"
                    name="address_neighborhood"
                    className={styles.input}
                    value={addressForm.address_neighborhood}
                    onChange={handleInputChange}
                    placeholder="Nome do bairro"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="address_city" className={styles.label}>Cidade *</label>
                  <input
                    type="text"
                    id="address_city"
                    name="address_city"
                    className={styles.input}
                    value={addressForm.address_city}
                    onChange={handleInputChange}
                    placeholder="Nome da cidade"
                  />
                </div>

                <div className={styles.fieldGroupHalf}>
                  <label htmlFor="address_state" className={styles.label}>Estado *</label>
                  <select
                    id="address_state"
                    name="address_state"
                    className={styles.select}
                    value={addressForm.address_state}
                    onChange={handleInputChange}
                  >
                    <option value=""> </option>
                    {estados.map((estado) => (
                      <option key={estado.sigla} value={estado.sigla}>
                        {estado.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </form>

          {!userHasAddress && (
            <button
              className={styles.saveAddressButton}
              onClick={handleSaveAddress}
              disabled={isProcessing || !isAddressFormComplete}
            >
              {isProcessing ? "Salvando Endereço..." : "Salvar Endereço"}
            </button>
          )}


          <h2>Itens do pedido</h2>
          <div className={styles.resumoItens}>
            {itens.length === 0 ? (
              <p>Seu carrinho está vazio.</p>
            ) : (
              itens.map((item) => (
                <div className={styles.itemResumo} key={item.listing_id}>
                  <img
                    src={item.image_url || 'placeholder_image.png'}
                    alt={item.title}
                    className={styles.itemImagem}
                  />
                  <div className={styles.itemDetalhes}>
                    <span className={styles.itemNome}>
                      {item.title}
                    </span>
                    <span className={styles.itemQuantidade}>
                      Quantidade: {item.quantity}
                    </span>
                    <span className={styles.itemPreco}>
                      {formatarPreco(item.price_locked * item.quantity)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.resumoPedido}>
          <h2>Resumo do Pedido</h2>

          <div className={styles.freteInfo}>
            {frete === 0
              ? "🎉 Frete Grátis!"
              : (
                subtotal < 200
                  ? `Faltam ${formatarPreco(200 - subtotal)} para ganhar frete grátis!`
                  : "Frete grátis acima de R$ 200,00"
              )}
          </div>

          <div className={styles.resumoLinha}>
            <span>Subtotal:</span>
            <span>{formatarPreco(subtotal)}</span>
          </div>
          <div className={styles.resumoLinha}>
            <span>Frete:</span>
            <span>
              {frete === 0
                ? "Grátis"
                : formatarPreco(frete)}
            </span>
          </div>
          <div className={styles.resumoTotal}>
            <span>Total:</span>
            <span>{formatarPreco(total)}</span>
          </div>

          <button
            className={styles.finalizarBtn}
            onClick={handleFinalizarCompra}
            disabled={isProcessing || !isAddressFormComplete}
          >
            {isProcessing ? "Processando..." : "Confirmar Pedido"}
          </button>

          <button
            onClick={() => router.push("/carrinho")}
            disabled={isProcessing}
            className={styles.backButton}
          >
            Voltar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
}