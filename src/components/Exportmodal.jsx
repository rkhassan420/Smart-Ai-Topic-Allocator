import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import "./ExportModal.css";

/* ══════════════════════════════════════════════════════
   EXPORT MODAL — PDF · Excel · PNG
══════════════════════════════════════════════════════ */

const FORMATS = [
  {
    id: "pdf",
    label: "PDF",
    icon: "📄",
    desc: "Styled report with table",
    cls: "fmt--pdf",
  },
  {
    id: "excel",
    label: "Excel",
    icon: "📊",
    desc: "Spreadsheet (.xlsx)",
    cls: "fmt--excel",
  },
  {
    id: "png",
    label: "PNG",
    icon: "🖼️",
    desc: "Designed image card",
    cls: "fmt--png",
  },
];

const THEMES = [
  { id: "midnight", label: "Midnight", bg: "#0f0f1a", header: "#1e1b4b", accent: "#818cf8", text: "#e0e7ff", row1: "#16162a", row2: "#1a1a2e" },
  { id: "forest",   label: "Forest",   bg: "#f0fdf4", header: "#14532d", accent: "#16a34a", text: "#166534", row1: "#ffffff", row2: "#f0fdf4" },
  { id: "ocean",    label: "Ocean",    bg: "#eff6ff", header: "#1e3a5f", accent: "#2563eb", text: "#1e3a5f", row1: "#ffffff", row2: "#eff6ff" },
  { id: "rose",     label: "Rose",     bg: "#fff1f2", header: "#881337", accent: "#e11d48", text: "#881337", row1: "#ffffff", row2: "#fff1f2" },
  { id: "graphite", label: "Graphite", bg: "#fafafa", header: "#18181b", accent: "#71717a", text: "#18181b", row1: "#ffffff", row2: "#f4f4f5" },
  { id: "amber",    label: "Amber",    bg: "#fffbeb", header: "#78350f", accent: "#d97706", text: "#78350f", row1: "#ffffff", row2: "#fffbeb" },
];

const FONTS = ["Helvetica", "Times New Roman", "Courier", "Georgia"];

function FieldRow({ label, children }) {
  return (
    <div className="em-field-row">
      <span className="em-field-label">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="em-toggle-label">
      <div className={`em-toggle-track ${checked ? "em-toggle-track--on" : ""}`} onClick={() => onChange(!checked)}>
        <div className={`em-toggle-thumb ${checked ? "em-toggle-thumb--on" : ""}`} />
      </div>
      <span className="em-toggle-text">{label}</span>
    </label>
  );
}

/* ─── PNG Canvas Renderer ─────────────────────────────── */
function renderAssignmentsToPNG({ assignments, cfg, theme }) {
  const entries = Object.entries(assignments);
  const rowH = 44;
  const headerH = cfg.showHeader ? 110 : 20;
  const footerH = cfg.showFooter ? 48 : 16;
  const canvasW = cfg.width || 900;
  const canvasH = headerH + entries.length * rowH + footerH + 32;

  const canvas = document.createElement("canvas");
  const dpr = 2;
  canvas.width  = canvasW * dpr;
  canvas.height = canvasH * dpr;

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, canvasW, canvasH);

  if (cfg.showHeader) {
    ctx.fillStyle = theme.header;
    ctx.fillRect(0, 0, canvasW, headerH);
    ctx.fillStyle = theme.accent;
    ctx.fillRect(0, headerH - 4, canvasW, 4);
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${cfg.titleSize || 26}px ${cfg.font || "Helvetica"}`;
    ctx.fillText(cfg.title || "Topic Assignments", 36, 44);
    if (cfg.subtitle) {
      ctx.font = `14px ${cfg.font || "Helvetica"}`;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(cfg.subtitle, 36, 66);
    }
    if (cfg.showDate) {
      ctx.font = `11px ${cfg.font || "Helvetica"}`;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(`Generated: ${new Date().toLocaleDateString()}`, 36, 88);
    }
  }

  const colY = headerH + 16;
  ctx.fillStyle = theme.accent + "22";
  ctx.fillRect(0, colY - 14, canvasW, 28);
  ctx.fillStyle = theme.accent;
  ctx.font = `bold 11px ${cfg.font || "Helvetica"}`;
  ctx.fillText("#",       36,  colY + 2);
  ctx.fillText("Student", 80,  colY + 2);
  ctx.fillText("Topic",   canvasW * 0.42, colY + 2);

  entries.forEach(([student, topic], i) => {
    const y = headerH + 36 + i * rowH;
    ctx.fillStyle = i % 2 === 0 ? theme.row1 : theme.row2;
    ctx.fillRect(0, y - 14, canvasW, rowH);
    ctx.fillStyle = theme.accent;
    ctx.fillRect(0, y - 14, 3, rowH);
    ctx.fillStyle = theme.text;
    ctx.font = `12px ${cfg.font || "Helvetica"}`;
    ctx.fillText(String(i + 1), 36, y + 6);
    ctx.font = `bold 13px ${cfg.font || "Helvetica"}`;
    ctx.fillText(student, 80, y + 6);
    const maxW = canvasW - canvasW * 0.42 - 40;
    let topicText = topic;
    ctx.font = `13px ${cfg.font || "Helvetica"}`;
    while (ctx.measureText(topicText).width > maxW && topicText.length > 10) {
      topicText = topicText.slice(0, -4) + "…";
    }
    ctx.fillText(topicText, canvasW * 0.42, y + 6);
  });

  if (cfg.showFooter) {
    const fy = canvasH - footerH;
    ctx.fillStyle = theme.header;
    ctx.fillRect(0, fy, canvasW, footerH);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = `11px ${cfg.font || "Helvetica"}`;
    ctx.fillText(cfg.footerText || "Generated by TopicForge", 36, fy + 20);
    ctx.textAlign = "right";
    ctx.fillText(`${entries.length} students`, canvasW - 36, fy + 20);
    ctx.textAlign = "left";
  }

  return canvas;
}

/* ─── Main Export Modal ───────────────────────────────── */
export function ExportModal({ assignments, onClose }) {
  const [activeFormat, setActiveFormat] = useState("pdf");
  const [exporting,    setExporting]    = useState(false);

  const [cfg, setCfg] = useState({
    title:       "Topic Assignments",
    subtitle:    "",
    fileName:    "TopicForge_Export",
    font:        "Helvetica",
    titleSize:   26,
    showDate:    true,
    showHeader:  true,
    showFooter:  true,
    footerText:  "Generated by TopicForge",
    headerColor: "#1e1b4b",
    accentColor: "#818cf8",
    theme:       "midnight",
    fontSize:    11,
    orientation: "portrait",
    pageSize:    "a4",
    sheetName:   "Assignments",
    freezeHeader:    true,
    includeMetadata: true,
    width:       900,
  });

  const set = (k, v) => setCfg((p) => ({ ...p, [k]: v }));

  const currentTheme = THEMES.find((t) => t.id === cfg.theme) || THEMES[0];
  const fmt = FORMATS.find((f) => f.id === activeFormat);

  /* ── Exporters ── */
  const exportPDF = useCallback(() => {
    const entries = Object.entries(assignments);
    const doc = new jsPDF({ orientation: cfg.orientation, format: cfg.pageSize });
    const hex = cfg.accentColor.replace("#", "");
    const hr  = cfg.headerColor.replace("#", "");
    const ar = parseInt(hex.slice(0,2),16), ag = parseInt(hex.slice(2,4),16), ab = parseInt(hex.slice(4,6),16);
    const rr = parseInt(hr.slice(0,2),16),  rg = parseInt(hr.slice(2,4),16),  rb = parseInt(hr.slice(4,6),16);
    const pw = doc.internal.pageSize.getWidth();

    if (cfg.showHeader) {
      doc.setFillColor(rr, rg, rb);
      doc.rect(0, 0, pw, 38, "F");
      doc.setFillColor(ar, ag, ab);
      doc.rect(0, 35, pw, 3, "F");
      doc.setFontSize(cfg.titleSize - 4);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, "bold");
      doc.text(cfg.title, 14, 16);
      if (cfg.subtitle) {
        doc.setFontSize(10); doc.setFont(undefined, "normal");
        doc.setTextColor(200, 200, 220);
        doc.text(cfg.subtitle, 14, 25);
      }
      if (cfg.showDate) {
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 190);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);
      }
    }

    autoTable(doc, {
      head: [["#", "Student", "Topic"]],
      body: entries.map(([s, t], i) => [i + 1, s, t]),
      startY: cfg.showHeader ? 44 : 14,
      theme: "grid",
      styles: { fontSize: cfg.fontSize, cellPadding: 5, valign: "middle", overflow: "linebreak" },
      headStyles: { fillColor: [rr, rg, rb], textColor: 255, fontStyle: "bold", halign: "center" },
      bodyStyles: { textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [245, 245, 252] },
      columnStyles: { 0: { cellWidth: 14, halign: "center" }, 1: { cellWidth: 58 }, 2: { cellWidth: "auto" } },
    });

    if (cfg.showFooter) {
      const pages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        const ph = doc.internal.pageSize.getHeight();
        doc.setFillColor(rr, rg, rb);
        doc.rect(0, ph - 12, pw, 12, "F");
        doc.setFontSize(8); doc.setTextColor(180, 180, 210);
        doc.text(cfg.footerText, 14, ph - 4);
        doc.text(`Page ${i}/${pages}`, pw - 14, ph - 4, { align: "right" });
      }
    }

    doc.save(`${cfg.fileName}.pdf`);
  }, [assignments, cfg]);

  const exportExcel = useCallback(() => {
    const entries = Object.entries(assignments);
    const wb = XLSX.utils.book_new();
    const wsData = [
      [cfg.title],
      ...(cfg.subtitle ? [[cfg.subtitle]] : []),
      ...(cfg.showDate ? [[`Generated: ${new Date().toLocaleDateString()}`]] : []),
      [],
      ["#", "Student Name", "Assigned Topic"],
      ...entries.map(([s, t], i) => [i + 1, s, t]),
    ].filter(r => r.length > 0);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 5 }, { wch: 28 }, { wch: 50 }];
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
    if (cfg.freezeHeader) ws["!freeze"] = { xSplit: 0, ySplit: 5 };
    XLSX.utils.book_append_sheet(wb, ws, cfg.sheetName || "Assignments");

    if (cfg.includeMetadata) {
      const meta = XLSX.utils.aoa_to_sheet([
        ["TopicForge Export Metadata"],
        ["Title", cfg.title],
        ["Generated", new Date().toLocaleString()],
        ["Total Students", entries.length],
        ["File", cfg.fileName],
      ]);
      XLSX.utils.book_append_sheet(wb, meta, "Metadata");
    }
    XLSX.writeFile(wb, `${cfg.fileName}.xlsx`);
  }, [assignments, cfg]);

  const exportPNG = useCallback(() => {
    const canvas = renderAssignmentsToPNG({
      assignments, cfg,
      theme: {
        bg:     currentTheme.bg,
        header: cfg.headerColor,
        accent: cfg.accentColor,
        text:   currentTheme.text,
        row1:   currentTheme.row1,
        row2:   currentTheme.row2,
      },
    });
    const link = document.createElement("a");
    link.download = `${cfg.fileName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [assignments, cfg, currentTheme]);

  const handleExport = async () => {
    setExporting(true);
    try {
      if (activeFormat === "pdf")   exportPDF();
      if (activeFormat === "excel") exportExcel();
      if (activeFormat === "png")   exportPNG();
      toast.success(`✅ ${fmt.label} exported successfully!`, { duration: 2500 });
      setTimeout(onClose, 400);
    } catch (e) {
      toast.error("Export failed: " + e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.div
      className="em-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="em-modal"
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="em-header">
          <div className="em-header-left">
            <div className="em-badge">
              <span className="em-badge-icon">↗</span>
            </div>
            <div>
              <div className="em-header-title">Export Assignments</div>
              <div className="em-header-sub">
                {Object.keys(assignments).length} students · choose format &amp; customize
              </div>
            </div>
          </div>
          <button className="em-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="em-body">
          {/* Format Picker */}
          <div className="em-format-grid">
            {FORMATS.map((f) => (
              <motion.button
                key={f.id}
                className={`em-format-card ${f.cls} ${activeFormat === f.id ? "em-format-card--active" : ""}`}
                onClick={() => setActiveFormat(f.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="em-fmt-icon">{f.icon}</span>
                <span className="em-fmt-label">{f.label}</span>
                <span className="em-fmt-desc">{f.desc}</span>
              </motion.button>
            ))}
          </div>

          {/* Two-column config */}
          <div className="em-config-area">

            {/* Left: Shared config */}
            <div className="em-config-col">
              <div className="em-section">
                <div className="em-section-title">Content</div>
                <FieldRow label="Title">
                  <input className="em-input" value={cfg.title} onChange={(e) => set("title", e.target.value)} placeholder="Report title" />
                </FieldRow>
                <FieldRow label="Subtitle">
                  <input className="em-input" value={cfg.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="e.g. CS-301 Final Presentations" />
                </FieldRow>
                <FieldRow label="File Name">
                  <input className="em-input" value={cfg.fileName} onChange={(e) => set("fileName", e.target.value)} placeholder="TopicForge_Export" />
                </FieldRow>
                <div className="em-toggles">
                  <Toggle checked={cfg.showHeader} onChange={(v) => set("showHeader", v)} label="Show header" />
                  <Toggle checked={cfg.showDate}   onChange={(v) => set("showDate",   v)} label="Include date" />
                  <Toggle checked={cfg.showFooter} onChange={(v) => set("showFooter", v)} label="Show footer" />
                </div>
                {cfg.showFooter && (
                  <FieldRow label="Footer Text">
                    <input className="em-input" value={cfg.footerText} onChange={(e) => set("footerText", e.target.value)} />
                  </FieldRow>
                )}
              </div>

              {/* Colors */}
              <div className="em-section">
                <div className="em-section-title">Colors &amp; Theme</div>
                <div className="em-theme-grid">
                  {THEMES.map((t) => (
                    <motion.button
                      key={t.id}
                      className={`em-theme-chip ${cfg.theme === t.id ? "em-theme-chip--active" : ""}`}
                      style={cfg.theme === t.id ? { borderColor: t.accent, background: t.accent + "18" } : {}}
                      onClick={() => {
                        set("theme", t.id);
                        set("headerColor", t.header);
                        set("accentColor", t.accent);
                      }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <span className="em-theme-dots">
                        <span className="em-theme-dot" style={{ background: t.header }} />
                        <span className="em-theme-dot" style={{ background: t.accent }} />
                        <span className="em-theme-dot em-theme-dot--bg" style={{ background: t.bg }} />
                      </span>
                      <span className="em-theme-name" style={cfg.theme === t.id ? { color: t.accent } : {}}>{t.label}</span>
                    </motion.button>
                  ))}
                </div>
                <div className="em-color-pickers">
                  <FieldRow label="Header">
                    <input type="color" className="em-color-input" value={cfg.headerColor} onChange={(e) => set("headerColor", e.target.value)} />
                  </FieldRow>
                  <FieldRow label="Accent">
                    <input type="color" className="em-color-input" value={cfg.accentColor} onChange={(e) => set("accentColor", e.target.value)} />
                  </FieldRow>
                </div>
              </div>
            </div>

            {/* Right: Format-specific + Preview */}
            <div className="em-config-col">
              <div className="em-section">
                <div className={`em-section-title em-section-title--fmt ${fmt.cls}`}>
                  {fmt.icon} {fmt.label} Options
                </div>

                {activeFormat === "pdf" && (
                  <div className="em-fmt-options">
                    <FieldRow label="Font">
                      <select className="em-input" value={cfg.font} onChange={(e) => set("font", e.target.value)}>
                        {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </FieldRow>
                    <div className="em-row-pair">
                      <FieldRow label="Page Size">
                        <select className="em-input" value={cfg.pageSize} onChange={(e) => set("pageSize", e.target.value)}>
                          {["a4","a3","letter","legal"].map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                      </FieldRow>
                      <FieldRow label="Orientation">
                        <select className="em-input" value={cfg.orientation} onChange={(e) => set("orientation", e.target.value)}>
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Landscape</option>
                        </select>
                      </FieldRow>
                    </div>
                    <FieldRow label={`Font Size: ${cfg.fontSize}px`}>
                      <input type="range" min={8} max={16} value={cfg.fontSize} onChange={(e) => set("fontSize", +e.target.value)} className="em-range fmt--pdf-accent" />
                    </FieldRow>
                    <FieldRow label={`Title Size: ${cfg.titleSize}px`}>
                      <input type="range" min={14} max={36} value={cfg.titleSize} onChange={(e) => set("titleSize", +e.target.value)} className="em-range fmt--pdf-accent" />
                    </FieldRow>
                  </div>
                )}

                {activeFormat === "excel" && (
                  <div className="em-fmt-options">
                    <FieldRow label="Sheet Name">
                      <input className="em-input" value={cfg.sheetName} onChange={(e) => set("sheetName", e.target.value)} />
                    </FieldRow>
                    <div className="em-toggles">
                      <Toggle checked={cfg.freezeHeader}    onChange={(v) => set("freezeHeader", v)}    label="Freeze header row" />
                      <Toggle checked={cfg.includeMetadata} onChange={(v) => set("includeMetadata", v)} label="Include metadata sheet" />
                    </div>
                  </div>
                )}

                {activeFormat === "png" && (
                  <div className="em-fmt-options">
                    <FieldRow label="Font">
                      <select className="em-input" value={cfg.font} onChange={(e) => set("font", e.target.value)}>
                        {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </FieldRow>
                    <FieldRow label={`Canvas Width: ${cfg.width}px`}>
                      <input type="range" min={600} max={1400} step={50} value={cfg.width} onChange={(e) => set("width", +e.target.value)} className="em-range fmt--png-accent" />
                    </FieldRow>
                    <FieldRow label={`Title Size: ${cfg.titleSize}px`}>
                      <input type="range" min={16} max={40} value={cfg.titleSize} onChange={(e) => set("titleSize", +e.target.value)} className="em-range fmt--png-accent" />
                    </FieldRow>
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="em-section">
                <div className="em-section-title">Preview</div>
                <div className="em-preview" style={{ background: currentTheme.bg, borderColor: "rgba(255,255,255,0.1)" }}>
                  {cfg.showHeader && (
                    <div className="em-preview-header" style={{ background: cfg.headerColor, borderBottomColor: cfg.accentColor }}>
                      <div className="em-preview-title">{cfg.title || "Title"}</div>
                      {cfg.subtitle && <div className="em-preview-subtitle">{cfg.subtitle}</div>}
                      {cfg.showDate && <div className="em-preview-date">{new Date().toLocaleDateString()}</div>}
                    </div>
                  )}
                  <div className="em-preview-rows">
                    {Object.entries(assignments).slice(0, 4).map(([s, t], i) => (
                      <div
                        key={s}
                        className="em-preview-row"
                        style={{
                          background: i % 2 === 0 ? currentTheme.row1 : currentTheme.row2,
                          borderLeftColor: cfg.accentColor,
                        }}
                      >
                        <span className="em-preview-num" style={{ color: cfg.accentColor }}>{i + 1}</span>
                        <span className="em-preview-student" style={{ color: currentTheme.text }}>{s}</span>
                        <span className="em-preview-topic"   style={{ color: currentTheme.text }}>{t}</span>
                      </div>
                    ))}
                    {Object.keys(assignments).length > 4 && (
                      <div className="em-preview-more">+ {Object.keys(assignments).length - 4} more rows…</div>
                    )}
                  </div>
                  {cfg.showFooter && (
                    <div className="em-preview-footer" style={{ background: cfg.headerColor }}>
                      <span className="em-preview-footer-text">{cfg.footerText}</span>
                      <span className="em-preview-footer-count">{Object.keys(assignments).length} students</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="em-footer">
          <button className="em-cancel-btn" onClick={onClose}>Cancel</button>
          <motion.button
            className={`em-export-btn ${fmt.cls}`}
            onClick={handleExport}
            disabled={exporting}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {exporting ? (
              <span className="em-exporting-text">Exporting…</span>
            ) : (
              <>
                <span>{fmt.icon}</span>
                <span>Export as {fmt.label}</span>
                <span className="em-ext">.{activeFormat === "excel" ? "xlsx" : activeFormat}</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════
   EXPORT BUTTON — opens modal directly
══════════════════════════════════════════════════════ */
export function ExportButton({ assignments }) {
  const [showModal, setShowModal] = useState(false);

  if (!assignments || Object.keys(assignments).length === 0) return null;

  return (
    <>
      <motion.button
        className="em-main-btn"
        onClick={() => setShowModal(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <span>↗</span>
        <span>Export</span>
      </motion.button>

      <AnimatePresence>
        {showModal && (
          <ExportModal
            assignments={assignments}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}