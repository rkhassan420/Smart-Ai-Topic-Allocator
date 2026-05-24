import { motion } from "framer-motion";
import { XIcon } from "./Icons";

/* ══════════════════════════════════════════════════════
   HISTORY PANEL
══════════════════════════════════════════════════════ */
export function HistoryPanel({ history, onLoad, onDelete, onClose }) {
  return (
    <motion.div
      className="rta-modal-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="rta-modal rta-modal--history"
        initial={{ x: 40 }} animate={{ x: 0 }} exit={{ x: 40 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rta-modal-header">
          <h2>Session History</h2>
          <button className="rta-modal-close" onClick={onClose}><XIcon /></button>
        </div>

        <div className="rta-modal-body">
          {history.length === 0 && (
            <p className="rta-empty-hint">No saved sessions yet.</p>
          )}
          {history.map((session) => (
            <div key={session.id} className="rta-history-row">
              <div className="rta-history-meta">
                <span className="rta-history-name">{session.name}</span>
                <span className="rta-history-date">
                  {session.date} · {Object.keys(session.assignments).length} students
                </span>
              </div>
              <div className="rta-history-actions">
                <button
                  className="rta-btn rta-btn--xs rta-btn--ghost"
                  onClick={() => { onLoad(session); onClose(); }}
                >
                  Load
                </button>
                <button
                  className="rta-btn rta-btn--xs rta-btn--danger"
                  onClick={() => onDelete(session.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
