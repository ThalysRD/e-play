import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "styles/componentes/PedidoCardVendedor.module.css";
import load from "styles/componentes/loading.module.css";

export default function PedidoCardVendedor({ order }) {
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [trackingCode, setTrackingCode] = useState(order?.tracking_code || "");
    const [status, setStatus] = useState(order?.status || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingTracking, setIsSavingTracking] = useState(false);

    useEffect(() => {
        if (!order.listing_id) {
            setError("ID do anúncio não encontrado no pedido.");
            setLoading(false);
            return;
        }

        async function fetchListingDetails() {
            try {
                setLoading(true);
                const response = await fetch(`/api/v1/listings/${order.listing_id}`);
                if (!response.ok) {
                    throw new Error("Não foi possível carregar os dados do item");
                }
                const data = await response.json();
                setListing(data);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchListingDetails();
    }, [order.listing_id]);

    const handleSaveTrackingCode = async () => {
        if (!trackingCode.trim()) {
            alert("Por favor, informe um código de rastreio válido.");
            return;
        }

        try {
            setIsSavingTracking(true);
            const response = await fetch(`/api/v1/orders/${order.id}/tracking`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ tracking_code: trackingCode }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erro ao salvar código de rastreio");
            }

            alert("Código de rastreio salvo com sucesso!");
            window.location.reload();
        } catch (err) {
            console.error("Erro ao salvar código de rastreio:", err);
            alert(err.message);
        } finally {
            setIsSavingTracking(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!window.confirm(`Tem certeza que deseja alterar o status para "${getStatusLabel(newStatus)}"?`)) {
            return;
        }

        try {
            setIsSaving(true);
            const response = await fetch(`/api/v1/orders/${order.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erro ao atualizar status");
            }

            alert("Status atualizado com sucesso!");
            window.location.reload();
        } catch (err) {
            console.error("Erro ao atualizar status:", err);
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusLabel = (statusValue) => {
        const statusMap = {
            pending: "Pendente",
            processing: "Em preparação",
            shipped: "Enviado",
            delivered: "Entregue",
            canceled: "Cancelado",
        };
        return statusMap[statusValue] || statusValue;
    };

    const canChangeStatus = () => {
        return order.status !== "shipped" && order.status !== "canceled" && order.status !== "delivered";
    };

    if (loading) {
        return (
            <div className={load.loadingContainer}>
                <div className={load.spinner}></div>
            </div>
        );
    }

    if (error || !listing) {
        return (
            <div className={styles.listingCard}>
                <p>Erro ao carregar item: {error || "Item não encontrado"}</p>
                <p>Pedido ID: {order.id}</p>
            </div>
        );
    }

    const firstImage = listing.images?.[0];
    const quantityText =
        order.quantity > 1 ? `${order.quantity} unidades` : "1 unidade";

    return (
        <div className={styles.listingCard}>
            <Link href={`/item/${listing.id}`}>
                <div className={styles.imageContainer}>
                    {firstImage ? (
                        <img
                            src={firstImage.image_url}
                            alt={listing.title}
                            className={styles.listingImage}
                        />
                    ) : (
                        <div className={styles.noImage}>🖼️</div>
                    )}
                </div>
            </Link>

            <div className={styles.listingInfo}>
                <p className={styles.listingTitle}>{listing.title}</p>
                <p>N° pedido: {order.id} </p>
                <p className={styles.orderDate}>
                    Pedido feito em:{" "}
                    {new Date(order.created_at).toLocaleDateString("pt-BR")}
                </p>

                <div className={styles.fieldGroup}>
                    <label htmlFor={`tracking_code_${order.id}`} className={styles.label}>
                        Código de rastreio:
                    </label>
                    {order.tracking_code && (order.status === "shipped" || order.status === "delivered" || order.status === "canceled") ? (
                        <p className={styles.trackingCodeDisplay}>{order.tracking_code}</p>
                    ) : (
                        <div className={styles.row}>
                            <input
                                id={`tracking_code_${order.id}`}
                                name="tracking_code"
                                type="text"
                                className={styles.input}
                                value={trackingCode}
                                onChange={(e) => setTrackingCode(e.target.value)}
                                placeholder="Informe o código!"
                                disabled={order.status === "shipped" || order.status === "delivered" || order.status === "canceled"}
                            />
                            {!order.tracking_code && order.status !== "shipped" && order.status !== "delivered" && order.status !== "canceled" && (
                                <button 
                                    type="button" 
                                    className={`${styles.buttonSave}`}
                                    onClick={handleSaveTrackingCode}
                                    disabled={isSavingTracking || !trackingCode.trim()}
                                >
                                    {isSavingTracking ? "Salvando..." : "Salvar"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <br></br>

                <div className={styles.fieldGroupHalf}>
                    <label className={styles.label}>
                        Status do pedido: <strong>{getStatusLabel(order.status)}</strong>
                    </label>
                    {canChangeStatus() && (
                        <div className={styles.row}>
                            {order.status === "pending" && (
                                <>
                                    <button
                                        type="button"
                                        className={`${styles.buttonSave}`}
                                        onClick={() => handleUpdateStatus("processing")}
                                        disabled={isSaving}
                                        style={{ marginRight: "8px" }}
                                    >
                                        {isSaving ? "Salvando..." : "Iniciar Preparação"}
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.buttonCancel}`}
                                        onClick={() => handleUpdateStatus("canceled")}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Cancelando..." : "Cancelar Pedido"}
                                    </button>
                                </>
                            )}
                            {order.status === "processing" && (
                                <>
                                    <button
                                        type="button"
                                        className={`${styles.buttonSave}`}
                                        onClick={() => handleUpdateStatus("shipped")}
                                        disabled={isSaving || !trackingCode.trim()}
                                        style={{ marginRight: "8px" }}
                                        title={!trackingCode.trim() ? "Adicione um código de rastreio primeiro" : ""}
                                    >
                                        {isSaving ? "Salvando..." : "Marcar como Enviado"}
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.buttonCancel}`}
                                        onClick={() => handleUpdateStatus("canceled")}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Cancelando..." : "Cancelar Pedido"}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                    {!canChangeStatus() && order.status === "shipped" && (
                        <p style={{ color: "#4CAF50", fontStyle: "italic", marginTop: "8px" }}>
                            Aguardando confirmação de recebimento do comprador
                        </p>
                    )}
                    {!canChangeStatus() && order.status === "canceled" && (
                        <p style={{ color: "#f44336", fontStyle: "italic", marginTop: "8px" }}>
                            Pedido cancelado
                        </p>
                    )}
                    {!canChangeStatus() && order.status === "delivered" && (
                        <p style={{ color: "#4CAF50", fontStyle: "italic", marginTop: "8px" }}>
                            Pedido entregue e confirmado pelo comprador
                        </p>
                    )}
                </div>

                <p className={styles.status}> </p>

                <p className={styles.quantity}>
                    Dados pessoais: *nome e cpf/cnpj colocado na hora da compra*
                </p>
                <p className={styles.quantity}>
                    Endereço de entrega: *endereço colocado na hora da compra*
                </p>
                <p className={styles.quantity}>Quantidade: {quantityText}</p>
                <p className={styles.listingPrice}>
                    Total pago: R$ {Number(order.total_price).toFixed(2)}
                </p>
            </div>
        </div>
    );
}