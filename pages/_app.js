import "../styles/globals.css";
import LayoutPadrao from "components/LayoutPadrao";
import { useRouter } from "next/router";
import { CarrinhoProvider } from "contexts/CarrinhoContext";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const noLayoutRoutes = ["/login", "/cadastro"];

  if (noLayoutRoutes.includes(router.pathname)) {
    return (
      <CarrinhoProvider>
        <Component {...pageProps} />
      </CarrinhoProvider>
    );
  }
  return (
    // garante q qualquer parte do site tenha acesso ao carrinho
    <CarrinhoProvider>
      <LayoutPadrao>
        <Component {...pageProps} />
      </LayoutPadrao>
    </CarrinhoProvider>
  );
}
