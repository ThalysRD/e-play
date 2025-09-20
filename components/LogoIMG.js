import styles from "styles/cadastro.module.css";

export default function LogoImage() {
  return (
    <div className={styles.logo}>
      <img
        src="/assets/Frame 196.svg"
        alt="E-Play Logo"
        className={styles.logoImage}
      />
    </div>
  );
}
