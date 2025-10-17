import React from "react";
import styles from "styles/configuracoes/config.module.css";
import load from "styles/componentes/loading.module.css";
import { useEffect, useState } from "react";
import { FaUserEdit, FaBullhorn, FaBoxOpen, FaStar, FaTruck, FaCreditCard, FaHeadset } from "react-icons/fa";
import Link from "next/link";
import useUser from "/hooks/useUser";

const ConfiguracoesPage = () => {
  const { user, isLoading } = useUser();
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.configuracoesBackground}>
      <header className={styles.header}>
        <div className={styles.infosUser}>
          {!isLoading && user != null ? (
            <><img src={user.profile_image_url || "/assets/AvatarPadrao.svg"} className={styles.profilePic} />
              <div className={styles.userInfoText}>
                <div className={styles.userInfo}>
                  <h2 className={styles.userName}>{user.name}</h2>
                </div>
                <div className={styles.userDetails}>
                  <div className={styles.column}>
                    <p><span className={styles.label}>Usuário:</span> @{user.username}</p>
                    <p><span className={styles.label}>Email:</span> {user.email}</p>
                  </div>
                  <div className={styles.column}>
                    <p><span className={styles.label}>Sobre mim:</span> {user.profile_bio || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={load.loadingContainer}>
              <div className={load.spinner}></div>
            </div>
          )}
        </div>
      </header>
      <main className={styles.body}>
        <div className={styles.optionsContainer}>
          {/* Seção Conta */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Conta</h3>
            <div className={styles.buttonsGrid}>
              <Link href="/configuracoes/editar-perfil" className={`${styles.optionButton} ${styles.btnPurple}`}>
                <span>Editar perfil</span>
                <FaUserEdit size={22} />
              </Link>
              <Link href="/configuracoes/meus-pedidos" className={`${styles.optionButton} ${styles.btnPink}`}>
                <span>Meus pedidos</span>
                <FaBoxOpen size={22} />
              </Link>
              <Link href="/configuracoes/meus-anuncios" className={`${styles.optionButton} ${styles.btnBlue}`}>
                <span>Meus anúncios</span>
                <FaBullhorn size={22} />
              </Link>
              <Link href="/configuracoes/lista-desejos" className={`${styles.optionButton} ${styles.btnGreen}`}>
                <span>Lista de desejos</span>
                <FaStar size={22} />
              </Link>
            </div>
          </section>

          {/* Seção Compras */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Compras</h3>
            <div className={styles.buttonsGrid}>
              <Link href="/configuracoes/enderecos" className={`${styles.optionButton} ${styles.btnBlue}`}>
                <span>Endereço de entrega</span>
                <FaTruck size={22} />
              </Link>
              <Link href="/configuracoes/pagamento" className={`${styles.optionButton} ${styles.btnOrange}`}>
                <span>Métodos de pagamento</span>
                <FaCreditCard size={22} />
              </Link>
            </div>
          </section>

          {/* Seção Ajuda */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Ajuda</h3>
            <div className={styles.buttonsGrid}>
              <Link href="/suporte" className={`${styles.optionButton} ${styles.btnGreen}`}>
                <span>Suporte ao cliente</span>
                <FaHeadset size={22} />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ConfiguracoesPage;