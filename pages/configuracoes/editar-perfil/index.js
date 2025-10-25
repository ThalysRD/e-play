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
            />
          </div>
        </div>

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
                        <button type="button" className={styles.editProfilePicButton} title="Trocar foto (implementar)">
                            <FaPencilAlt />
                        </button>
                    </div>

                    <div className={`${styles.fieldGroup} ${styles.fieldGroupBio}`}>
                        <label htmlFor="profile_bio" className={styles.label}>Sobre mim</label>
                        <textarea
                            id="profile_bio"
                            name="profile_bio"
                            rows={5}
                            maxLength={400}
                            className={`${styles.input} ${styles.bioTextarea}`}
                            defaultValue={user?.profile_bio || ""}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="name" className={styles.label}>Nome*</label>
                        <input id="name" name="name" type="text" className={styles.input} defaultValue={user?.name || ""} />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="username" className={styles.label}>Username*</label>
                        <input id="username" name="username" type="text" className={styles.input} defaultValue={user?.username || ""} />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="email" className={styles.label}>Email*</label>
                        <input id="email" name="email" type="email" className={styles.input} defaultValue={user?.email || ""} />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="phone_number" className={styles.label}>Telefone</label>
                        <input id="phone_number" name="phone_number" type="text" className={styles.input} defaultValue={user?.phone_number || ""} />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="cpf" className={styles.label}>CPF</label>
                        <input id="cpf" name="cpf" type="text" className={styles.input} defaultValue={user?.cpf || ""} />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="cnpj" className={styles.label}>CNPJ</label>
                        <input id="cnpj" name="cnpj" type="text" className={styles.input} defaultValue={user?.cnpj || ""} />
                    </div>
                </div>

                <Message kind={msg?.includes("sucesso") ? "success" : msg ? "error" : undefined}>{msg}</Message>

                <div className={styles.buttonsContainer}>
                    <button type="button" onClick={onOpenModal} className={`${styles.button} ${styles.buttonCancel}`} disabled={busy}>
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
