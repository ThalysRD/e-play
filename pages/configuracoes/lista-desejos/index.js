import { useRouter } from "next/router";
import useUser from "/hooks/useUser";
import styles from "/styles/configuracoes/lista-desejos.module.css";
import load from "styles/componentes/loading.module.css";
import { useEffect, useState } from "react";
import ListingCardFav from "components/ListingCardFav";
import Modal from "components/ModalPadrao";

export default function ListaDesejos() {
    const router = useRouter();
    const { user, isLoading: userLoading, isError: userError } = useUser();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedListingId, setSelectedListingId] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        if (!userLoading && !user) {
            router.push("/login");
        }
    }, [userLoading, user, router]);

    useEffect(() => {
        if (user && user.id) {
            fetchUserListings();
        }
    }, [user]);

    const fetchUserListings = async () => {
        if (!user || !user.wish_list) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch("/api/v1/listings");
            if (!response.ok) throw new Error("Falha ao carregar anúncios");

            const allListings = await response.json();

            const userWishlistListings = allListings.filter((listing) =>
                user.wish_list.includes(listing.id)
            );

            setListings(userWishlistListings);
        } catch (err) {
            console.error("Erro ao carregar anúncios:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const openRemoveModal = (id) => {
        setSelectedListingId(id);
        setIsModalOpen(true);
    };

    const handleRemove = async () => {
        if (!selectedListingId || updatingId) return;

        setUpdatingId(selectedListingId);

        try {
            const response = await fetch(`/api/v1/user/wishlist`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ listingId: selectedListingId }),
            });

            if (!response.ok) {
                throw new Error("Falha ao remover anúncio da lista");
            }

            setListings((currentListings) =>
                currentListings.filter((l) => l.id !== selectedListingId)
            );

            setIsModalOpen(false);
        } catch (err) {
            console.error("Erro ao remover anúncio:", err);
            alert("Erro ao remover anúncio: " + err.message);
        } finally {
            setUpdatingId(null);
            setSelectedListingId(null);
        }
    };

    if (userLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.mainContent}>
                    <p className={styles.loadingMessage}>Carregando...</p>
                </div>
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
                    <h2>Lista de desejos</h2>
                    <div className={styles.divider} />
                </header>

                {loading ? (
                    <div className={load.loadingContainer}>
                        <div className={load.spinner}></div>
                    </div>
                ) : error ? (
                    <p className={styles.errorMessage}>
                        Erro ao carregar anúncios: {error}
                    </p>
                ) : listings.length === 0 ? (
                    <div className={styles.emptyState}>
                        <h2 className={styles.emptyTitle}>Nada por aqui ainda :(</h2>
                    </div>
                ) : (
                    <>
                        <div className={styles.listingsGrid}>
                            {listings.map((listing) => (
                                <ListingCardFav
                                    key={listing.id}
                                    listing={listing}
                                    onDelete={() => openRemoveModal(listing.id)}
                                    disabled={updatingId === listing.id}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedListingId(null);
                }}
                onConfirm={handleRemove}
                title="Remover dos Favoritos"
                message="Tem certeza que deseja remover este item da sua lista de desejos?"
                isConfirmLoading={!!updatingId}
            />
        </div>
    );
}