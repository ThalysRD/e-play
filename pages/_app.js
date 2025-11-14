import "../styles/globals.css";
import LayoutPadrao from "components/LayoutPadrao";
import { useRouter } from "next/router";
import { CarrinhoProvider } from "hooks/useCarrinho";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Rotas que NÃO usam layout padrão
  const noLayoutRoutes = ["/login", "/cadastro"];

  // Verificar se é uma rota de ativação ou recuperação de senha
  const isActivationRoute = router.pathname.includes("/cadastro/ativar");
  const isPasswordRoute = router.pathname.includes("/recuperar-senha");

  // Se é login, cadastro, ativação ou recuperação de senha, não usar layout padrão
  if (noLayoutRoutes.includes(router.pathname) || isActivationRoute || isPasswordRoute) {
    return (
      <CarrinhoProvider>
        <Component {...pageProps} />
      </CarrinhoProvider>
    );
  }

  return (
    <CarrinhoProvider>
      <LayoutPadrao>
        <Component {...pageProps} />
      </LayoutPadrao>
    </CarrinhoProvider>
  );
}
