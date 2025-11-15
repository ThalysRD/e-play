import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "styles/componentes/PedidoCardVendedor.module.css";
import load from "styles/componentes/loading.module.css";


export default function PedidoCardVendedor({ order }) {
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                <p className={styles.listingTitle}>
                    {listing.title}
                </p>
                <p>N° pedido: {(order.id)} </p>
                <p className={styles.orderDate}>Pedido feito em: {new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
                <div className={styles.row}>
                    <p> Código de rastreio: </p>
                    <p className={styles.negritoInfo}> {(order.tracking_code) || "Não informado"} </p>
                </div>
                <p className={styles.status}> Status: {(order.status)} </p>
                <p className={styles.quantity}>Dados pessoais: *nome e cpf/cnpj colocado na hora da compra*</p>
                <p className={styles.quantity}>Endereço de entrega: *endereço colocado na hora da compra*</p>
                <p className={styles.quantity}>Quantidade: {quantityText}</p>
                <p className={styles.listingPrice}>Total pago: R$ {Number(order.total_price).toFixed(2)}</p>
            </div>
        </div>
    );
}