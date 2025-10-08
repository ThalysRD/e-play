import styles from "styles/layout.padrao.module.css";
import { IoHome, IoCart, IoSettings } from "react-icons/io5";
import Link from "next/link";
import { useRouter } from "next/router";
import LogoIMG from "./LogoFooter";
import { useEffect, useState } from "react";

export default function LayoutPadrao({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const name = localStorage.getItem('userName');
    if (token && name) setUser({name});
  },[]);

  return (
    <div className={styles.pageContainer}>
      <nav className={styles.sidebar}>
        <div>
          
          {user ? (
            <h2 className={styles.greeting}>Olá, {user.name}!</h2>
          ) : (
            <div className={styles.navLoginCadastro}>
              <Link href="/login" className={styles.navLink}>
                <li className={`${styles.navItemLoginCadastro} ${router.pathname === "/login" ? styles.active : ""}`}>
                  <span>Entre</span>
                </li>
              </Link>
            </div>
          )}

          <ul className={styles.navList}>
            <Link href="/" className={styles.navLink}>
              <li className={`${styles.navItem} ${router.pathname === "/" ? styles.active : ""}`}>
                <IoHome size={20} />
                <span>Catálogo</span>
              </li>
            </Link>
            
            <Link href="/carrinho" className={styles.navLink}>
              <li className={`${styles.navItem} ${router.pathname === "/carrinho" ? styles.active : ""}`}>
                <IoCart size={20} />
                <span>Carrinho</span>
              </li>
            </Link>
              
            <Link href="/configuracoes" className={styles.navLink}>
              <li className={`${styles.navItem} ${router.pathname === "/configuracoes" ? styles.active : ""}`}>
                <IoSettings size={20} />
                <span>Configurações</span>
              </li>
            </Link>
          </ul>
        </div>
      </nav>

      <div className={styles.contentWrapper}>
        <main className={styles.mainContent}>{children}</main>

        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.footerColumn}>
              <div className={styles.logoContainer}><LogoIMG /></div>
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
