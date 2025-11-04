import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import categories from "models/category.js";


const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
    try {
        // 1. Obtém os dados do corpo (body) da requestuisição.
        const categoryInput = request.body;

        // 2. Chama a função 'create' do model, que contém a lógica de validação e inserção.
        const newCategory = await categories.create(categoryInput);

        // 3. responseponde com status 201 (Created) e o objeto da categoria criada.
        response.status(201).json(newCategory);
    } catch (error) {
        // 4. Captura erros, especialmente 'ValidationError' vindo do model.
        if (error.name === "ValidationError") {
            // responseponde com o status de erro específico (ex: 400 ou 409)
            // definido no objeto 'ValidationError'
            return response
                .status(error.statusCode || 400)
                .json({ error: error.message, details: error.action });
        }

        // 5. Captura erros inesperados (ex: falha de conexão com o banco).
        console.error(error); // Loga o erro completo no console do servidor.
        response.status(500).json({
            error: "Ocorreu um erro interno no servidor.",
        });
    }
}


async function getHandler(request, response) {
    try {
        // 1. Chama a função 'findAllCategories' do model.
        const allCategories = await categories.findAllCategories();

        // 2. responseponde com status 200 (OK) e a lista de categorias.
        response.status(200).json(allCategories);
    } catch (error) {
        // 3. Captura erros inesperados.
        console.error(error); // Loga o erro no console do servidor.
        response.status(500).json({
            error: "Ocorreu um erro interno no servidor.",
        });
    }
}
