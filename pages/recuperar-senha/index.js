import { useState } from "react";
import styles from "styles/cadastro_login/login.module.css";
import BackgroundShapes from "components/BackgroundShapes";
import LogoIMG from "components/LogoIMG";
import Link from "next/link";
import { FaUser } from "react-icons/fa";

export default function RecuperarSenhaPage() {
  return (
    <div className={styles.pageContainer}>
      <BackgroundShapes />
      <LogoIMG className={styles.loginLogo} />
      <RecuperarSenhaForm />
      <div className={styles.legalLinksContainer}>
        <a href="/termos-de-uso" className={styles.termsOfUseLink}>
          Termos de Uso
        </a>
        <span className={styles.linkSeparator}>|</span>
        <a
          href="/politicas-de-privacidade"
          className={styles.privacyPolicyLink}
        >
          Políticas de Privacidade
        </a>
      </div>
    </div>
  );
}

function RecuperarSenhaForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email) {
      setError("Digite seu email");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/v1/passwords/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao enviar email");
      }

      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.loginForm}>
      <div className={styles.formBackground}>
        <h2 className={styles.title}>Recuperar Senha</h2>

        <p style={{ textAlign: "center", color: "#ccc", marginBottom: "20px" }}>
          Digite seu email para receber um link de recuperação
        </p>

        <div className={styles.fieldGroup}>
          <div className={styles.inputContainer}>
            <FaUser className={styles.inputIcon} aria-hidden="true" />
            <input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              aria-label="Email"
              required
            />
          </div>
        </div>

        {error && <div className={styles.errorMessage}>❌ {error}</div>}
        {success && (
          <div className={styles.successMessage}>
            ✅ Email enviado! Verifique sua caixa de entrada
          </div>
        )}

        <button
          type="submit"
          className={styles.loginButton}
          disabled={loading}
        >
          {loading ? "Enviando..." : "Enviar Link de Recuperação"}
        </button>

        <div style={{ textAlign: "center", marginTop: "15px" }}>
          <Link href="/login" className={styles.forgotLink}>
            Voltar para login
          </Link>
        </div>
      </div>
    </form>
  );
}
