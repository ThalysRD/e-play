import { useState } from "react";
import useSWRMutation from "swr/mutation";
import Link from "next/link";
import styles from "styles/cadastro_login/cadastro.module.css";
import BackgroundShapes from "components/BackgroundShapes";
import LogoIMG from "components/LogoIMG";

async function sendRequest(url, { arg }) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Erro ao criar a conta");
  }

  return await response.json();
}

export default function RegisterPage() {
  return (
    <div className={styles.pageContainer}>
      <BackgroundShapes />
      <LogoIMG className={styles.loginLogo} />
      <RegisterForm />
      <div className={styles.legalLinksContainer}>
        <a href="/termos-de-uso" className={styles.termsOfUseLink}>
          Termos de Uso
        </a>
        <span className={styles.linkSeparator}>|</span>
        <a href="/politicas-de-privacidade"
          className={styles.privacyPolicyLink}>
          Políticas de Privacidade
        </a>
      </div>
    </div>
  );
}

function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { trigger, isMutating } = useSWRMutation("/api/v1/users", sendRequest);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    for (const key in formData) {
      if (formData[key] === "") {
        setError(`O campo ${key} é obrigatório`);
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não estão iguais");
      return;
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    try {
      const dataToSend = { ...formData };
      delete dataToSend.confirmPassword;
      const result = await trigger(dataToSend);

      setSuccess(true);
      setFormData({
        name: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.registerForm}>
      <div className={styles.formBackground}>
        <h2 className={styles.title}>Criar conta</h2>
        <div className={styles.formContainer}>
          <div className={styles.fieldGroup}>
            <label htmlFor="name" className={styles.label}>
              Nome
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="username" className={styles.label}>
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="password" className={styles.label}>
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirmar senha
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
        </div>

        {success && (
          <div className={styles.successMessage}>
            ✅ Conta criada com sucesso!
          </div>
        )}

        {error && <div className={styles.errorMessage}>❌ {error}</div>}

        <div className={styles.optionsRow}>
          <label className={styles.rememberMe}>
            <input type="checkbox" className={styles.checkbox} />
            Lembrar de mim
          </label>
        </div>

        {/* Botão - Criar */}
        <button
          type="submit"
          className={styles.createButton}
          disabled={isMutating}
        >
          {isMutating ? "Criando..." : "Criar"}
        </button>

        <div className={styles.loginPrompt}>
          Já tem uma conta?{" "}
          <Link href="/login" className={styles.loginLink}>
            Faça login!
          </Link>
        </div>
      </div>
    </form>
  );
}
