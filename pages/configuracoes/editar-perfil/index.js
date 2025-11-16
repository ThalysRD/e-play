import styles from "styles/configuracoes/editarperfil.module.css";
import { FaPencilAlt } from "react-icons/fa";
import Modal from "components/ModalPadrao";
import { useRouter } from "next/router";
import { useState, useRef } from "react";
import useUser from "/hooks/useUser";
import load from "styles/componentes/loading.module.css";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebase";

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
async function patchUserAddress(payload) {
  const res = await fetch("/api/v1/user/address", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(
      data?.message || data?.error || "Falha na atualização do endereço.",
    );
  return data;
}

async function patchProfilePicture(payload) {
  const res = await fetch("/api/v1/user/profile-picture", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(
      data?.message || data?.error || "Falha na atualização da foto de perfil.",
    );
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
  const { user, isLoading, mutate } = useUser();

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
            onProfilePicChange={mutate}
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

const UPLOAD_TIMEOUT_MS = 60_000;

function uploadProfileImageToFirebase(file) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).slice(2);
    const safeName = file.name.replace(/\s+/g, "_");
    const path = `profile-images/${timestamp}_${randomString}_${safeName}`;
    const storageRef = ref(storage, path);

    const task = uploadBytesResumable(storageRef, file);

    const to = setTimeout(() => {
      try {
        task.cancel();
      } catch {}
      reject(new Error(`Tempo esgotado ao enviar ${file.name}`));
    }, UPLOAD_TIMEOUT_MS);

    task.on(
      "state_changed",
      () => {},
      (err) => {
        clearTimeout(to);
        reject(err);
      },
      async () => {
        clearTimeout(to);
        try {
          const url = await getDownloadURL(storageRef);
          resolve(url);
        } catch (e) {
          reject(e);
        }
      },
    );
  });
}

/* ---------- forms ---------- */
function PersonalInfosForm({ onOpenModal, user, onProfilePicChange }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imgPreview, setImgPreview] = useState(user?.profile_image_url || null);
  const [imgError, setImgError] = useState("");
  const fileInputRef = useRef(null);

  const handleEditPicClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImgError("");
    setUploading(true);

    try {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error("A imagem deve ter no máximo 5MB.");
      }

      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        throw new Error("Apenas imagens JPG, PNG e WEBP são permitidas.");
      }

      const previewUrl = URL.createObjectURL(file);
      setImgPreview(previewUrl);

      const downloadURL = await uploadProfileImageToFirebase(file);

      await patchProfilePicture({ profile_image_url: downloadURL });

      onProfilePicChange();
      setMsg("Foto de perfil atualizada com sucesso!");
    } catch (err) {
      setImgError(err.message);
      setImgPreview(user?.profile_image_url || null); // Reverte
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

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
        profile_bio: formVals.profileBio,
        phone_number: formVals.phoneNumber,
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
              src={imgPreview || "/assets/AvatarPadrao.svg"}
              className={styles.profilePic}
              alt="Avatar do perfil"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              style={{ display: "none" }}
              disabled={uploading}
            />
            <button
              type="button"
              className={styles.editProfilePicButton}
              title="Trocar foto"
              onClick={handleEditPicClick}
              disabled={uploading}
            >
              {uploading ? "..." : <FaPencilAlt />}
            </button>
            {imgError && <p className={styles.errorTextSmall}>{imgError}</p>}
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
              placeholder="99 999999999"
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
              placeholder="Digite somente os números do seu CPF."
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
              placeholder="Digite somente os números do seu CNPJ."
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
            disabled={busy || uploading}
          >
            Cancelar
          </button>
          <SubmitButton busy={busy || uploading}>Salvar mudanças</SubmitButton>
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

function EnderecoForm({ onOpenModal, user }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);

    try {
      const fd = new FormData(e.currentTarget);
      const get = (k) => fd.get(k)?.toString().trim();

      const payload = {
        id: user?.id,
        address_zipcode: get("address_zipcode") ?? "",
        address_street: get("address_street") ?? "",
        address_number: get("address_number") ?? "",
        address_complement: get("address_complement") ?? "",
        address_neighborhood: get("address_neighborhood") ?? "",
        address_city: get("address_city") ?? "",
        address_state: get("address_state") ?? "",
      };
      if (
        !payload.address_zipcode ||
        !payload.address_street ||
        !payload.address_number ||
        !payload.address_neighborhood ||
        !payload.address_city ||
        !payload.address_state
      ) {
        throw new Error(
          "Por favor, preencha todos os campos de endereço obrigatórios (*).",
        );
      }

      await patchUserAddress(payload);
      setMsg("Endereço atualizado com sucesso!");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={styles.enderecoForm} key={user?.id} onSubmit={onSubmit}>
      <div className={styles.formBackground}>
        <div className={styles.enderecoFormContainer1}>
          <div className={styles.fieldGroup}>
            <label htmlFor="address_zipcode" className={styles.label}>
              CEP*
            </label>
            <input
              id="address_zipcode"
              name="address_zipcode"
              type="text"
              className={styles.input}
              placeholder="99999-999"
              defaultValue={user?.address_zipcode || ""}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="address_street" className={styles.label}>
              Rua*
            </label>
            <input
              id="address_street"
              name="address_street"
              type="text"
              className={styles.input}
              placeholder="Ruas das Flores"
              defaultValue={user?.address_street || ""}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="address_number" className={styles.label}>
              Número*
            </label>
            <input
              id="address_number"
              name="address_number"
              type="text"
              className={styles.input}
              placeholder="123"
              defaultValue={user?.address_number || ""}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="address_complement" className={styles.label}>
              Complemento
            </label>
            <input
              id="address_complement"
              name="address_complement"
              type="text"
              className={styles.input}
              placeholder="Apto, Bloco, Casa"
              defaultValue={user?.address_complement || ""}
            />
          </div>
        </div>

        <div className={styles.enderecoFormContainer2}>
          <div className={styles.fieldGroup}>
            <label htmlFor="address_neighborhood" className={styles.label}>
              Bairro*
            </label>
            <input
              id="address_neighborhood"
              name="address_neighborhood"
              type="text"
              className={styles.input}
              placeholder="Planalto"
              defaultValue={user?.address_neighborhood || ""}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="address_city" className={styles.label}>
              Cidade*
            </label>
            <input
              id="address_city"
              name="address_city"
              type="text"
              className={styles.input}
              placeholder="Natal"
              defaultValue={user?.address_city || ""}
            />
          </div>

          <div className={styles.fieldGroupHalf}>
            <label htmlFor="address_state" className={styles.label}>
              Estado*
            </label>
            <select
              id="address_state"
              name="address_state"
              className={styles.select}
              defaultValue={user?.address_state || ""}
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
          {/* Usa o SubmitButton */}
          <SubmitButton busy={busy}>Salvar mudanças</SubmitButton>
        </div>
      </div>
    </form>
  );
}
