import Link from "next/link";
import styles from "styles/configuracoes.module.css";

export default function ConfiguracoesPage() {
  return (
    <div className={styles.container}>
      <h1>Configurações</h1>

      <section className={styles.section}>
        <h2>Conta</h2>
        {/* ...outras opções de configuração... */}
      </section>

      <section className={styles.section}>
        <h2>Anúncios</h2>
        <p>Gerencie seus anúncios, edite e acompanhe o desempenho.</p>

        <div className={styles.actions}>
          <Link href="/item/criar" className={styles.primaryButton}>
            + Criar Anúncio
          </Link>

          <Link href="/configuracoes/meus-anuncios" className={styles.secondaryButton}>
            Meus Anúncios
          </Link>
        </div>
      </section>
    </div>
  );
}