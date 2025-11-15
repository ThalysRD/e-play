import { useRouter } from "next/router";
import useUser from "/hooks/useUser";
import styles from "/styles/configuracoes/meus-pedidos.module.css";
import load from "styles/componentes/loading.module.css";
import { useEffect, useState } from "react";
import PedidoCard from "components/PedidoCard";

export default function MeusPedidos() {
    const router = useRouter();
    const { user, isLoading: userLoading, isError: userError } = useUser();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userLoading && !user) {
            router.push("/login");
        }
    }, [userLoading, user, router]);

    useEffect(() => {
        if (user && user.id) {
            fetchUserOrders();
        }
    }, [user]);

    const fetchUserOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/v1/orders");

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Falha ao carregar pedidos");
            }
            const fetchedOrders = await response.json();
            setOrders(fetchedOrders);
        } catch (err) {
            console.error("Erro ao carregar pedidos:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (userLoading) {
        return (
            <div className={load.loadingContainer}>
                <div className={load.spinner}></div>
            </div>
        );
    }

    if (userError || !user) {
        return (
            <div className={styles.container}>
                <div className={styles.mainContent}>
                    <p className={styles.errorMessage}>
                        Erro ao carregar página. Por favor, tente novamente.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.mainContent}>
                <header className={styles.header}>
                    <h2>Meus pedidos</h2>
                    <div className={styles.divider} />
                </header>

                {loading ? (
                    <div className={load.loadingContainer}>
                        <div className={load.spinner}></div>
                    </div>
                ) : error ? (
                    <p className={styles.errorMessage}>
                        Erro ao carregar pedidos: {error}
                    </p>
                ) : orders.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🛒</div>
                        <h2 className={styles.emptyTitle}>Nenhum pedido encontrado</h2>
                        <p className={styles.emptyMessage}>
                            Você ainda não realizou nenhum pedido. Que tal explorar a loja?
                        </p>
                        <button className={styles.createButton} onClick={() => router.push("/")}>
                            Ver produtos
                        </button>
                    </div>
                ) : (
                    <div className={styles.ordersList}>
                        {orders.map((order) => (
                            <PedidoCard
                                key={order.id}
                                order={order}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}