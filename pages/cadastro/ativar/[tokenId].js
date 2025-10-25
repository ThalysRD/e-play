import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "styles/cadastro_login/cadastro.module.css";
import BackgroundShapes from "components/BackgroundShapes";
import LogoIMG from "components/LogoIMG";

export default function ActivateAccountPage() {
  const router = useRouter();
  const { tokenId } = router.query;
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Ativando sua conta...");

  useEffect(() => {
    if (!tokenId) return;

    const activateAccount = async () => {
      try {
        setStatus("loading");
        setMessage("Ativando sua conta...");

        const response = await fetch(`/api/v1/activations/${tokenId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao ativar conta");
        }

        setStatus("success");
        setMessage("✅ Conta ativada com sucesso!");

        // Redirecionar para homepage após 1.5s
        // O cookie de sessão já foi setado pelo servidor
        setTimeout(() => {
          // Usar window.location para forçar reload e reconhecer o cookie
          window.location.href = "/";
        }, 1500);
      } catch (error) {
        setStatus("error");
        setMessage(`❌ ${error.message || "Erro ao ativar conta"}`);
      }
    };

    activateAccount();
  }, [tokenId, router]); return (
    <div className={styles.pageContainer}>
      <BackgroundShapes />
      <LogoIMG className={styles.loginLogo} />

      <div className={styles.formBackground}>
        <div className={styles.formContainer}>
          {status === "loading" && (
            <div className={styles.messageContainer}>
              <div className={styles.spinner}></div>
              <p>{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className={styles.successMessage}>
              <p>{message}</p>
              <p>Redirecionando para a homepage...</p>
            </div>
          )}                    {status === "error" && (
            <div className={styles.errorMessage}>
              <p>{message}</p>
              <button
                onClick={() => router.push("/cadastro")}
                className={styles.submitButton}
              >
                Voltar para cadastro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
