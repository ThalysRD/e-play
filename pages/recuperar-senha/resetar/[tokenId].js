import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "styles/cadastro_login/login.module.css";
import BackgroundShapes from "components/BackgroundShapes";
import LogoIMG from "components/LogoIMG";
import { FaLock } from "react-icons/fa";

export default function ResetarSenhaPage() {
  const router = useRouter();
  const { tokenId } = router.query;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!newPassword || !confirmPassword) {
      setError("Preencha todos os campos");
      return;
    }

    if (newPassword.length < 8) {
      setError("Senha deve ter no mínimo 8 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/v1/passwords/reset/${tokenId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao resetar senha");
      }

      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <BackgroundShapes />
      <LogoIMG className={styles.loginLogo} />

      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <div className={styles.formBackground}>
          <h2 className={styles.title}>Resetar Senha</h2>

          <div className={styles.fieldGroup}>
            <div className={styles.inputContainer}>
              <FaLock className={styles.inputIcon} aria-hidden="true" />
              <input
                type="password"
                placeholder="Nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.input}
                aria-label="Nova Senha"
                required
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.inputContainer}>
              <FaLock className={styles.inputIcon} aria-hidden="true" />
              <input
                type="password"
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                aria-label="Confirmar Senha"
                required
              />
            </div>
          </div>

          {error && <div className={styles.errorMessage}>❌ {error}</div>}
          {success && (
            <div className={styles.successMessage}>
              ✅ Senha resetada com sucesso! Redirecionando para login...
            </div>
          )}

          <button
            type="submit"
            className={styles.loginButton}
            disabled={loading || success}
          >
            {loading ? "Atualizando..." : "Atualizar Senha"}
          </button>
        </div>
      </form>
    </div>
  );
}
