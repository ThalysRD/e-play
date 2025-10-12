import styles from "styles/layout.padrao.module.css";
import { IoHome, IoCart, IoSettings, IoLogOut } from "react-icons/io5";
import Link from "next/link";
import { useRouter } from "next/router";
import LogoIMG from "./LogoFooter";
import { useEffect, useState } from "react";

export default function LayoutPadrao({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/v1/user", { credentials: "include" });
        const data = await res.json();
        if (res.ok) setUser(data);
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  if (isLoading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <nav className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          {user ? (
            <h2 className={styles.greeting}>Olá, {user.name}!</h2>
          ) : (
            <div className={styles.navLoginCadastro}>
              <ul className={styles.navList}>
                <li className={`${styles.navItemLoginCadastro} ${router.pathname === "/login" ? styles.active : ""}`}>
                  <Link href="/login" className={styles.navLinkLoginCadastro}>
                    <span>Bem vindo! :)</span>
                    <span>Entre ou Cadastre-se</span>
                  </Link>
                </li>
              </ul>
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
                <IoHome size={20} />
                <span>Configurações</span>
              </li>
            </Link>
          </ul>
        </div>

        {user && (
          <div className={styles.sidebarBottom}>
            <button onClick={async () => {
              await fetch("/api/v1/sessions", { method: "DELETE" });
              setUser(null);
              router.push("/login");
            }} className={styles.logoutButton}>
              <IoLogOut size={20} />
              Sair
            </button>
          </div>
        )}
      </nav>

      <div className={styles.contentWrapper}>
        <main className={styles.mainContent}>{children}</main>

        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.footerColumn}>
              <div className={styles.logoContainer}>
                <LogoIMG />
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