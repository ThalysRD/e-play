import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import useSWRMutation from "swr/mutation";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebase";
import styles from "styles/item/criar-anuncio.module.css";

// timeout por upload (ms)
const UPLOAD_TIMEOUT_MS = 60_000;

async function sendRequest(url, { arg }) {

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(arg),
    });

    if (!response.ok) {
      let errorMessage = "Erro ao criar anúncio";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
      }
      throw new Error(errorMessage);
    }

    const json = await response.json();
    return json;
  } finally {
  }
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
    sendRequest,
  );

  useEffect(() => {
    // Inicializar se necessário
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    const totalImages = imageFiles.length + files.length;
    if (totalImages > 6) {
      const msg = `Você pode adicionar no máximo 6 imagens. Você já tem ${imageFiles.length} imagem(ns).`;
      setError(msg);
      e.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    const invalidFiles = files.filter((file) => file.size > maxSize);
    if (invalidFiles.length > 0) {
      const msg = "Algumas imagens são maiores que 5MB. Por favor, escolha imagens menores.";
      setError(msg);
      e.target.value = "";
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const invalidTypes = files.filter(
      (file) => !validTypes.includes(file.type),
    );
    if (invalidTypes.length > 0) {
      const msg = "Apenas imagens JPG, PNG e WEBP são permitidas.";
      setError(msg);
      e.target.value = "";
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);

    e.target.value = "";
    setError("");
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    try {
      URL.revokeObjectURL(imagePreviews[index]);
    } catch {}

    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  // ----- uploads com LOGS e timeout
  function uploadSingleImageWithLogs(file) {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).slice(2);
      const safeName = file.name.replace(/\s+/g, "_");
      const path = `listings/${timestamp}_${randomString}_${safeName}`;
      const storageRef = ref(storage, path);

      const task = uploadBytesResumable(storageRef, file);

      const to = setTimeout(() => {
        console.error(`TIMEOUT no upload`, { file: file.name, ms: UPLOAD_TIMEOUT_MS });
        try { task.cancel(); } catch { }
        reject(new Error(`Tempo esgotado ao enviar ${file.name}`));
      }, UPLOAD_TIMEOUT_MS);

      task.on(
        "state_changed",
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        },
        (err) => {
          clearTimeout(to);
          console.error(`erro no upload`, { file: file.name, err });
          reject(err);
        },
        async () => {
          clearTimeout(to);
          try {
            const url = await getDownloadURL(storageRef);
            resolve(url);
          } catch (e) {
            console.error(`falha ao obter downloadURL`, { file: file.name, e });
            reject(e);
          }
        },
      );
    });
  }

  async function uploadImagesToFirebase(files) {
    if (!files || files.length === 0) return [];

    // sobe em paralelo para acelerar e revelar se alguma trava isoladamente
    const results = await Promise.all(files.map(uploadSingleImageWithLogs));

    return results;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!formData.title.trim()) { setError("O título é obrigatório"); return; }
    if (!formData.price || Number(formData.price) <= 0) { setError("O preço deve ser maior que zero"); return; }
    if (!formData.categoryId) { setError("Selecione uma categoria"); return; }
    if (!formData.quantity || Number(formData.quantity) < 1) { setError("A quantidade deve ser no mínimo 1"); return; }

    let imageUrls = [];

    try {
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        imageUrls = await uploadImagesToFirebase(imageFiles);
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
      setTimeout(() => router.push(`/item/${result.id}`), 1500);
    } catch (err) {
      setError(err?.message || "Erro ao criar anúncio");
    } finally {
      setUploadingImages(false);
    }
  };

  // limpa os ObjectURLs quando a lista muda ou ao desmontar
  useEffect(() => {
    return () => {
      imagePreviews.forEach((p) => {
        try {
          URL.revokeObjectURL(p);
        } catch {}
      });
    };
  }, [imagePreviews]);

  return (
    <form onSubmit={handleSubmit} className={styles.registerForm}>
      <div className={styles.formBackground}>
        <header className={styles.header}>
          <h2>Criar anúncio</h2>
        </header>

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
              className={`${styles.input} ${styles.descTextarea}`}
              rows="4"
              maxLength="500"
            />
          </div>

          {/* Preço, Quantidade, Condição e Categoria */}
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
            />
            <p className={styles.helpText}>
              Formatos aceitos: JPG, PNG, WEBP. Tamanho máximo: 5MB por imagem.
            </p>

            {/* Preview */}
            {imagePreviews.length > 0 && (
              <div className={styles.imagePreviewContainer}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} className={styles.imagePreviewItem}>
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className={styles.imagePreview}
                    />
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

        {error && <div className={styles.errorMessage}>❌ {error}</div>}
        {success && (
          <div className={styles.successMessage}>
            ✅ Anúncio criado com sucesso! Redirecionando...
          </div>
        )}

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
