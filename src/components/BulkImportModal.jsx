import { useState } from "react";
import { motion } from "framer-motion";
import { XIcon } from "./Icons";

/* ══════════════════════════════════════════════════════
   BULK IMPORT MODAL
══════════════════════════════════════════════════════ */
export function BulkImportModal({ type, onImport, onClose }) {
  const [text, setText] = useState("");
  const preview = text.split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <motion.div
      className="rta-modal-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="rta-modal"
        initial={{ scale: 0.93 }} animate={{ scale: 1 }} exit={{ scale: 0.93 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rta-modal-header">
          <h2>Bulk Import {type === "students" ? "Students" : "Topics"}</h2>
          <button className="rta-modal-close" onClick={onClose}><XIcon /></button>
        </div>

        <div className="rta-modal-body">
          <p className="rta-modal-hint">
            Paste one {type === "students" ? "student name" : "topic"} per line:
          </p>
          <textarea
            className="rta-bulk-textarea"
            placeholder={
              type === "students"
                ? "Alice\nBob\nCharlie"
                : "Machine Learning\nWeb Dev\nDatabases"
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          {preview.length > 0 && (
            <p className="rta-preview-hint">
              → Will add <strong>{preview.length}</strong>{" "}
              {type === "students" ? "student(s)" : "topic(s)"}
            </p>
          )}
        </div>

        <div className="rta-modal-footer">
          <button className="rta-btn rta-btn--ghost" onClick={onClose}>Cancel</button>
          <button
            className="rta-btn rta-btn--primary"
            disabled={preview.length === 0}
            onClick={() => { onImport(preview); onClose(); }}
          >
            Import {preview.length > 0 ? `${preview.length} items` : ""}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
