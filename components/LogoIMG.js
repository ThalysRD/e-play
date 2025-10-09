import styles from "styles/componentes/LogoIMG.module.css";

export default function LogoImage({ className }) {
  return (
    <div className={`${styles.logo} ${className || ""}`}>
      <img
        src="/assets/Frame 196.svg"
        alt="E-Play Logo"
        className={styles.logoImage}
      />
    </div>
  );
}