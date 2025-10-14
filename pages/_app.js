import "../styles/globals.css";
import LayoutPadrao from "components/LayoutPadrao";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const noLayoutRoutes = ["/login", "/cadastro"];

  if (noLayoutRoutes.includes(router.pathname)) {
    return <Component {...pageProps} />;
  }
  return (
    <LayoutPadrao>
      <Component {...pageProps} />
    </LayoutPadrao>
  );
}
