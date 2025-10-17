import { useState } from "react";
import { useRouter } from "next/router";
import useSWRMutation from "swr/mutation";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebase";
import styles from "styles/criar-anuncio.module.css";

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
    throw new Error(errorData.message || "Erro ao criar anúncio");
  }

  return await response.json();
}

export default function CreateListingPage() {
  return <CreateListingForm />;
}

function CreateListingForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    condition: "Novo",
    quantity: "1",
    categoryId: "",
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { trigger, isMutating } = useSWRMutation(
    "/api/v1/listings",
    sendRequest
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    // Verificar se não ultrapassa o limite de 6 imagens
    const totalImages = imageFiles.length + files.length;
    if (totalImages > 6) {
      setError(`Você pode adicionar no máximo 6 imagens. Você já tem ${imageFiles.length} imagem(ns).`);
      e.target.value = ""; // Limpa o input
      return;
    }

    // Validação de tamanho (max 5MB por imagem)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const invalidFiles = files.filter(file => file.size > maxSize);

    if (invalidFiles.length > 0) {
      setError("Algumas imagens são maiores que 5MB. Por favor, escolha imagens menores.");
      e.target.value = ""; // Limpa o input
      return;
    }

    // Validação de tipo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidTypes = files.filter(file => !validTypes.includes(file.type));

    if (invalidTypes.length > 0) {
      setError("Apenas imagens JPG, PNG e WEBP são permitidas.");
      e.target.value = ""; // Limpa o input
      return;
    }

    // Adicionar aos arquivos existentes ao invés de substituir
    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    // Criar previews para os novos arquivos e adicionar aos existentes
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);

    // Limpar o input para permitir adicionar a mesma imagem novamente se necessário
    e.target.value = "";

    // Limpar a mensagem de erro se tudo deu certo
    setError("");
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // Limpar URL do preview antigo
    URL.revokeObjectURL(imagePreviews[index]);

    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const uploadImagesToFirebase = async () => {
    if (imageFiles.length === 0) return [];

    setUploadingImages(true);
    const uploadedUrls = [];

    try {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `listings/${timestamp}_${randomString}_${file.name}`;

        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        uploadedUrls.push(downloadURL);
      }

      return uploadedUrls;
    } catch (error) {
      console.error("Erro ao fazer upload das imagens:", error);
      throw new Error("Erro ao fazer upload das imagens");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validações
    if (!formData.title.trim()) {
      setError("O título é obrigatório");
      return;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      setError("O preço deve ser maior que zero");
      return;
    }

    if (!formData.categoryId) {
      setError("Selecione uma categoria");
      return;
    }

    if (!formData.quantity || Number(formData.quantity) < 1) {
      setError("A quantidade deve ser no mínimo 1");
      return;
    }

    try {
      // Upload das imagens para o Firebase
      let imageUrls = [];
      if (imageFiles.length > 0) {
        try {
          imageUrls = await uploadImagesToFirebase();
        } catch (uploadError) {
          setError("Erro ao fazer upload das imagens. Tente novamente.");
          return;
        }
      }

      const dataToSend = {
        categoryId: formData.categoryId,
        title: formData.title,
        description: formData.description,
        price: Number(formData.price).toFixed(2),
        condition: formData.condition,
        quantity: Number(formData.quantity),
        images: imageUrls,
      };

      const result = await trigger(dataToSend);

      setSuccess(true);
      setTimeout(() => {
        router.push(`/item/${result.id}`);
      }, 2000);
    } catch (err) {
      setError(err.message || "Erro ao criar anúncio");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.registerForm}>
      <div className={styles.formBackground}>
        <h1 className={styles.title}>Criar Anúncio</h1>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && (
          <div className={styles.successMessage}>
            Anúncio criado com sucesso! Redirecionando...
          </div>
        )}

        <div className={styles.formContainer}>
          {/* Título */}
          <div className={styles.fieldGroup}>
            <label htmlFor="title" className={styles.label}>
              Título do Anúncio
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: God of War Ragnarök PS5"
              className={styles.input}
              maxLength="255"
            />
          </div>

          {/* Descrição */}
          <div className={styles.fieldGroup}>
            <label htmlFor="description" className={styles.label}>
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descreva o estado do jogo, conteúdo incluído, etc."
              className={styles.textarea}
              rows="4"
              maxLength="500"
            />
          </div>

          {/* Preço e Quantidade */}
          <div className={styles.rowGroup}>
            <div className={styles.fieldGroupHalf}>
              <label htmlFor="price" className={styles.label}>
                Preço (R$)
              </label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                className={styles.input}
              />
            </div>

            <div className={styles.fieldGroupHalf}>
              <label htmlFor="quantity" className={styles.label}>
                Quantidade
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>

          {/* Condição e Categoria */}
          <div className={styles.rowGroup}>
            <div className={styles.fieldGroupHalf}>
              <label htmlFor="condition" className={styles.label}>
                Condição
              </label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="Novo">Novo</option>
                <option value="Usado">Usado</option>
                <option value="Recondicionado">Recondicionado</option>
              </select>
            </div>

            <div className={styles.fieldGroupHalf}>
              <label htmlFor="categoryId" className={styles.label}>
                Categoria
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="">Selecione...</option>
                <option value="1">PlayStation</option>
                <option value="2">Xbox</option>
                <option value="3">Nintendo</option>
                <option value="4">PC</option>
                <option value="5">Retro</option>
              </select>
            </div>
          </div>

          {/* Imagens */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Imagens do Produto (até 6 imagens)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handleImageChange}
              className={styles.fileInput}
              max="6"
            />
            <p className={styles.helpText}>
              Formatos aceitos: JPG, PNG, WEBP. Tamanho máximo: 5MB por imagem.
            </p>

            {/* Preview das imagens */}
            {imagePreviews.length > 0 && (
              <div className={styles.imagePreviewContainer}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} className={styles.imagePreviewItem}>
                    <img src={preview} alt={`Preview ${index + 1}`} className={styles.imagePreview} />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className={styles.removeImageBtn}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className={styles.createButton}
          disabled={isMutating || uploadingImages}
        >
          {uploadingImages
            ? "Enviando imagens..."
            : isMutating
              ? "Criando..."
              : "Criar Anúncio"}
        </button>
      </div>
    </form>
  );
}
