import { useState, useEffect } from "react";
import axios from "axios";
import { Upload, Trash2, FileText } from "lucide-react";
import { API_URL } from "../config";
import { useToast } from "./ui/Toast";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import Alert from "./ui/Alert";
import { SelectField } from "./ui/FormField";

const DOC_TYPES = ["RC", "Insurance", "Permit", "Fitness Certificate"];

export default function VehicleDocumentsModal({ vehicle, open, onClose, canManage }) {
  const { showToast } = useToast();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchDocuments = async () => {
    if (!vehicle) return;
    setLoading(true);
    setLoadError("");
    try {
      const res = await axios.get(
        `${API_URL}/vehicles/${vehicle.id}/documents`,
        authHeaders()
      );
      setDocuments(res.data.documents);
    } catch (err) {
      setLoadError(err.response?.data?.detail || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDocuments();
      setUploadError("");
      setFile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vehicle]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("doc_type", docType);
      formData.append("file", file);

      await axios.post(
        `${API_URL}/vehicles/${vehicle.id}/documents`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setFile(null);
      e.target.reset();
      showToast(`${docType} uploaded`);
      fetchDocuments();
    } catch (err) {
      setUploadError(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId, docTypeLabel) => {
    if (!window.confirm(`Delete this ${docTypeLabel} document?`)) return;
    try {
      await axios.delete(
        `${API_URL}/vehicles/${vehicle.id}/documents/${docId}`,
        authHeaders()
      );
      showToast(`${docTypeLabel} document deleted`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      showToast(err.response?.data?.detail || "Delete failed", "error");
    }
  };

  if (!vehicle) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Documents — ${vehicle.name} (${vehicle.registration_number})`}
    >
      <Alert variant="error">{loadError}</Alert>

      {loading ? (
        <p className="text-sm text-ink-400">Loading documents...</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-ink-400 mb-4">No documents uploaded yet.</p>
      ) : (
        <div className="mb-4 divide-y divide-ink-100 dark:divide-ink-800">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between py-2">
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-ink-900 dark:text-ink-100 hover:text-signal-500"
              >
                <FileText size={15} />
                {doc.doc_type}
                <span className="text-ink-400 text-xs">
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </span>
              </a>
              {canManage && (
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id, doc.doc_type)}
                  className="text-ink-400 hover:text-red-500"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canManage && (
        <form onSubmit={handleUpload} className="border-t border-ink-100 dark:border-ink-800 pt-4">
          <Alert variant="error">{uploadError}</Alert>

          <SelectField
            label="Document Type"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </SelectField>

          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files[0])}
            required
            className="w-full text-sm text-ink-600 dark:text-ink-300 mb-3"
          />

          <Button type="submit" icon={Upload} loading={uploading} disabled={!file}>
            Upload Document
          </Button>
        </form>
      )}
    </Modal>
  );
}