import styles from "styles/layout.padrao.module.css";
import Modal from "./ModalPadrao";
import { IoHome, IoCart, IoSettings, IoLogOut, IoLogIn } from "react-icons/io5";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import LogoIMG from "./LogoFooter";
import useUser from "../hooks/useUser";
import { useCarrinho } from "../hooks/useCarrinho";

export default function LayoutPadrao({ children }) {
  const router = useRouter();

  const { user, isLoading, mutate } = useUser();
  const { quantidadeTotal } = useCarrinho();
  const [isModalOpen, setIsModalOpen] = useState(false);
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }
  const handleLogout = async () => {
    await fetch("/api/v1/sessions", { method: "DELETE" });
    mutate(null, false);
    router.push("/login");
  };

  return (
    <div className={styles.pageContainer}>
      <nav className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          {user ? (
            <h2 className={styles.greeting}>
              Olá,{" "}
              {user.name.split(" ")[0].charAt(0).toUpperCase() +
                user.name.split(" ")[0].slice(1).toLowerCase()}
              !
            </h2>
          ) : (
            <div className={styles.navLoginCadastro}>
              <ul className={styles.navList}>
                <li
                  className={`${styles.navItemLoginCadastro} ${router.pathname === "/login" ? styles.active : ""}`}
                >
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
              <li
                className={`${styles.navItem} ${router.pathname === "/" || router.pathname.startsWith("/catalogo") || router.pathname.startsWith("/item") ? styles.active : ""}`}
              >
                <IoHome size={20} />
                <span>Catálogo</span>
              </li>
            </Link>

            <Link href="/carrinho" className={styles.navLink}>
              <li className={`${styles.navItem} ${styles.cartNavItem} ${router.pathname.startsWith("/carrinho") ? styles.active : ""}`}>
                <IoCart size={20} />
                <span>Carrinho</span>
                {quantidadeTotal > 0 && (
                  <span className={styles.cartBadge}>
                    {quantidadeTotal}
                  </span>
                )}
              </li>
            </Link>

            {/* ----- LOGIN aparece aqui quando NÃO estiver logado (útil para mobile) ----- */}
            {!user && (
              <Link href="/login" className={styles.navLink}>
                <li className={`${styles.navItem} ${router.pathname === "/login" ? styles.active : ""}`}>
                  <IoLogIn size={20} />
                  <span>Entrar</span>
                </li>
              </Link>
            )}

            {user && (
              <Link href="/configuracoes" className={styles.navLink}>
                <li
                  className={`${styles.navItem} ${router.pathname.startsWith("/configuracoes") ? styles.active : ""}`}
                >
                  <IoSettings size={20} />
                  <span>Configurações</span>
                </li>
              </Link>
            )}

            {/* ----- ALTERAÇÃO: BOTÃO SAIR DENTRO DA LISTA PARA ALINHAMENTO MOBILE ----- */}
            {user && (
              <li
                className={styles.navItem}
                onClick={() => setIsModalOpen(true)}
              >
                <IoLogOut size={20} />
                <span>Sair</span>
              </li>
            )}
          </ul>
        </div>

        {/* REMOVIDO: A div .sidebarBottom não é mais necessária para o botão Sair */}
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
                <li>
                  <a href="#">Sobre nós</a>
                </li>
                <li>
                  <a href="#">Termos de Uso</a>
                </li>
                <li>
                  <a href="#">Políticas de Privacidade</a>
                </li>
              </ul>
            </div>
            <div className={styles.footerColumn}>
              <p>AJUDA</p>
              <ul>
                <li>
                  <a href="#">Suporte</a>
                </li>
                <li>
                  <a href="#">Perguntas frequentes</a>
                </li>
                <li>
                  <a href="#">Métodos de Pagamento</a>
                </li>
                <li>
                  <a href="#">Devolução e Reembolso</a>
                </li>
              </ul>
            </div>
          </div>
        </footer>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleLogout}
        title="Sair do E-play"
        message="Você tem certeza que deseja sair da sua conta?"
      />
    </div>
  );
}