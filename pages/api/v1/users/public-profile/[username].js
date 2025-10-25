import user from "/models/user.js";
import { NotFoundError } from "/infra/errors.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { username } = req.query;

    try {
        const vendedor = await user.findOneWithListingsByUsername(username);
        delete vendedor.password;
        delete vendedor.email;
        delete vendedor.cpf;
        delete vendedor.cnpj;
        delete vendedor.permissions;
        return res.status(200).json(vendedor);

    } catch (error) {
        console.error("[API Public Profile] Erro ao buscar vendedor:", error);

        if (error instanceof NotFoundError) {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({
            message: "Erro interno do servidor ao buscar dados do vendedor.",
        });
    }
}