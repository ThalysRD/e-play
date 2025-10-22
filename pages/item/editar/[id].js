import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import useSWRMutation from "swr/mutation";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebase";
import styles from "styles/item/criar-anuncio.module.css";

const UPLOAD_TIMEOUT_MS = 60_000;

async function sendRequest(url, { arg }) {
  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(arg),
    });

    if (!response.ok) {
      let errorMessage = "Erro ao atualizar anúncio";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // Silenciosamente ignorar erro de parse
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (err) {
    throw err;
  }
}

export default function EditListingPage() {
  return <EditListingForm />;
}

function EditListingForm() {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    condition: "Novo",
    quantity: "1",
    categoryId: "",
  });

  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { trigger, isMutating } = useSWRMutation(
    id ? `/api/v1/listings/${id}` : null,
    sendRequest
  );

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id]);

  async function fetchListing() {
    try {
      const response = await fetch(`/api/v1/listings/${id}`);
      if (!response.ok) throw new Error("Anúncio não encontrado");

      const listing = await response.json();

      setFormData({
        title: listing.title,
        description: listing.description,
        price: listing.price,
        condition: listing.listing_condition,
        quantity: listing.quantity,
        categoryId: listing.category_id,
      });

      const imageUrls = (listing.images || []).map(img => img.image_url);
      setImages(imageUrls);
    } catch (err) {
      console.error(`${LOG_PREFIX} erro ao carregar`, err);
      setError(err.message);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleImageChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > 6) {
      setError(`Máximo 6 imagens. Você já tem ${images.length}`);
      e.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (files.some(f => f.size > maxSize)) {
      setError("Imagens maiores que 5MB não são permitidas");
      e.target.value = "";
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (files.some(f => !validTypes.includes(f.type))) {
      setError("Apenas JPG, PNG e WEBP são permitidos");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls = await Promise.all(
        files.map(file => uploadImageToFirebase(file))
      );
      setImages(prev => [...prev, ...uploadedUrls]);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function uploadImageToFirebase(file) {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).slice(2);
      const safeName = file.name.replace(/\s+/g, "_");
      const path = `listings/${timestamp}_${random}_${safeName}`;
      const storageRef = ref(storage, path);

      const task = uploadBytesResumable(storageRef, file);
      const timeout = setTimeout(() => {
        task.cancel();
        reject(new Error(`Timeout ao enviar ${file.name}`));
      }, UPLOAD_TIMEOUT_MS);

      task.on(
        "state_changed",
        () => { },
        (err) => {
          clearTimeout(timeout);
          reject(err);
        },
        async () => {
          clearTimeout(timeout);
          try {
            const url = await getDownloadURL(storageRef);
            resolve(url);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  }

  function removeImage(index) {
    if (images.length <= 1) {
      setError("O anúncio deve ter pelo menos 1 imagem");
      return;
    }
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);

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
    if (images.length === 0) {
      setError("O anúncio deve ter pelo menos 1 imagem");
      return;
    }

    try {
      const dataToSend = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price).toFixed(2),
        condition: formData.condition,
        quantity: Number(formData.quantity),
        categoryId: formData.categoryId,
        images: images,
      };

      const result = await trigger(dataToSend);

      setSuccess(true);
      setTimeout(() => router.push(`/item/${result.id}?refresh=${Date.now()}`), 1500);
    } catch (err) {
      console.error(`${LOG_PREFIX} erro`, err);
      setError(err?.message || "Erro ao atualizar anúncio");
    }
  }

  useEffect(() => {
    return () => {
      images.forEach(url => {
        try { URL.revokeObjectURL(url); } catch { }
      });
    };
  }, [images]);

  return (
    <form onSubmit={handleSubmit} className={styles.registerForm}>
      <div className={styles.formBackground}>
        <header className={styles.header}>
          <h2>Editar anúncio</h2>
        </header>

        <div className={styles.formContainer}>
          <div className={styles.fieldGroup}>
            <label htmlFor="title" className={styles.label}>Título do Anúncio</label>
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

          <div className={styles.fieldGroup}>
            <label htmlFor="description" className={styles.label}>Descrição</label>
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

          <div className={styles.rowGroup}>
            <div className={styles.fieldGroupHalf}>
              <label htmlFor="price" className={styles.label}>Preço (R$)</label>
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
              <label htmlFor="quantity" className={styles.label}>Quantidade</label>
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
              <label htmlFor="condition" className={styles.label}>Condição</label>
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
              <label htmlFor="categoryId" className={styles.label}>Categoria</label>
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

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Imagens do Produto (até 6 imagens)</label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handleImageChange}
              className={styles.fileInput}
              disabled={uploading}
            />
            <p className={styles.helpText}>
              Formatos aceitos: JPG, PNG, WEBP. Tamanho máximo: 5MB por imagem.
            </p>

            {images.length > 0 && (
              <div className={styles.imagePreviewContainer}>
                {images.map((image, index) => (
                  <div key={index} className={styles.imagePreviewItem}>
                    <img src={image} alt={`Preview ${index + 1}`} className={styles.imagePreview} />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className={styles.removeImageBtn}
                      disabled={images.length === 1}
                      title={images.length === 1 ? "Precisa ter pelo menos 1 imagem" : "Remover imagem"}
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
        {success && <div className={styles.successMessage}>✅ Anúncio atualizado com sucesso! Redirecionando...</div>}

        <button
          type="submit"
          className={styles.createButton}
          disabled={isMutating || uploading}
        >
          {uploading ? "Enviando imagens..." : isMutating ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </form>
  );
}
