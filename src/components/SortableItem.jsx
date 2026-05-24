import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripIcon, PencilIcon, XIcon } from "./Icons";

/* ══════════════════════════════════════════════════════
   DIFFICULTY BADGE
══════════════════════════════════════════════════════ */
const DIFF_COLOR = {
  Easy:   { bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.3)",  text: "#4ade80" },
  Medium: { bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)",  text: "#fbbf24" },
  Hard:   { bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)", text: "#f87171" },
};

export function DiffBadge({ level }) {
  const c = DIFF_COLOR[level] || DIFF_COLOR.Medium;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px",
      borderRadius: 99, border: `1px solid ${c.border}`,
      background: c.bg, color: c.text, letterSpacing: "0.05em", textTransform: "uppercase",
    }}>
      {level}
    </span>
  );
}

/* ══════════════════════════════════════════════════════
   SORTABLE ITEM
══════════════════════════════════════════════════════ */
export function SortableItem({ item, index, onDelete, onEdit, color }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(item.value);
  const inputRef = useRef(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  const commitEdit = () => {
    if (draft.trim()) onEdit(item.id, draft.trim());
    setEditing(false);
  };

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  return (
    <motion.li
      ref={setNodeRef}
      style={style}
      className={`rta-list-item rta-list-item--${color} ${isDragging ? "dragging" : ""}`}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0, paddingBlock: 0 }}
      transition={{ duration: 0.16 }}
      layout
    >
      <span className="rta-drag-handle" {...attributes} {...listeners} title="Drag to reorder">
        <GripIcon />
      </span>
      <span className="rta-item-num">{index + 1}</span>

      {editing ? (
        <input
          ref={inputRef}
          className="rta-inline-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter")  commitEdit();
            if (e.key === "Escape") setEditing(false);
          }}
        />
      ) : (
        <span className="rta-item-value">{item.value}</span>
      )}

      <div className="rta-item-actions">
        <button
          className="rta-item-btn"
          onClick={() => { setDraft(item.value); setEditing(true); }}
          title="Edit"
        >
          <PencilIcon />
        </button>
        <button
          className="rta-item-btn rta-item-btn--del"
          onClick={() => onDelete(item.id)}
          title="Remove"
        >
          <XIcon />
        </button>
      </div>
    </motion.li>
  );
}
