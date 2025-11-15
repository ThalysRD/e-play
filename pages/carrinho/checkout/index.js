import React, { useState, useEffect, useRef } from 'react';
import styles from "styles/carrinho/checkout.module.css";
import { useCarrinho } from "hooks/useCarrinho";
import useCheckout from "hooks/useCheckout";
import useUser from "hooks/useUser";

async function patchUser(payload) {
    const res = await fetch("/api/v1/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok)
        throw new Error(data?.message || data?.error || "Falha na atualização dos dados pessoais.");
    return data;
}

export default function CheckoutPage() {
    const { checkoutCart, isLoading: isCheckoutLoading } = useCheckout();
    const { itens, calcularSubtotal, calcularFrete, calcularTotal } = useCarrinho();
    const { user } = useUser();
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const enderecoFormRef = useRef(null);
    const infosFormRef = useRef(null);

    const handleFinalizarCompra = async () => {
        if (itens.length === 0) {
            alert("Seu carrinho está vazio!");
            return;
        }

        try {
            setIsSavingAddress(true);

            const infosFormData = new FormData(infosFormRef.current);
            const cpf = infosFormData.get('cpf')?.trim();
            const cnpj = infosFormData.get('cnpj')?.trim();
            if (!cpf && !cnpj) {
                alert("Por favor, preencha ou o CPF ou o CNPJ.");
                setIsSavingAddress(false);
                return;
            }
            if (cpf && cnpj) {
                alert("Por favor, preencha APENAS o CPF ou o CNPJ, não os dois.");
                setIsSavingAddress(false);
                return;
            }
            const personalDataPayload = {
                id: user.id,
                cpf: cpf || null,
                cnpj: cnpj || null
            };
            await patchUser(personalDataPayload);

            const formData = new FormData(enderecoFormRef.current);
            const addressData = {
                address_street: formData.get('rua'),
                address_number: formData.get('numero'),
                address_complement: formData.get('complemento'),
                address_neighborhood: formData.get('bairro'),
                address_city: formData.get('cidade'),
                address_state: formData.get('estado'),
                address_zipcode: formData.get('cep'),
            };

            if (!addressData.address_street || !addressData.address_number ||
                !addressData.address_neighborhood || !addressData.address_city ||
                !addressData.address_state || !addressData.address_zipcode) {
                alert("Por favor, preencha todos os campos obrigatórios do endereço.");
                setIsSavingAddress(false);
                return;
            }

            const response = await fetch('/api/v1/user/address', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(addressData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao salvar endereço');
            }

            setIsSavingAddress(false);

            await checkoutCart(itens, calcularTotal());
        } catch (error) {
            setIsSavingAddress(false);
            console.error("Erro ao finalizar compra:", error);
            alert(error.message || "Erro ao processar pagamento. Tente novamente.");
        }
    };
    function formatarPreco(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(valor);
    }

    return (
        <div className={styles.checkoutContainer}>
            <div className={styles.checkoutContent}>

                <div className={styles.formContainer}>
                    <h2>Informações pessoais</h2>
                    <InfosForm user={user} formRef={infosFormRef}></InfosForm>
                    <h2>Endereço de Entrega</h2>
                    <EnderecoForm user={user} formRef={enderecoFormRef}></EnderecoForm>
                    <h2>Itens do pedido</h2>
                    <div className={styles.resumoItens}>
                        {itens.length === 0 ? (
                            <p>Seu carrinho está vazio.</p>
                        ) : (
                            itens.map((item) => (
                                <div className={styles.itemResumo} key={item.listing_id}>
                                    <img
                                        src={item.image_url}
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
                        {calcularFrete() === 0
                            ? "🎉 Frete Grátis!"
                            : "Frete grátis acima de R$ 200,00"}
                    </div>
                    <div className={styles.resumoLinha}>
                        <span>Subtotal:</span>
                        <span>{formatarPreco(calcularSubtotal())}</span>
                    </div>
                    <div className={styles.resumoLinha}>
                        <span>Frete:</span>
                        <span>
                            {calcularFrete() === 0
                                ? "Grátis"
                                : formatarPreco(calcularFrete())}
                        </span>
                    </div>
                    <div className={styles.resumoTotal}>
                        <span>Total:</span>
                        <span>{formatarPreco(calcularTotal())}</span>
                    </div>
                    <button
                        className={styles.finalizarBtn}
                        onClick={handleFinalizarCompra}
                        disabled={isCheckoutLoading || isSavingAddress || itens.length === 0}
                    >
                        {isSavingAddress ? "Salvando..." : isCheckoutLoading ? "Processando..." : "Finalizar Compra"}
                    </button>
                </div>
            </div>
        </div>
    );
}
function InfosForm({ user, formRef }) {
    return (
        <form className={styles.enderecoForm} ref={formRef}>
            <div className={styles.formBackground}>
                <div className={styles.infoFormContainer}>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="name" className={styles.label}>
                            Nome completo*
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="name"
                            className={styles.input}
                            placeholder="Fulano da Silva"
                            defaultValue={user?.name || ''}
                            readOnly
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="cpf" className={styles.label}>
                            CPF
                        </label>
                        <input
                            id="cpf"
                            name="cpf"
                            type="text"
                            className={styles.input}
                            placeholder="Somente números."
                            defaultValue={user?.cpf || ''}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="cnpj" className={styles.label}>
                            CNPJ
                        </label>
                        <input
                            id="cnpj"
                            name="cnpj"
                            type="text"
                            className={styles.input}
                            placeholder="Somente números."
                            defaultValue={user?.cnpj || ''}
                        />
                    </div>
                </div>
            </div>
        </form >
    );
}


function EnderecoForm({ user, formRef }) {
    return (
        <form className={styles.enderecoForm} ref={formRef}>
            <div className={styles.formBackground}>
                <div className={styles.enderecoFormContainer1}>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="cep" className={styles.label}>
                            CEP*
                        </label>
                        <input
                            id="cep"
                            name="cep"
                            type="text"
                            className={styles.input}
                            placeholder="99999-999"
                            defaultValue={user?.address_zipcode || ''}
                            required
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="rua" className={styles.label}>
                            Rua*
                        </label>
                        <input
                            id="rua"
                            name="rua"
                            type="text"
                            className={styles.input}
                            placeholder="Ruas das Flores"
                            defaultValue={user?.address_street || ''}
                            required
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="numero" className={styles.label}>
                            Número*
                        </label>
                        <input
                            id="numero"
                            name="numero"
                            type="text"
                            className={styles.input}
                            placeholder="123"
                            defaultValue={user?.address_number || ''}
                            required
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="complemento" className={styles.label}>
                            Complemento
                        </label>
                        <input
                            id="complemento"
                            name="complemento"
                            type="text"
                            className={styles.input}
                            placeholder="Apto, Bloco, Casa"
                            defaultValue={user?.address_complement || ''}
                        />
                    </div>
                </div>

                <div className={styles.enderecoFormContainer2}>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="bairro" className={styles.label}>
                            Bairro*
                        </label>
                        <input
                            id="bairro"
                            name="bairro"
                            type="text"
                            className={styles.input}
                            placeholder="Planalto"
                            defaultValue={user?.address_neighborhood || ''}
                            required
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="cidade" className={styles.label}>
                            Cidade*
                        </label>
                        <input
                            id="cidade"
                            name="cidade"
                            type="text"
                            className={styles.input}
                            placeholder="Natal"
                            defaultValue={user?.address_city || ''}
                            required
                        />
                    </div>

                    <div className={styles.fieldGroupHalf}>
                        <label htmlFor="estado" className={styles.label}>
                            Estado*
                        </label>
                        <select
                            id="estado"
                            name="estado"
                            className={styles.select}
                            defaultValue={user?.address_state || ''}
                            required
                        >
                            <option value=""> </option>
                            <option value="AC">Acre</option>
                            <option value="AL">Alagoas</option>
                            <option value="AP">Amapá</option>
                            <option value="AM">Amazonas</option>
                            <option value="BA">Bahia</option>
                            <option value="CE">Ceará</option>
                            <option value="DF">Distrito Federal</option>
                            <option value="ES">Espírito Santo</option>
                            <option value="GO">Goiás</option>
                            <option value="MA">Maranhão</option>
                            <option value="MT">Mato Grosso</option>
                            <option value="MS">Mato Grosso do Sul</option>
                            <option value="MG">Minas Gerais</option>
                            <option value="PA">Pará</option>
                            <option value="PB">Paraíba</option>
                            <option value="PR">Paraná</option>
                            <option value="PE">Pernambuco</option>
                            <option value="PI">Piauí</option>
                            <option value="RJ">Rio de Janeiro</option>
                            <option value="RN">Rio Grande do Norte</option>
                            <option value="RS">Rio Grande do Sul</option>
                            <option value="RO">Rondônia</option>
                            <option value="RR">Roraima</option>
                            <option value="SC">Santa Catarina</option>
                            <option value="SP">São Paulo</option>
                            <option value="SE">Sergipe</option>
                            <option value="TO">Tocantins</option>
                        </select>
                    </div>
                </div>

            </div>
        </form >
    );
}
