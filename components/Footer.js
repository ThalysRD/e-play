import styles from "styles/componentes/Footer.module.css";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <Link href="/" className={styles.homeLink}>
          ← Voltar para a página inicial
        </Link>

        <div className={styles.legalLinksContainer}>
          <a href="/termos-de-uso" className={styles.legalLink}>
            Termos de Uso
          </a>
          <span className={styles.linkSeparator}>|</span>
          <a href="/politicas-de-privacidade" className={styles.legalLink}>
            Políticas de Privacidade
          </a>
        </div>
      </div>
    </footer>
  );
}
