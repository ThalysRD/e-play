import styles from "styles/configuracoes/editarperfil.module.css";
import { FaPencilAlt } from "react-icons/fa";
import load from "styles/componentes/loading.module.css";
import useSWRMutation from "swr/mutation";
import { useState, useEffect, useMemo } from "react";
import useUser from "/hooks/useUser";
import { useRouter } from "next/router";
import ModalCancelar from "components/ModalCancelar";

async function sendRequest(url, { arg }) {
    const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(arg),
    });

    if (!response.ok) {
        let erroMsg = "Erro ao atualizar dados";
        try {
            const errorData = await response.json();
            erroMsg = errorData.message || erroMsg;
        } catch { }
        throw new Error(erroMsg);
    }
    return await response.json();
}

export default function EditarPerfilPage() {
    const { user, isLoading } = useUser();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const handleCancel = () => {
        setIsModalOpen(false);
        router.push("/configuracoes");
    };

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <h2>Editar perfil</h2>
                <div className={styles.divider} />
            </header>

            <main className={styles.body}>
                {!isLoading ? (
                    <>
                        <div className={styles.formInfosPessoais}>
                            <div className={styles.formExplain}>
                                <p className={styles.title}>Informações pessoais</p>
                            </div>
                            <PersonalInfosForm user={user} onRequestCancel={() => setIsModalOpen(true)} />
                        </div>

                        <div className={styles.formSenha}>
                            <div className={styles.formExplain}>
                                <p className={styles.title}>Redefinir senha</p>
                            </div>
                            <PasswordForm />
                        </div>
                    </>
                ) : (
                    <div className={load.loadingContainer}>
                        <div className={load.spinner}></div>
                    </div>
                )}
            </main>

            <ModalCancelar
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleCancel}
            />
        </div>
    );
}

function PersonalInfosForm({ user, onRequestCancel }) {
    const { mutate } = useUser();

    const initial = useMemo(
        () => ({
            bio: user?.bio || "",
            name: user?.name || "",
            username: user?.username || "",
            email: user?.email || "",
            phone: user?.phone || "",
            cpf: user?.cpf || "",
            cnpj: user?.cnpj || "",
            id: user?.id || "",
        }),
        [user]
    );

    const [formData, setFormData] = useState(initial);

    useEffect(() => {
        setFormData(initial);
    }, [initial]);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const { trigger, isMutating } = useSWRMutation("/api/v1/users", sendRequest);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (success) setSuccess(false);
        if (error) setError("");
    };

    // Calcula apenas o que mudou (diff) e não envia campos vazios não alterados
    const buildPayload = () => {
        const payload = { id: initial.id };
        const keys = ["bio", "name", "username", "email", "phone", "cpf", "cnpj"];
        for (const k of keys) {
            const oldVal = (initial[k] ?? "").trim();
            const newVal = (formData[k] ?? "").trim();
            if (newVal !== oldVal) {
                // só envia se mudou; se ficar vazio e não mudou, não manda
                payload[k] = newVal;
            }
        }
        return payload;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        // Valida somente os campos essenciais se eles estiverem no diff
        const payload = buildPayload();

        if (!payload.id) {
            setError("Usuário inválido (ID ausente). Refaça o login e tente novamente.");
            return;
        }

        // Se o usuário editou name/username/email, validar obrigatórios
        const requiredIfPresent = ["name", "username", "email"];
        for (const key of requiredIfPresent) {
            if (key in payload && !payload[key]) {
                setError(`O campo ${key} é obrigatório.`);
                return;
            }
        }

        // Se nada mudou, evita requisição
        const keysToSend = Object.keys(payload).filter((k) => k !== "id");
        if (keysToSend.length === 0) {
            setSuccess(true);
            return;
        }

        try {
            const result = await trigger(payload);
            // Atualiza o form com o retorno do servidor (se houver)
            if (result && typeof result === "object") {
                setFormData((prev) => ({ ...prev, ...result }));
            }
            setSuccess(true);

            // MUITO IMPORTANTE: revalida o usuário global (Sidebar/Header atualizam o nome)
            await mutate();
        } catch (e) {
            setError(e.message);
            console.error(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.personalForm}>
            <div className={styles.formBackground}>
                <div className={styles.personalFormContainer}>
                    <div className={styles.profilePicContainer}>
                        <img src="/assets/AvatarPadrao.svg" className={styles.profilePic} alt="Avatar do perfil" />
                        <button type="button" className={styles.editProfilePicButton} title="Trocar foto">
                            <FaPencilAlt />
                        </button>
                    </div>

                    <div className={`${styles.fieldGroup} ${styles.fieldGroupBio}`}>
                        <label htmlFor="bio" className={styles.label}>Sobre mim</label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            className={`${styles.input} ${styles.bioTextarea}`}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="name" className={styles.label}>Nome*</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="username" className={styles.label}>Username*</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="email" className={styles.label}>Email*</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="phone" className={styles.label}>Telefone</label>
                        <input
                            id="phone"
                            name="phone"
                            type="text"
                            value={formData.phone}
                            onChange={handleChange}
                            className={styles.input}
                            placeholder="(xx) xxxxx-xxxx"
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="cpf" className={styles.label}>CPF</label>
                        <input
                            id="cpf"
                            name="cpf"
                            type="text"
                            value={formData.cpf}
                            onChange={handleChange}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="cnpj" className={styles.label}>CNPJ</label>
                        <input
                            id="cnpj"
                            name="cnpj"
                            type="text"
                            value={formData.cnpj}
                            onChange={handleChange}
                            className={styles.input}
                        />
                    </div>
                </div>

                {error && <p className={styles.errorMessage}>❌ {error}</p>}
                {success && <p className={styles.successMessage}>✅ Dados atualizados com sucesso!</p>}

                <div className={styles.buttonsContainer}>
                    <button
                        type="button"
                        className={`${styles.button} ${styles.buttonCancel}`}
                        onClick={onRequestCancel}
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        disabled={isMutating}
                        className={`${styles.button} ${styles.buttonSave}`}
                    >
                        {isMutating ? "Salvando..." : "Salvar mudanças"}
                    </button>
                </div>
            </div>
        </form>
    );
}

function PasswordForm() {
    // Aqui só mantive a UI; você pode conectar uma rota de alteração de senha separada
    return (
        <form className={styles.passwordForm} onSubmit={(e) => e.preventDefault()}>
            <div className={styles.formBackground}>
                <div className={styles.passwordFormContainer}>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="password" className={styles.label}>Nova senha*</label>
                        <input id="password" name="password" type="password" className={styles.input} />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="confirm_password" className={styles.label}>Confirmar nova senha*</label>
                        <input id="confirm_password" name="confirm_password" type="password" className={styles.input} />
                    </div>
                </div>

                <div className={styles.buttonsContainer}>
                    <button type="button" className={`${styles.button} ${styles.buttonCancel}`}>
                        Cancelar
                    </button>
                    <button type="button" className={`${styles.button} ${styles.buttonSave}`}>
                        Salvar mudanças
                    </button>
                </div>
            </div>
        </form>
    );
}
