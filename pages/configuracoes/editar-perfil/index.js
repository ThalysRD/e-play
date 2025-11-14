import styles from "styles/configuracoes/editarperfil.module.css";
import { FaPencilAlt } from "react-icons/fa";
import Modal from "components/ModalPadrao";
import { useRouter } from "next/router";
import { useState } from "react";
import useUser from "/hooks/useUser";
import load from "styles/componentes/loading.module.css";

/* ---------- helpers ---------- */
async function patchUser(payload) {
  const res = await fetch("/api/v1/users", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.message || data?.error || "Falha na atualização.");
  return data;
}

function Message({ kind, children }) {
  if (!children) return null;
  const cls =
    kind === "error"
      ? styles.errorMessage || styles.errorText
      : styles.successMessage || styles.successText;
  return (
    <p className={cls} role="alert">
      {children}
    </p>
  );
}

function SubmitButton({ busy, children }) {
  return (
    <button
      type="submit"
      className={`${styles.button} ${styles.buttonSave}`}
      disabled={busy}
    >
      {busy ? "Salvando..." : children}
    </button>
  );
}

/* ---------- page ---------- */
export default function EditProfilePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const { user, isLoading } = useUser();

  const handleCancel = () => {
    setIsModalOpen(false);
    router.push("/configuracoes");
  };

  if (isLoading) {
    return (
      <div className={load.loadingContainer}>
        <div className={load.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h2>Editar perfil</h2>
        <div className={styles.divider}></div>
      </header>

      <main className={styles.body}>
        <div className={styles.formInfosPessoais}>
          <div className={styles.formExplain}>
            <p className={styles.title}>Informações pessoais</p>
          </div>
          <PersonalInfosForm
            user={user}
            onOpenModal={() => setIsModalOpen(true)}
          />
        </div>

        <div className={styles.formEndereco}>
          <div className={styles.formExplain}>
            <p className={styles.title}>Endereço</p>
          </div>
          <EnderecoForm user={user} onOpenModal={() => setIsModalOpen(true)} />
        </div>

        <div className={styles.formSenha}>
          <div className={styles.formExplain}>
            <p className={styles.title}>Redefinir senha</p>
          </div>
          <PasswordForm user={user} onOpenModal={() => setIsModalOpen(true)} />
        </div>
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCancel}
        title="Cancelar"
        message="Você tem certeza que deseja descartar as alterações? Seu progresso será perdido."
      />
    </div>
  );
}

/* ---------- forms ---------- */
function PersonalInfosForm({ onOpenModal, user }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);

    try {
      const fd = new FormData(e.currentTarget);
      const get = (k) => fd.get(k)?.toString().trim();

      const formVals = {
        name: get("name") ?? "",
        username: get("username") ?? "",
        email: get("email") ?? "",
        profileBio: get("profile_bio") ?? "",
        phoneNumber: get("phone_number") ?? "",
        cpf: get("cpf") ?? "",
        cnpj: get("cnpj") ?? "",
      };

      const original = {
        name: user?.name ?? "",
        username: user?.username ?? "",
        email: user?.email ?? "",
        profileBio: user?.profile_bio ?? "",
        phoneNumber: user?.phone_number ?? "",
        cpf: user?.cpf ?? "",
        cnpj: user?.cnpj ?? "",
      };

      const payload = {
        id: user?.id,
        name: formVals.name,
        profileBio: formVals.profileBio,
        phoneNumber: formVals.phoneNumber,
        cpf: formVals.cpf,
        cnpj: formVals.cnpj,
      };

      if ((formVals.username || "") !== (original.username || "")) {
        payload.username = formVals.username;
      }
      if ((formVals.email || "") !== (original.email || "")) {
        payload.email = formVals.email;
      }

      await patchUser(payload);
      setMsg("Perfil atualizado com sucesso!");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={styles.personalForm} key={user?.id} onSubmit={onSubmit}>
      <div className={styles.formBackground}>
        <div className={styles.personalFormContainer}>
          <div className={styles.profilePicContainer}>
            <img
              src={user?.profile_image_url || "/assets/AvatarPadrao.svg"}
              className={styles.profilePic}
              alt="Avatar do perfil"
            />
            <button
              type="button"
              className={styles.editProfilePicButton}
              title="Trocar foto (implementar)"
            >
              <FaPencilAlt />
            </button>
          </div>

          <div className={`${styles.fieldGroup} ${styles.fieldGroupBio}`}>
            <label htmlFor="profile_bio" className={styles.label}>
              Sobre mim
            </label>
            <textarea
              id="profile_bio"
              name="profile_bio"
              rows={5}
              maxLength={400}
              className={`${styles.input} ${styles.bioTextarea}`}
              defaultValue={user?.profile_bio || ""}
              placeholder="Olá! Eu sou fulano..."
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="name" className={styles.label}>
              Nome*
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className={styles.input}
              defaultValue={user?.name || ""}
              placeholder="Fulano da Silva"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="username" className={styles.label}>
              Username*
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className={styles.input}
              defaultValue={user?.username || ""}
              placeholder="fulano.silva"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="email" className={styles.label}>
              Email*
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={styles.input}
              defaultValue={user?.email || ""}
              placeholder="fulano@email.com"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="phone_number" className={styles.label}>
              Telefone
            </label>
            <input
              id="phone_number"
              name="phone_number"
              type="text"
              className={styles.input}
              defaultValue={user?.phone_number || ""}
              placeholder="(99) 99999-9999"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="cpf" className={styles.label}>
              CPF
            </label>
            <input
              id="cpf"
              name="cpf"
              type="text"
              className={styles.input}
              defaultValue={user?.cpf || ""}
              placeholder="999.999.999-99"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="cnpj" className={styles.label}>
              CNPJ
            </label>
            <input
              id="cnpj"
              name="cnpj"
              type="text"
              className={styles.input}
              defaultValue={user?.cnpj || ""}
              placeholder="99.999.999/0009-99"
            />
          </div>
        </div>

        <Message
          kind={
            msg?.includes("sucesso") ? "success" : msg ? "error" : undefined
          }
        >
          {msg}
        </Message>

        <div className={styles.buttonsContainer}>
          <button
            type="button"
            onClick={onOpenModal}
            className={`${styles.button} ${styles.buttonCancel}`}
            disabled={busy}
          >
            Cancelar
          </button>
          <SubmitButton busy={busy}>Salvar mudanças</SubmitButton>
        </div>
      </div>
    </form>
  );
}

function PasswordForm({ onOpenModal }) {
  return (
    <form className={styles.passwordForm}>
      <div className={styles.formBackground}>
        <div className={styles.passwordFormContainer}>
          <div className={styles.fieldGroup}>
            <label htmlFor="password" className={styles.label}>
              Nova senha*
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={styles.input}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="confirm_password" className={styles.label}>
              Confirmar nova senha*
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.buttonsContainer}>
          <button
            type="button"
            onClick={onOpenModal}
            className={`${styles.button} ${styles.buttonCancel}`}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonSave}`}
          >
            Salvar mudanças
          </button>
        </div>
      </div>
    </form>
  );
}

function EnderecoForm({ onOpenModal }) {
  return (
    <form className={styles.enderecoForm}>
      <div className={styles.formBackground}>
        <div className={styles.enderecoFormContainer1}>
          <div className={styles.fieldGroup}>
            <label htmlFor="cep" className={styles.label}>
              CEP*
            </label>
            <input
              id="cep"
              name="cep"
              type="cep"
              className={styles.input}
              placeholder="99999-999"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="rua" className={styles.label}>
              Rua*
            </label>
            <input
              id="rua"
              name="rua"
              type="rua"
              className={styles.input}
              placeholder="Ruas das Flores"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="numero" className={styles.label}>
              Número*
            </label>
            <input
              id="numero"
              name="numero"
              type="numero"
              className={styles.input}
              placeholder="123"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="complemento" className={styles.label}>
              Complemento
            </label>
            <input
              id="complemento"
              name="complemento"
              type="complemento"
              className={styles.input}
              placeholder="Apto, Bloco, Casa"
            />
          </div>
        </div>

        <div className={styles.enderecoFormContainer2}>
          <div className={styles.fieldGroup}>
            <label htmlFor="bairro" className={styles.label}>
              Bairro*
            </label>
            <input
              id="bairro"
              name="bairro"
              type="bairro"
              className={styles.input}
              placeholder="Planalto"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="cidade" className={styles.label}>
              Cidade*
            </label>
            <input
              id="cidade"
              name="cidade"
              type="cidade"
              className={styles.input}
              placeholder="Natal"
            />
          </div>

          <div className={styles.fieldGroupHalf}>
            <label htmlFor="estado" className={styles.label}>
              Estado*
            </label>
            <select
              id="estado"
              name="estado"
              className={styles.select}
            >
              <option value=""> </option>
              <option value="AC">Acre</option>
              <option value="AL">Alagoas</option>
              <option value="AP">Amapá</option>
              <option value="AM">Amazonas</option>
              <option value="BA">Bahia</option>
              <option value="CE">Ceará</option>
              <option value="DF">Distrito Federal</option>
              <option value="ES">Espírito Santo</option>
              <option value="GO">Goiás</option>
              <option value="MA">Maranhão</option>
              <option value="MT">Mato Grosso</option>
              <option value="MS">Mato Grosso do Sul</option>
              <option value="MG">Minas Gerais</option>
              <option value="PA">Pará</option>
              <option value="PB">Paraíba</option>
              <option value="PR">Paraná</option>
              <option value="PE">Pernambuco</option>
              <option value="PI">Piauí</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="RN">Rio Grande do Norte</option>
              <option value="RS">Rio Grande do Sul</option>
              <option value="RO">Rondônia</option>
              <option value="RR">Roraima</option>
              <option value="SC">Santa Catarina</option>
              <option value="SP">São Paulo</option>
              <option value="SE">Sergipe</option>
              <option value="TO">Tocantins</option>
            </select>
          </div>
        </div>

        <div className={styles.buttonsContainer}>
          <button
            type="button"
            onClick={onOpenModal}
            className={`${styles.button} ${styles.buttonCancel}`}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonSave}`}
          >
            Salvar mudanças
          </button>
        </div>
      </div>
    </form >
  );
}
