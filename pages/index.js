import LayoutPadrao from "components/LayoutPadrao";
import SearchBar from "components/SearchBar";
import styles from "styles/catalogo/home.module.css";

export default function HomePage() {
  return (
    <LayoutPadrao>
      <header className={styles.header}>
        <SearchBar />
      </header>

      <div>
        <h1>Bem-vindo à tela inicial</h1>
        <p>Este é o E-Play.</p>
      </div>

    </LayoutPadrao>
  );
}