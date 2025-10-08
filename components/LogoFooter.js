import styles from "styles/layout.padrao.module.css";

export default function LogoFooter() {
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
