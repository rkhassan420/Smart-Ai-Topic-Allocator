import { motion } from "framer-motion";
import { DiceIcon } from "./Icons";

/* ══════════════════════════════════════════════════════
   RESULT ROW
══════════════════════════════════════════════════════ */
export function ResultRow({ student, topic, index, onReroll, isRerolling }) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.05 }}
      className="rta-result-row"
    >
      <td className="rta-td-num">{index + 1}</td>
      <td className="rta-td-student"><strong>{student}</strong></td>
      <td className="rta-td-topic">{topic}</td>
      <td className="rta-td-action">
        <button
          className={`rta-reroll-btn ${isRerolling ? "spinning" : ""}`}
          onClick={() => onReroll(student)}
          title="Re-roll this student's topic"
          disabled={isRerolling}
        >
          <DiceIcon />
        </button>
      </td>
    </motion.tr>
  );
}
