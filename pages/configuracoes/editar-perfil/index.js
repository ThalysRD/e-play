import styles from "styles/configuracoes/editarperfil.module.css";
import { FaPencilAlt } from 'react-icons/fa';
import load from "styles/componentes/loading.module.css";
import useSWRMutation from "swr/mutation";
import { useState, useEffect } from "react";
import useUser from "/hooks/useUser"


async function sendRequest(url, { arg }) {
    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(arg),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao atualizar dados");
    }

    return await response.json();
}

export default function EditarPerfilPage() {
    const { user, isLoading } = useUser();

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <h2>Editar perfil</h2>
                <div className={styles.divider}> </div>
            </header>
            <main className={styles.body}>
                {!isLoading ? (
                    <><div className={styles.formInfosPessoais}>
                        <div className={styles.formExplain}>
                            <p className={styles.title}>Informações pessoais</p>
                        </div>
                        <PersonalInfosForm user={user} />
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
        </div>
    );
}

function PersonalInfosForm({ user }) {
    const [formData, setFormData] = useState({
        bio: "",
        name: "",
        username: "",
        email: "",
        phone: "",
        cpf: "",
        cnpj: "",
    });
    useEffect(() => {
        if (user) {
            setFormData({
                bio: user.bio || "",
                name: user.name || "",
                username: user.username || "",
                email: user.email || "",
                phone: user.phone || "",
                cpf: user.cpf || "",
                cnpj: user.cnpj || "",
            });
        }
    }, [user]);
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
        try {
            const dataToSend = { ...formData };
            delete dataToSend.confirmPassword;
            const result = await trigger(dataToSend);

            setSuccess(true);
            setFormData({
                bio: "",
                name: "",
                username: "",
                email: "",
                phone: "",
                cpf: "",
                cnpj: "",
            });
        } catch (e) {
            setError(e.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.personalForm}>
            <div className={styles.formBackground}>
                <div className={styles.personalFormContainer}>
                    <div className={styles.profilePicContainer}>
                        <img src="/assets/AvatarPadrao.svg" className={styles.profilePic} alt="Avatar do perfil" />
                        <button type="button" className={styles.editProfilePicButton}>
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
                            required
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
                            required
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
                            required
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

                <div className={styles.buttonsContainer}>
                    <button type="submit" className={`${styles.button} ${styles.buttonCancel}`}>
                        Cancelar
                    </button>
                    <button type="submit" className={`${styles.button} ${styles.buttonSave}`}>
                        {isMutating ? "Salvando..." : "Salvar mudanças"}
                    </button>
                </div>
            </div>
        </form>
    );
}

function PasswordForm() {
    return (
        <form className={styles.passwordForm}>
            <div className={styles.formBackground}>
                <div className={styles.passwordFormContainer}>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="password" className={styles.label}>Nova senha*</label>
                        <input
                            id="password"
                            name="password"
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="confirm_password" className={styles.label}>Confirmar nova senha*</label>
                        <input id="confirm_password" name="confirm_password" type="password" className={styles.input} />
                    </div>
                </div>

                <div className={styles.buttonsContainer}>
                    <button type="submit" className={`${styles.button} ${styles.buttonCancel}`}>
                        Cancelar
                    </button>
                    <button type="submit" className={`${styles.button} ${styles.buttonSave}`}>
                        Salvar mudanças
                    </button>
                </div>
            </div>
        </form>
    );
}
