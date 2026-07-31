import { useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { useCreateCollection, useUpdateCollection } from "../../../services/useCollectionQueries";
import { uploadToS3 } from "../../../api";

const emptyForm = { name: "", description: "", image: null };

const uploadSingleFile = async (file) => {
  const formData = new FormData();
  formData.append("images", file);
  const data = await uploadToS3(formData);
  if (!data.success) throw new Error(data.message || "Upload failed");
  const uploaded = data.files?.[0];
  if (!uploaded?.url) throw new Error("Upload succeeded but no URL returned");
  return uploaded;
};

export default function CollectionFormModal({ open, onClose, collection }) {
  const isEdit = Boolean(collection);
  const [form, setForm] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();

  const saving = createCollection.isPending || updateCollection.isPending || isSubmitting;

  useEffect(() => {
    if (!open) return;
    setForm({
      name: collection?.name || "",
      description: collection?.description || "",
      image: collection?.image || null,
    });
    setImagePreview(collection?.image?.url || "");
    setImageFile(null);
  }, [open, collection]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setIsSubmitting(true);
      let currentImage = form.image;

      if (imageFile) {
        const uploaded = await uploadSingleFile(imageFile);
        currentImage = {
          key: uploaded.key,
          url: uploaded.url,
        };
      }

      const payload = {
        ...form,
        image: currentImage,
      };

      if (isEdit) {
        await updateCollection.mutateAsync({ id: collection._id, ...payload });
      } else {
        await createCollection.mutateAsync(payload);
      }

      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save collection");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit collection" : "Create collection"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Cover image</label>
          <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
            {imagePreview ? (
              <img src={imagePreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <>
                <ImagePlus size={20} className="text-gray-400" />
                <span className="text-sm text-gray-400">Click to upload an image</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Summer Lehengas"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="What makes this collection special?"
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create collection"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
