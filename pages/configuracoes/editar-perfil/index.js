import styles from "styles/configuracoes/editarperfil.module.css";
import { FaPencilAlt } from 'react-icons/fa';

export default function RegisterPage() {
    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <h2>Editar perfil</h2>
                <div className={styles.divider}> </div>
            </header>
            <main className={styles.body}>
                <div className={styles.formInfosPessoais}>
                    <div className={styles.formExplain}>
                        <p className={styles.title}>Informações pessoais</p>
                    </div>
                    <PersonalInfosForm />
                </div>
                <div className={styles.formSenha}>
                    <div className={styles.formExplain}>
                        <p className={styles.title}>Redefinir senha</p>
                    </div>
                    <PasswordForm />
                </div>
            </main>
        </div>
    );
}

function PersonalInfosForm() {
    return (
        <form className={styles.personalForm}>
            <div className={styles.formBackground}>
                <div className={styles.personalFormContainer}>
                    <div className={styles.profilePicContainer}>
                        <img src="/assets/AvatarPadrao.svg" className={styles.profilePic} alt="Avatar do perfil" />
                        <button type="button" className={styles.editProfilePicButton}>
                            <FaPencilAlt />
                        </button>
                    </div>
                    <div className={`${styles.fieldGroup} ${styles.fieldGroupBio}`}>
                        <label htmlFor="profile_bio" className={styles.label}>Sobre mim</label>
                        <textarea
                            id="profile_bio"
                            name="profile_bio"
                            className={`${styles.input} ${styles.bioTextarea}`}
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="name" className={styles.label}>Nome*</label>
                        <input id="name" name="name" type="text" className={styles.input} />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="username" className={styles.label}>Username*</label>
                        <input id="username" name="username" type="text" className={styles.input} />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="email" className={styles.label}>Email*</label>
                        <input id="email" name="email" type="email" className={styles.input} />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="phone_number" className={styles.label}>Telefone</label>
                        <input id="phone_number" name="phone_number" type="text" className={styles.input} />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="cpf" className={styles.label}>CPF</label>
                        <input id="cpf" name="cpf" type="text" className={styles.input} />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="cnpj" className={styles.label}>CNPJ</label>
                        <input id="cnpj" name="cnpj" type="text" className={styles.input} />
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
