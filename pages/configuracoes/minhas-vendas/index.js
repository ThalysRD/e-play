import { useRouter } from "next/router";
import useUser from "/hooks/useUser";
import styles from "/styles/configuracoes/minhas-vendas.module.css";
import load from "styles/componentes/loading.module.css";
import { useEffect, useState } from "react";
import PedidoCardVendedor from "components/PedidoCardVendedor";

export default function MinhasVendas() {
    const router = useRouter();
    const { user, isLoading: userLoading, isError: userError } = useUser();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userLoading && !user) {
            router.push("/login");
        }
    }, [userLoading, user, router]);

    useEffect(() => {
        if (user && user.id) {
            fetchUserSales();
        }
    }, [user]);

    const fetchUserSales = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/v1/orders/seller");

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Falha ao carregar vendas");
            }
            const fetchedSales = await response.json();
            setSales(fetchedSales);
        } catch (err) {
            console.error("Erro ao carregar vendas:", err);
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
                    <h2>Minhas vendas</h2>
                    <div className={styles.divider} />
                </header>

                {loading ? (
                    <div className={load.loadingContainer}>
                        <div className={load.spinner}></div>
                    </div>
                ) : error ? (
                    <p className={styles.errorMessage}>
                        Erro ao carregar vendas: {error}
                    </p>
                ) : sales.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📦</div>
                        <h2 className={styles.emptyTitle}>Nenhuma venda encontrada</h2>
                        <p className={styles.emptyMessage}>
                            Você ainda não realizou nenhuma venda.
                        </p>
                    </div>
                ) : (
                    <div className={styles.ordersList}>
                        {sales.map((order) => (
                            <PedidoCardVendedor
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