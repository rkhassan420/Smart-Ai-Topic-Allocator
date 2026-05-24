import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { generateTopicsWithAI } from "./aiTopics";
import { readPDFText } from "./pdfUtils";
import { DiffBadge } from "./SortableItem";
import {
  XIcon, SparklesIcon, SparklesLargeIcon, CheckSmIcon, CheckBoldIcon,
  FileTextIcon, WarningSmIcon, UploadIcon, ClipboardIcon, UploadCloudIcon,
  ClockIcon, RefreshIcon, PlusIcon,
} from "./Icons";

/* ══════════════════════════════════════════════════════
   SMART IMPORT MODAL (AI TOPIC GENERATOR)
══════════════════════════════════════════════════════ */
export function SmartImportModal({ onImport, onClose }) {
  const [stage,     setStage]     = useState("upload");
  const [rawText,   setRawText]   = useState("");
  const [fileName,  setFileName]  = useState("");
  const [inputMode, setInputMode] = useState("file");
  const [pasteText, setPasteText] = useState("");
  const [count,     setCount]     = useState(10);
  const [level,     setLevel]     = useState("Undergraduate");
  const [style,     setStyle]     = useState("Research-based");
  const [language,  setLanguage]  = useState("English");
  const [result,    setResult]    = useState(null);
  const [selected,  setSelected]  = useState(new Set());
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState("");
  const [streaming, setStreaming] = useState([]);
  const dropRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setStage("config");
    try {
      let text = "";
      if (file.name.toLowerCase().endsWith(".pdf")) {
        text = await readPDFText(file);
      } else {
        text = await file.text();
      }
      setRawText(text);
    } catch {
      toast.error("Could not read file.");
      setStage("upload");
    }
  };

  const handlePasteConfirm = () => {
    if (!pasteText.trim()) return;
    setRawText(pasteText.trim());
    setFileName("Pasted text");
    setStage("config");
  };

  const generate = async () => {
    const text = rawText.trim();
    if (!text) return;
    setStage("generating");
    setError("");
    setProgress(0);
    setStreaming([]);

    const msgs = [
      "Parsing document structure…",
      "Identifying key concepts and themes…",
      "Evaluating academic scope and depth…",
      "Generating assignment topics…",
      "Enriching with descriptions and difficulty levels…",
      "Finalising your topic set…",
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < msgs.length) {
        setStreaming((p) => [...p, msgs[i]]);
        setProgress(Math.round(((i + 1) / msgs.length) * 90));
        i++;
      } else clearInterval(interval);
    }, 600);

    try {
      const data = await generateTopicsWithAI({ text, count, level, style, language });
      clearInterval(interval);
      setProgress(100);
      setResult(data);
      setSelected(new Set(data.topics.map((_, idx) => idx)));
      setStage("review");
    } catch (e) {
      clearInterval(interval);
      setError(e.message || "AI generation failed.");
      setStage("config");
      toast.error("Generation failed — check API access.");
    }
  };

  const toggleTopic = (i) => {
    setSelected((p) => {
      const n = new Set(p);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };

  const handleImport = () => {
    if (!result) return;
    const topics = result.topics.filter((_, i) => selected.has(i)).map((t) => t.title);
    if (topics.length === 0) { toast.error("Select at least one topic."); return; }
    onImport(topics);
    onClose();
  };

  const handleReset = () => {
    setStage("upload"); setRawText(""); setFileName(""); setPasteText("");
    setResult(null); setSelected(new Set()); setError(""); setStreaming([]);
  };

  const stageIdx = { upload: 0, config: 1, generating: 2, review: 3 }[stage];

  return (
    <motion.div
      className="rta-modal-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="rta-modal rta-modal--smart"
        initial={{ scale: 0.94, y: 18 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="rta-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="sim-brain-badge"><SparklesIcon /> AI</span>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Smart Topic Generator</h2>
              {result?.contentSummary && stage === "review" && (
                <p style={{ fontSize: 11, color: "var(--text-3)", margin: "2px 0 0" }}>
                  {result.contentSummary}
                </p>
              )}
            </div>
          </div>
          <button className="rta-modal-close" onClick={onClose}><XIcon /></button>
        </div>

        {/* Step Indicator */}
        <div className="sim-steps">
          {["Upload", "Configure", "Generate", "Review"].map((s, i) => (
            <div
              key={s}
              className={`sim-step ${i <= stageIdx ? "active" : ""} ${i < stageIdx ? "done" : ""}`}
            >
              <span className="sim-step-dot">{i < stageIdx ? <CheckSmIcon /> : i + 1}</span>
              <span className="sim-step-label">{s}</span>
              {i < 3 && <span className="sim-step-line" />}
            </div>
          ))}
        </div>

        <div className="rta-modal-body">

          {/* UPLOAD */}
          {stage === "upload" && (
            <>
              <div className="sim-input-tabs">
                <button
                  className={`sim-input-tab ${inputMode === "file" ? "active" : ""}`}
                  onClick={() => setInputMode("file")}
                >
                  <UploadIcon /> Upload file
                </button>
                <button
                  className={`sim-input-tab ${inputMode === "paste" ? "active" : ""}`}
                  onClick={() => setInputMode("paste")}
                >
                  <ClipboardIcon /> Paste text
                </button>
              </div>

              {inputMode === "file" ? (
                <div
                  ref={dropRef}
                  className="sim-dropzone"
                  onClick={() => document.getElementById("simFileInput").click()}
                  onDragOver={(e) => { e.preventDefault(); dropRef.current?.classList.add("drag-over"); }}
                  onDragLeave={() => dropRef.current?.classList.remove("drag-over")}
                  onDrop={(e) => {
                    e.preventDefault();
                    dropRef.current?.classList.remove("drag-over");
                    handleFile(e.dataTransfer.files[0]);
                  }}
                >
                  <input
                    id="simFileInput"
                    type="file"
                    accept=".txt,.md,.csv,.pdf"
                    style={{ display: "none" }}
                    onChange={(e) => handleFile(e.target.files[0])}
                  />
                  <div className="sim-drop-icon"><UploadCloudIcon /></div>
                  <p className="sim-drop-title">Drop your document here</p>
                  <p className="sim-drop-sub">or click to browse</p>
                  <div className="sim-file-types">
                    {[".txt", ".md", ".csv", ".pdf"].map((ext) => (
                      <span key={ext} className="sim-file-badge">{ext}</span>
                    ))}
                  </div>
                  <p className="sim-drop-note">Your file is processed locally — nothing is stored or sent externally.</p>
                </div>
              ) : (
                <div className="sim-paste-area">
                  <textarea
                    className="sim-paste-textarea"
                    placeholder="Paste your lecture notes, syllabus, textbook chapter, research paper…"
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    autoFocus
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                      {pasteText.length > 0
                        ? `${pasteText.length} characters`
                        : "Minimum ~200 characters recommended"}
                    </span>
                    <button
                      className="rta-btn rta-btn--primary"
                      onClick={handlePasteConfirm}
                      disabled={pasteText.trim().length < 50}
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* CONFIG */}
          {stage === "config" && (
            <>
              <div className="sim-file-pill">
                <FileTextIcon />
                <span style={{ flex: 1, fontSize: 13 }}>{fileName}</span>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                  {rawText.length.toLocaleString()} chars
                </span>
                <button className="rta-ghost-btn" onClick={handleReset} style={{ fontSize: 11 }}>
                  Change
                </button>
              </div>
              {error && <div className="sim-error"><WarningSmIcon /> {error}</div>}
              <div className="sim-config-grid">
                <div className="sim-config-card">
                  <span className="sim-config-label">Number of topics</span>
                  <div className="sim-slider-row">
                    <input
                      type="range" min={3} max={25} step={1}
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="sim-range"
                    />
                    <span className="sim-range-val">{count}</span>
                  </div>
                </div>
                <div className="sim-config-card">
                  <span className="sim-config-label">Academic level</span>
                  <div className="sim-pill-group">
                    {["High School", "Undergraduate", "Graduate", "Professional"].map((l) => (
                      <button
                        key={l}
                        className={`sim-pill ${level === l ? "active" : ""}`}
                        onClick={() => setLevel(l)}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sim-config-card">
                  <span className="sim-config-label">Assignment style</span>
                  <div className="sim-pill-group">
                    {["Research-based", "Project-based", "Essay", "Presentation", "Case Study"].map((s) => (
                      <button
                        key={s}
                        className={`sim-pill ${style === s ? "active" : ""}`}
                        onClick={() => setStyle(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sim-config-card">
                  <span className="sim-config-label">Output language</span>
                  <div className="sim-pill-group">
                    {["English", "Urdu", "Arabic", "French", "Spanish"].map((lang) => (
                      <button
                        key={lang}
                        className={`sim-pill ${language === lang ? "active" : ""}`}
                        onClick={() => setLanguage(lang)}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* GENERATING */}
          {stage === "generating" && (
            <div className="sim-generating">
              <div className="sim-gen-orb">
                <div className="sim-orb-ring" />
                <div className="sim-orb-ring sim-orb-ring--2" />
                <SparklesLargeIcon />
              </div>
              <p className="sim-gen-title">Analysing your document…</p>
              <div className="sim-progress-track">
                <motion.div
                  className="sim-progress-fill"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
              <div className="sim-stream-log">
                <AnimatePresence>
                  {streaming.map((msg, i) => (
                    <motion.div
                      key={i}
                      className="sim-stream-line"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="sim-stream-dot" />{msg}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* REVIEW */}
          {stage === "review" && result && (
            <>
              <div className="sim-review-header">
                <div className="sim-review-stats">
                  <div className="sim-review-stat">
                    <span className="sim-stat-val">{result.topics.length}</span>
                    <span className="sim-stat-key">generated</span>
                  </div>
                  <div className="sim-review-stat-sep" />
                  <div className="sim-review-stat">
                    <span className="sim-stat-val">{selected.size}</span>
                    <span className="sim-stat-key">selected</span>
                  </div>
                  <div className="sim-review-stat-sep" />
                  <div className="sim-review-stat">
                    <span className="sim-stat-val">
                      {result.topics
                        .filter((_, i) => selected.has(i))
                        .reduce((a, t) => a + (t.estimatedHours || 0), 0)}h
                    </span>
                    <span className="sim-stat-key">est. total work</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="rta-ghost-btn"
                    onClick={() => setSelected(new Set(result.topics.map((_, i) => i)))}
                  >
                    All
                  </button>
                  <button className="rta-ghost-btn" onClick={() => setSelected(new Set())}>
                    None
                  </button>
                  <button
                    className="rta-ghost-btn"
                    onClick={() => { setStage("config"); setError(""); }}
                  >
                    <RefreshIcon /> Regenerate
                  </button>
                </div>
              </div>

              <div className="sim-topics-list">
                <AnimatePresence mode="popLayout">
                  {result.topics.map((topic, i) => {
                    const isOn = selected.has(i);
                    return (
                      <motion.div
                        key={i} layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.16, delay: i * 0.035 }}
                        className={`sim-topic-card ${isOn ? "sim-topic-card--on" : ""}`}
                        onClick={() => toggleTopic(i)}
                      >
                        <div className="sim-topic-check">{isOn ? <CheckBoldIcon /> : null}</div>
                        <div className="sim-topic-body">
                          <div className="sim-topic-top">
                            <span className="sim-topic-title">{topic.title}</span>
                            <DiffBadge level={topic.difficulty} />
                          </div>
                          <p className="sim-topic-desc">{topic.description}</p>
                          <div className="sim-topic-meta">
                            <span className="sim-topic-hours">
                              <ClockIcon /> ~{topic.estimatedHours}h
                            </span>
                            {topic.tags?.map((tag) => (
                              <span key={tag} className="sim-topic-tag">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="rta-modal-footer">
          {stage === "upload" && (
            <button className="rta-btn rta-btn--ghost" onClick={onClose}>Cancel</button>
          )}
          {stage === "config" && (
            <>
              <button className="rta-btn rta-btn--ghost" onClick={handleReset}>← Back</button>
              <button className="rta-btn rta-btn--primary" onClick={generate}>
                <SparklesIcon /> Generate {count} topics
              </button>
            </>
          )}
          {stage === "review" && (
            <>
              <button className="rta-btn rta-btn--ghost" onClick={handleReset}>Start over</button>
              <button
                className="rta-btn rta-btn--primary"
                disabled={selected.size === 0}
                onClick={handleImport}
              >
                <PlusIcon /> Add {selected.size} topic{selected.size !== 1 ? "s" : ""} to list
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}