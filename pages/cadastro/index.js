import { useState } from "react";
import useSWRMutation from "swr/mutation";

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
    <>
      <RegisterForm />
    </>
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
    <form onSubmit={handleSubmit} className="register-form">
      <h2>Criar conta</h2>

      <label htmlFor="name">Nome*</label>
      <input
        id="name"
        name="name"
        type="text"
        value={formData.name}
        onChange={handleChange}
        required
      />

      <label htmlFor="username">Username*</label>
      <input
        id="username"
        name="username"
        type="text"
        value={formData.username}
        onChange={handleChange}
        required
      />

      <label htmlFor="email">Email*</label>
      <input
        id="email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
      />

      <label htmlFor="password">Senha*</label>
      <input
        id="password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        required
      />

      <label htmlFor="confirmPassword">Confirmar senha*</label>
      <input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
      />

      {success && (
        <div className="success-message">✅ Conta criada com sucesso!</div>
      )}

      {error && <p className="error-message">❌ {error}</p>}

      <button type="submit" className="create-button" disabled={isMutating}>
        {isMutating ? "Criando..." : "Criar"}
      </button>
    </form>
  );
}
