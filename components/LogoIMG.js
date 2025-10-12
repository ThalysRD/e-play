import styles from "styles/componentes/LogoIMG.module.css";
import Link from "next/link";

export default function LogoImage({ className }) {
  return (
    <Link href="/" className={`${styles.logo} ${className || ""}`}>
      <img
        src="/assets/Frame 196.svg"
        alt="E-Play Logo"
        className={styles.logoImage}
      />
    </Link>
  );
}
