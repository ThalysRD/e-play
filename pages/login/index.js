import { useState } from "react";
import useSWRMutation from "swr/mutation";
import Link from "next/link";
import styles from "styles/login.module.css";
import BackgroundShapes from "components/BackgroundShapes";
import LogoIMG from "components/LogoIMG";
import { FaUser, FaLock } from "react-icons/fa";

async function sendLoginRequest(url, { arg }) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Erro ao fazer login");
  }

  return await response.json();
}

export default function LoginPage() {
  return (
    <div className={styles.pageContainer}>
      <BackgroundShapes />
      <LogoIMG />
      <LoginForm />

      {/* Rodapé */}
      <div className={styles.legalLinksContainer}>
        <a href="/termos-de-uso" className={styles.termsOfUseLink}>
          Termos de Uso
        </a>
        <span className={styles.linkSeparator}>|</span>
        <a href="/politicas-de-privacidade" className={styles.privacyPolicyLink}>
          Políticas de Privacidade
        </a>
      </div>
    </div>
  );
}

function LoginForm() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const { trigger, isMutating } = useSWRMutation("/api/v1/login", sendLoginRequest);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.username || !formData.password) {
      setError("Preencha todos os campos!");
      return;
    }

    try {
      await trigger(formData);
      alert("✅ Login realizado com sucesso!");
      // se quiser redirecionar: window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.loginForm} aria-label="Formulário de login">
      <div className={styles.formBackground} aria-hidden="true"></div>
      <h2 className={styles.title}>Bem vindo de volta!</h2>

      <div className={styles.fieldGroup}>
        <div className={styles.inputContainer}>
          <FaUser className={styles.inputIcon} aria-hidden="true" />
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className={styles.input}
            aria-label="Nome de usuário"
          />
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.inputContainer}>
          <FaLock className={styles.inputIcon} aria-hidden="true" />
          <input
            type="password"
            name="password"
            placeholder="Senha"
            value={formData.password}
            onChange={handleChange}
            className={styles.input}
            aria-label="Senha"
          />
        </div>
      </div>

      <div className={styles.optionsRow}>
        <label className={styles.rememberMe}>
          <input type="checkbox" className={styles.checkbox} />
          Lembrar de mim
        </label>
        <Link href="/recuperar-senha" className={styles.forgotLink}>
          Esqueci minha senha
        </Link>
      </div>

      {error && <div className={styles.errorMessage}>❌ {error}</div>}

      <button type="submit" className={styles.loginButton} disabled={isMutating}>
        {isMutating ? "Entrando..." : "Entrar"}
      </button>

      <p className={styles.registerPrompt}>
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className={styles.createAccountLink}>
          Crie agora!
        </Link>
      </p>
    </form>
  );
}
