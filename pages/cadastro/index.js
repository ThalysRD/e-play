import { useState } from "react";
import useSWRMutation from "swr/mutation";

// Função para fazer requisições POST
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
    cpf: null,
    cnpj: null,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Hook do SWR Mutation
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

    // Validação dos campos obrigatórios
    for (const key in formData) {
      if (formData[key] === "") {
        setError(`O campo ${key} é obrigatório`);
        return;
      }
    }

    // Validação das senhas
    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não estão iguais");
      return;
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    try {
      // Prepara os dados para envio
      const dataToSend = { ...formData };
      delete dataToSend.confirmPassword;

      // Usa o trigger do SWR Mutation
      const result = await trigger(dataToSend);

      // Sucesso!
      setSuccess(true);
      setFormData({
        name: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        cpf: "",
        cnpj: "",
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

      {/* <label htmlFor="cpf">CPF*</label>
      <input
        id="cpf"
        name="cpf"
        type="text"
        placeholder="000.000.000-00"
        value={formData.cpf}
        onChange={handleChange}
        required
      /> */}

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

      {/* Exibe a mensagem de sucesso */}
      {success && (
        <div className="success-message">✅ Conta criada com sucesso!</div>
      )}

      {/* Exibe a mensagem de erro, se houver */}
      {error && <p className="error-message">❌ {error}</p>}

      <button type="submit" className="create-button" disabled={isMutating}>
        {isMutating ? "Criando..." : "Criar"}
      </button>
    </form>
  );
}
