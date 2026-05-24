import { useState, useRef, useEffect, useCallback } from "react";
import {
  DndContext, closestCenter,
  KeyboardSensor, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { ExportButton } from "./components/ExportModal";

import { API, LS, uid, toItems, fromItems, load, save } from "./components/constants";
import { SortableItem } from "./components/SortableItem";
import { ResultRow } from "./components/ResultRow";
import { HistoryPanel } from "./components/HistoryPanel";
import { BulkImportModal } from "./components/BulkImportModal";
import { SmartImportModal } from "./components/SmartImportModal";
import {
  HistoryIcon, BulkIcon, SparklesIcon,
  WarningIcon, ShuffleIcon, SpinnerIcon,
  SaveIcon, TrashIcon,
} from "./components/Icons";

import "./App.css";

export default function RandomTopicAllocator() {
  const [students,    setStudents]    = useState(() => toItems(load(LS.students, [])));
  const [topics,      setTopics]      = useState(() => toItems(load(LS.topics, [])));
  const [assignments, setAssignments] = useState(() => load(LS.assignments, null));
  const [history,     setHistory]     = useState(() => load(LS.history, []));

  const [studentInput,     setStudentInput]     = useState("");
  const [topicInput,       setTopicInput]       = useState("");
  const [loading,          setLoading]          = useState(false);
  const [rerolling,        setRerolling]        = useState(null);
  const [showHistory,      setShowHistory]      = useState(false);
  const [showBulk,         setShowBulk]         = useState(null);
  const [showSmartImport,  setShowSmartImport]  = useState(false);
  const [sessionNameDraft, setSessionNameDraft] = useState("");

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const studentRef = useRef(null);
  const topicRef   = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { save(LS.students,    fromItems(students)); }, [students]);
  useEffect(() => { save(LS.topics,      fromItems(topics));   }, [topics]);
  useEffect(() => { save(LS.assignments, assignments);          }, [assignments]);
  useEffect(() => { save(LS.history,     history);              }, [history]);

  // ── Escape closes modals ──────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setShowHistory(false);
        setShowBulk(null);
        setShowSmartImport(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── List helpers ──────────────────────────────────────
  const addStudent = useCallback(() => {
    const v = studentInput.trim();
    if (!v) return;
    setStudents((p) => [...p, { id: uid(), value: v }]);
    setStudentInput("");
    studentRef.current?.focus();
  }, [studentInput]);

  const addTopic = useCallback(() => {
    const v = topicInput.trim();
    if (!v) return;
    setTopics((p) => [...p, { id: uid(), value: v }]);
    setTopicInput("");
    topicRef.current?.focus();
  }, [topicInput]);

  const deleteItem = (setter) => (id) => setter((p) => p.filter((i) => i.id !== id));
  const editItem   = (setter) => (id, val) =>
    setter((p) => p.map((i) => (i.id === id ? { ...i, value: val } : i)));

  const handleDragEnd = (setter) => ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setter((items) => {
      const oldIdx = items.findIndex((i) => i.id === active.id);
      const newIdx = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIdx, newIdx);
    });
  };

  const bulkImport = (type, values) => {
    const newItems = toItems(values);
    if (type === "students") setStudents((p) => [...p, ...newItems]);
    else                     setTopics((p)   => [...p, ...newItems]);
    toast.success(`Imported ${values.length} ${type}`);
  };

  const handleAiImport = useCallback((topicTitles) => {
    const newItems = toItems(topicTitles);
    setTopics((p) => [...p, ...newItems]);
    toast.success(`✨ Added ${topicTitles.length} AI-generated topics!`, { duration: 3000 });
  }, []);

  // ── Assign ────────────────────────────────────────────
  const handleAssign = useCallback(async () => {
    const sArr = fromItems(students);
    const tArr = fromItems(topics);
    if (!sArr.length || !tArr.length) {
      toast.error("Add at least one student and one topic.");
      return;
    }
    if (sArr.length > tArr.length) {
      toast.error(
        `${sArr.length - tArr.length} student(s) won't get a unique topic — add more topics.`,
        { duration: 4000 }
      );
    }
    setLoading(true);
    const toastId = toast.loading("Assigning topics…");
    try {
      const res = await axios.post(`${API}/assign/`, { students: sArr, topics: tArr });
      setAssignments(res.data.assignments);
      toast.success("Topics assigned!", { id: toastId });
    } catch {
      toast.error("API error — please try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  }, [students, topics]);

  const handleReroll = useCallback(async (student) => {
    const sArr = fromItems(students);
    const tArr = fromItems(topics);
    setRerolling(student);
    try {
      const res = await axios.post(`${API}/assign/`, { students: sArr, topics: tArr });
      const newTopic = res.data.assignments[student];
      setAssignments((prev) => ({ ...prev, [student]: newTopic }));
      toast.success(`Re-rolled "${student}" → ${newTopic}`);
    } catch {
      toast.error("Re-roll failed.");
    } finally {
      setRerolling(null);
    }
  }, [students, topics]);

  // ── Sessions ──────────────────────────────────────────
  const saveSession = () => {
    if (!assignments) return;
    const name = sessionNameDraft.trim() || `Session ${new Date().toLocaleDateString()}`;
    const session = {
      id: uid(), name,
      date: new Date().toLocaleDateString(),
      assignments,
      students: fromItems(students),
      topics:   fromItems(topics),
    };
    setHistory((p) => [session, ...p]);
    setSessionNameDraft("");
    toast.success(`Session "${name}" saved.`);
  };

  const loadSession = (session) => {
    setStudents(toItems(session.students));
    setTopics(toItems(session.topics));
    setAssignments(session.assignments);
    toast.success(`Loaded "${session.name}"`);
  };

  const deleteSession = (id) => {
    setHistory((p) => p.filter((s) => s.id !== id));
    toast.success("Session deleted.");
  };

  const clearAll = () => {
    setStudents([]); setTopics([]); setAssignments(null);
    setStudentInput(""); setTopicInput("");
    Object.values(LS).forEach((k) => localStorage.removeItem(k));
    toast("Cleared.", { icon: "🗑️" });
  };

  const studentCount = students.length;
  const topicCount   = topics.length;
  const hasConflict  = studentCount > topicCount && topicCount > 0;
  const assignCount  = assignments ? Object.keys(assignments).length : 0;

  return (
    <div className="rta-root">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1a1a24", color: "#e8e6ff",
            border: "1px solid rgba(255,255,255,0.1)",
            fontFamily: "var(--font-ui)", fontSize: "13px",
          },
        }}
      />

      {/* Top Bar */}
      <header className="rta-topbar">
        <div className="rta-topbar-left">
          <span className="rta-logo-dot" />
          <span className="rta-logo-text">Allocator</span>
        </div>
        <div className="rta-topbar-right">
          <button className="rta-topbar-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button className="rta-topbar-btn" onClick={() => setShowHistory(true)} title="Session history">
            <HistoryIcon /> History
            {history.length > 0 && <span className="rta-badge">{history.length}</span>}
          </button>
        </div>
      </header>

      <main className="rta-main">
        {/* Hero */}
        <div className="rta-hero">
          <h1 className="rta-title">Smart Topic<br /><em>Allocator</em></h1>
          <p className="rta-subtitle">Fairly assign topics to students in seconds.</p>
        </div>

        {/* Two-column inputs */}
        <div className="rta-columns">

          {/* Students Column */}
          <section className="rta-col">
            <div className="rta-col-header">
              <h2 className="rta-col-title">
                Students
                {studentCount > 0 && <span className="rta-count rta-count--teal">{studentCount}</span>}
              </h2>
              <button className="rta-ghost-btn" onClick={() => setShowBulk("students")} title="Bulk import">
                <BulkIcon /> Bulk import
              </button>
            </div>
            <div className="rta-input-row">
              <input
                ref={studentRef}
                className="rta-input"
                type="text"
                placeholder="Student name…"
                value={studentInput}
                onChange={(e) => setStudentInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addStudent()}
              />
              <button className="rta-add-btn rta-add-btn--teal" onClick={addStudent} title="Add (Enter)">+</button>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd(setStudents)}
            >
              <SortableContext items={students.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <AnimatePresence mode="popLayout">
                  <ul className="rta-list">
                    {students.map((item, idx) => (
                      <SortableItem
                        key={item.id} item={item} index={idx} color="teal"
                        onDelete={deleteItem(setStudents)}
                        onEdit={editItem(setStudents)}
                      />
                    ))}
                  </ul>
                </AnimatePresence>
              </SortableContext>
            </DndContext>
            {studentCount === 0 && (
              <p className="rta-empty">Add students above or bulk import a list.</p>
            )}
          </section>

          {/* Topics Column */}
          <section className="rta-col">
            <div className="rta-col-header">
              <h2 className="rta-col-title">
                Topics
                {topicCount > 0 && <span className="rta-count rta-count--amber">{topicCount}</span>}
              </h2>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button className="rta-ghost-btn" onClick={() => setShowBulk("topics")} title="Bulk import">
                  <BulkIcon /> Bulk
                </button>
                <button
                  className="rta-ghost-btn rta-ghost-btn--ai"
                  onClick={() => setShowSmartImport(true)}
                  title="Generate topics with AI from a document"
                >
                  <SparklesIcon /> AI Generate
                </button>
              </div>
            </div>
            <div className="rta-input-row">
              <input
                ref={topicRef}
                className="rta-input"
                type="text"
                placeholder="Topic name…"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTopic()}
              />
              <button className="rta-add-btn rta-add-btn--amber" onClick={addTopic} title="Add (Enter)">+</button>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd(setTopics)}
            >
              <SortableContext items={topics.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <AnimatePresence mode="popLayout">
                  <ul className="rta-list">
                    {topics.map((item, idx) => (
                      <SortableItem
                        key={item.id} item={item} index={idx} color="amber"
                        onDelete={deleteItem(setTopics)}
                        onEdit={editItem(setTopics)}
                      />
                    ))}
                  </ul>
                </AnimatePresence>
              </SortableContext>
            </DndContext>
            {topicCount === 0 && (
              <p className="rta-empty">Add topics above, bulk import, or use <strong>AI Generate</strong> ✨</p>
            )}
          </section>
        </div>

        {/* Conflict Warning */}
        <AnimatePresence>
          {hasConflict && (
            <motion.div
              className="rta-conflict"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              <WarningIcon />
              <strong>{studentCount - topicCount} student(s)</strong> won't receive a unique topic.
              Add at least <strong>{studentCount - topicCount}</strong> more topic(s).
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Bar */}
        <div className="rta-action-bar">
          <button
            className={`rta-btn rta-btn--primary rta-btn--lg ${loading ? "loading" : ""}`}
            onClick={handleAssign}
            disabled={loading || studentCount === 0 || topicCount === 0}
            title="Assign topics"
          >
            {loading ? <><SpinnerIcon /> Assigning…</> : <><ShuffleIcon /> Assign Topics</>}
          </button>

          {assignments && (
            <>
              <ExportButton assignments={assignments} />

              <input
                className="rta-input rta-input--session"
                placeholder="Session name…"
                value={sessionNameDraft}
                onChange={(e) => setSessionNameDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveSession()}
              />
              <button className="rta-btn rta-btn--outline" onClick={saveSession} title="Save this session">
                <SaveIcon /> Save
              </button>
            </>
          )}

          {(studentCount > 0 || topicCount > 0 || assignments) && (
            <button className="rta-btn rta-btn--danger" onClick={clearAll} title="Clear all data">
              <TrashIcon />
            </button>
          )}
        </div>

        {/* Results Table */}
        <AnimatePresence>
          {assignments && (
            <motion.div
              className="rta-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rta-results-header">
                <h2 className="rta-results-title">
                  Assignments
                  <span className="rta-count rta-count--violet">{assignCount}</span>
                </h2>
              </div>
              <div className="rta-table-wrap">
                <table className="rta-table">
                  <thead>
                    <tr><th>#</th><th>Student</th><th>Topic</th><th></th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(assignments).map(([student, topic], idx) => (
                      <ResultRow
                        key={student}
                        student={student} topic={topic} index={idx}
                        onReroll={handleReroll}
                        isRerolling={rerolling === student}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showHistory     && <HistoryPanel     history={history} onLoad={loadSession} onDelete={deleteSession} onClose={() => setShowHistory(false)} />}
        {showBulk        && <BulkImportModal  type={showBulk} onImport={(v) => bulkImport(showBulk, v)} onClose={() => setShowBulk(null)} />}
        {showSmartImport && <SmartImportModal onImport={handleAiImport} onClose={() => setShowSmartImport(false)} />}
      </AnimatePresence>
    </div>
  );
}