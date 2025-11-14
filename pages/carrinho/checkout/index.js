import React from 'react';
import styles from "styles/carrinho/checkout.module.css";
import { useCarrinho } from "hooks/useCarrinho";
import useCheckout from "hooks/useCheckout";

export default function CheckoutPage() {
    const { checkout, isLoading: isCheckoutLoading } = useCheckout();
    const { itens, calcularSubtotal, calcularFrete, calcularTotal, } = useCarrinho();
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
                    <InfosForm></InfosForm>
                    <h2>Endereço de Entrega</h2>
                    <EnderecoForm></EnderecoForm>
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
                    >
                        Finalizar Compra
                    </button>
                </div>
            </div>
        </div>
    );
}
function InfosForm() {
    return (
        <form className={styles.enderecoForm}>
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
                            placeholder="999.999.999-99"
                        />
                    </div>
                </div>
            </div>
        </form >
    );
}


function EnderecoForm() {
    return (
        <form className={styles.enderecoForm}>
            <div className={styles.formBackground}>
                <div className={styles.enderecoFormContainer1}>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="cep" className={styles.label}>
                            CEP*
                        </label>
                        <input
                            id="cep"
                            name="cep"
                            type="cep"
                            className={styles.input}
                            placeholder="99999-999"
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="rua" className={styles.label}>
                            Rua*
                        </label>
                        <input
                            id="rua"
                            name="rua"
                            type="rua"
                            className={styles.input}
                            placeholder="Ruas das Flores"
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="numero" className={styles.label}>
                            Número*
                        </label>
                        <input
                            id="numero"
                            name="numero"
                            type="numero"
                            className={styles.input}
                            placeholder="123"
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="complemento" className={styles.label}>
                            Complemento
                        </label>
                        <input
                            id="complemento"
                            name="complemento"
                            type="complemento"
                            className={styles.input}
                            placeholder="Apto, Bloco, Casa"
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
                            type="bairro"
                            className={styles.input}
                            placeholder="Planalto"
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="cidade" className={styles.label}>
                            Cidade*
                        </label>
                        <input
                            id="cidade"
                            name="cidade"
                            type="cidade"
                            className={styles.input}
                            placeholder="Natal"
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
