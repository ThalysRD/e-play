import "../styles/globals.css";
import LayoutPadrao from "components/LayoutPadrao";


export default function App({ Component, pageProps }) {
  return (
    <LayoutPadrao>
      <Component {...pageProps} />
    </LayoutPadrao>
  );
}
