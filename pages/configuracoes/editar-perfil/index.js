
import styles from "styles/configuracoes/editarperfil.module.css";

export default function RegisterPage() {
    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <h2>Editar perfil</h2>
            </header>

            <main className={styles.body}>
                <div className={styles.optionsContainer}>
                    <RegisterForm />
                </div>
            </main>
        </div>
    );
}

function RegisterForm() {
    return (
        <form className={styles.registerForm}>
            <div className={styles.formBackground}>
                <div className={styles.formContainer}>
                    <div className={styles.topContainer}>
                        <img src="/assets/AvatarPadrao.svg" className={styles.profilePic} />
                        <div className={styles.fieldGroup}>
                            <label htmlFor="profile_bio" className={styles.label}>Sobre mim</label>
                            <textarea
                                id="profile_bio"
                                name="profile_bio"
                                type="text"
                                className={`${styles.input} ${styles.bioTextarea}`}
                            />
                        </div>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="name" className={styles.label}>Nome*</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="username" className={styles.label}>Username*</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="email" className={styles.label}>Email*</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="phone_number" className={styles.label}>Telefone</label>
                        <input
                            id="phone_number"
                            name="phone_number"
                            type="phone_number"
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="cpf" className={styles.label}>CPF</label>
                        <input
                            id="cpf"
                            name="cpf"
                            type="cpf"
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="cnpj" className={styles.label}>CNPJ</label>
                        <input
                            id="cnpj"
                            name="cnpj"
                            type="cnpj"
                            className={styles.input}
                        />
                    </div>
                    <div className={`${styles.fieldGroup} ${styles.fullWidthField}`}>
                        <label htmlFor="address" className={styles.label}>Endereço</label>
                        <input
                            id="address"
                            name="address"
                            type="address"
                            className={styles.input}
                        />
                    </div>
                </div>

                <div className={styles.buttonsContainer}>
                    <button type="submit" className={styles.button}>
                        Salvar
                    </button>
                    <button type="submit" className={styles.button}>
                        Cancelar
                    </button>
                </div>
            </div>
        </form>
    );
}