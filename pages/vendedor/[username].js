import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import styles from "styles/vendedor/vendedor.module.css";
import load from "styles/componentes/loading.module.css";
import ListingCard from "components/ListingCard";

export default function PaginaVendedor() {
    const router = useRouter();
    const { username } = router.query;
    const [vendedor, setVendedor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (username) {
            fetchVendedorData();
        }
    }, [username]);

    async function fetchVendedorData() {
        try {
            setLoading(true);
            setError("");
            const response = await fetch(`/api/v1/users/public-profile/${username}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("Vendedor não encontrado");
                }
                throw new Error("Falha ao buscar dados do vendedor");
            }

            const data = await response.json();
            setVendedor(data);
        } catch (err) {
            console.error('[PaginaVendedor] Error fetching data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className={styles.vendedorBackground}>
                <div className={load.loadingContainer} style={{ minHeight: '100vh' }}>
                    <div className={load.spinner}></div>
                </div>
            </div>
        );
    }

    if (error || !vendedor) {
        return (
            <div className={styles.vendedorBackground}>
                <main className={styles.body} style={{ textAlign: 'center' }}>
                    <h2 className={styles.sectionTitle} style={{ color: 'red' }}>
                        {error || "Vendedor não encontrado."}
                    </h2>
                    <Link href="/">
                        <a style={{ color: 'white', textDecoration: 'underline' }}>Voltar para a Home</a>
                    </Link>
                </main>
            </div>
        );
    }

    return (
        <div className={styles.vendedorBackground}>
            <header className={styles.header}>
                <div className={styles.infosUser}>
                    <img
                        src={vendedor.profile_image_url || "/assets/AvatarPadrao.svg"}
                        className={styles.profilePic}
                        alt={`Foto de perfil de ${vendedor.name}`}
                    />
                    <div className={styles.userInfoText}>
                        <div className={styles.userInfo}>
                            <h2 className={styles.userName}>{vendedor.name || 'Nome não informado'}</h2>
                        </div>
                        <div className={styles.userDetails}>
                            <div className={styles.column}>
                                <p><span className={styles.label}>Usuário:</span> @{vendedor.username}</p>
                                <p><span className={styles.label}>Localidade:</span> {vendedor.address_city && vendedor.address_state ? `${vendedor.address_city}, ${vendedor.address_state}` : "Não informado"}</p>
                            </div>
                            <div className={styles.column}>
                                <p><span className={`${styles.label} ${styles.bioLabel}`}>Sobre mim:</span> {vendedor.profile_bio || 'Não informado'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Grid de Anúncios */}
            <main className={styles.body}>
                <div className={styles.optionsContainer}>
                    <section className={styles.featuredSection}>
                        <h2 className={styles.sectionTitle}>
                            {vendedor.listings && vendedor.listings.length > 0
                                ? `Anúncios deste vendedor (${vendedor.listings.length}):`
                                : "Este vendedor ainda não publicou anúncios"}
                        </h2>
                        <div className={styles.listingsGrid}>
                            {vendedor.listings && vendedor.listings.map((listing) => (
                                <ListingCard key={listing.id} listing={listing} />
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}