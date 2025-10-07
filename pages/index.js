import styles from "styles/home.module.css";
import { IoHome, IoCart, IoSettings } from "react-icons/io5";
import LogoIMG from "components/LogoFooter";

export default function HomePage() {
  return (
    <div className={styles.pageContainer}>
      <nav className={styles.sidebar}>
        <div>
          <h2 className={styles.greeting}>Olá, Fulano!</h2>
          <ul className={styles.navList}>

            <li className={`${styles.navItem} ${styles.active}`}>
              <IoHome size={20} />
              <span>Catálogo</span>
            </li>
            <li className={styles.navItem}>
              <IoCart size={20} />
              <span>Carrinho</span>
            </li>
            <li className={styles.navItem}>
              <IoSettings size={20} />
              <span>Configurações</span>
            </li>
          </ul>
        </div>
      </nav>
      
      <div className={styles.contentWrapper}>
        <main className={styles.mainContent}>
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerContent}>

            <div className={styles.footerColumn}>
              <div className={styles.logoContainer}>
                <LogoIMG/>
              </div>
              <p>© 2025 E-play.</p>
              <p>Todos os direitos reservados</p>
            </div>
            <div className={styles.footerColumn}>
              <p>SOBRE O E-PLAY</p>
              <ul>
                <li><a href="#">Sobre nós</a></li>
                <li><a href="#">Termos de Uso</a></li>
                <li><a href="#">Políticas de Privacidade</a></li>
              </ul>
            </div>
            <div className={styles.footerColumn}>
              <p>AJUDA</p>
              <ul>
                <li><a href="#">Perguntas frequentes</a></li>
                <li><a href="#">Métodos de Pagamento</a></li>
                <li><a href="#">Devolução e Reembolso</a></li>
              </ul>
            </div>

          </div>
        </footer>
      </div>

    </div>
  );
}