import React, { useState, useEffect, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { styles } from "../styles";

export const QuestionNode = ({ id, data }) => {
  const [hovered, setHovered] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showLinkPopup, setShowLinkPopup] = useState(false);

  const fileInputRef = useRef(null);
  const timeoutRef = useRef(null);
  const linkUrlRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const questionEditableRef = useRef(null);

  useEffect(() => {
    if (
      questionEditableRef.current &&
      questionEditableRef.current.innerHTML !== data.question
    ) {
      questionEditableRef.current.innerHTML = data.question || "";
    }
  }, [data.question]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHovered(false);
      setShowDropdown(false);
      setShowStyleMenu(false);
      setShowLinkPopup(false);
    }, 450);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (questionEditableRef.current) questionEditableRef.current.focus();
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  // FIX BUG 2 : Nettoyer la boucle si l'option sélectionnée est détruite
  const deleteOption = (idx) => {
    const updatedOptions = data.options.filter((_, i) => i !== idx);
    let updatedLoops = data.loopOptions
      ? [...data.loopOptions]
      : [false, false, false, false];

    const wasChecked = updatedLoops[idx];
    updatedLoops.splice(idx, 1);
    updatedLoops.push(false);

    data.onNodeChange(
      id,
      { ...data, options: updatedOptions, loopOptions: updatedLoops },
      true,
    );

    if (wasChecked && data.onToggleLoopEdge) {
      data.onToggleLoopEdge(id, -1);
    }
  };

  const addOption = () => {
    if (data.options.length < 4) {
      const updatedOptions = [...data.options, ""];
      const updatedLoops = data.loopOptions
        ? [...data.loopOptions]
        : [false, false, false, false];
      data.onNodeChange(
        id,
        { ...data, options: updatedOptions, loopOptions: updatedLoops },
        true,
      );
    }
  };

  const moveOption = (index, direction) => {
    const updatedOptions = [...data.options];
    const updatedLoops = data.loopOptions
      ? [...data.loopOptions]
      : [false, false, false, false];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < updatedOptions.length) {
      const tempOpt = updatedOptions[index];
      updatedOptions[index] = updatedOptions[targetIndex];
      updatedOptions[targetIndex] = tempOpt;

      const tempLoop = updatedLoops[index];
      updatedLoops[index] = updatedLoops[targetIndex];
      updatedLoops[targetIndex] = tempLoop;

      data.onNodeChange(
        id,
        { ...data, options: updatedOptions, loopOptions: updatedLoops },
        true,
      );
    }
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    const currentMedia = data.media || [];
    if (currentMedia.length + files.length > 8) {
      alert(
        "Limite atteinte: Vous pouvez ajouter jusqu'à 8 images maximum par bloc.",
      );
      return;
    }
    const newUrls = files.map((file) => URL.createObjectURL(file));
    data.onNodeChange(
      id,
      { ...data, media: [...currentMedia, ...newUrls] },
      true,
    );
  };

  const executeFormat = (command, value = null) => {
    restoreSelection();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(command, false, value);
    if (questionEditableRef.current) {
      data.onNodeChange(
        id,
        { ...data, question: questionEditableRef.current.innerHTML },
        true,
      );
    }
  };

  const insertCustomHyperlink = () => {
    restoreSelection();
    const url = linkUrlRef.current?.value || "https://";
    document.execCommand("createLink", false, url);
    if (questionEditableRef.current) {
      data.onNodeChange(
        id,
        { ...data, question: questionEditableRef.current.innerHTML },
        true,
      );
    }
    setShowLinkPopup(false);
  };

  const handleRadioClick = (idx, e) => {
    const isAlreadyChecked = !!data.loopOptions?.[idx];
    const updatedLoops = [false, false, false, false];

    if (isAlreadyChecked) {
      e.preventDefault();
      // FIX BUG 1 : Forcer l'extinction graphique complète du bouton radio
      data.onNodeChange(id, { ...data, loopOptions: updatedLoops }, false);
      if (data.onToggleLoopEdge) {
        data.onToggleLoopEdge(id, -1);
      }
    } else {
      updatedLoops[idx] = true;
      data.onNodeChange(id, { ...data, loopOptions: updatedLoops }, false);
      if (data.onToggleLoopEdge) {
        data.onToggleLoopEdge(id, idx);
      }
    }
  };

  return (
    <div
      style={styles.nodeWrapper}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#cbd5e1", width: "10px", height: "10px" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#cbd5e1", width: "10px", height: "10px" }}
      />

      <button
        style={styles.addChildBtn}
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          data.onAddChild(id);
        }}
      >
        +
      </button>

      {hovered && (
        <div style={styles.toolbar}>
          <button
            style={styles.toolbarBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Média
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handleMediaChange}
          />

          <button
            style={styles.toolbarBtn}
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => setShowLinkPopup(!showLinkPopup)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Hyperlien
          </button>

          <button
            style={styles.toolbarBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowStyleMenu(!showStyleMenu)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Style
          </button>

          {showLinkPopup && (
            <div
              style={styles.linkPopup}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <input
                ref={linkUrlRef}
                type="text"
                placeholder="https://..."
                style={styles.popupInput}
                defaultValue="https://"
              />
              <button
                style={{
                  ...styles.controlBtn,
                  padding: "6px 8px",
                  fontSize: "11px",
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  justifyContent: "center",
                }}
                onClick={insertCustomHyperlink}
              >
                Ajouter link
              </button>
            </div>
          )}

          {showStyleMenu && (
            <div style={styles.styleMenu}>
              <select
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => executeFormat("fontName", e.target.value)}
                style={{
                  fontSize: "12px",
                  padding: "4px",
                  borderRadius: "6px",
                }}
              >
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
              </select>
              <div style={{ display: "flex", gap: "6px" }}>
                {["#0f172a", "#2563eb", "#16a34a", "#dc2626"].map((color) => (
                  <div
                    key={color}
                    style={{ ...styles.colorBox, backgroundColor: color }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeFormat("foreColor", color);
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "center",
                }}
              >
                <button
                  style={{
                    ...styles.toolbarBtn,
                    color: "#0f172a",
                    fontWeight: "bold",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    executeFormat("bold");
                  }}
                >
                  B
                </button>
                <button
                  style={{
                    ...styles.toolbarBtn,
                    color: "#0f172a",
                    fontStyle: "italic",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    executeFormat("italic");
                  }}
                >
                  I
                </button>
                <button
                  style={{
                    ...styles.toolbarBtn,
                    color: "#0f172a",
                    textDecoration: "underline",
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    executeFormat("underline");
                  }}
                >
                  U
                </button>
              </div>
            </div>
          )}

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <button
              style={styles.toolbarBtn}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </button>
            {showDropdown && (
              <ul style={styles.dropdownMenu}>
                <li
                  style={styles.dropdownItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onAddChild(id);
                    setShowDropdown(false);
                  }}
                >
                  Ajouter un bloc enfant
                </li>
                <li
                  style={{ ...styles.dropdownItem, color: "#ef4444" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onTriggerDelete(id);
                    setShowDropdown(false);
                  }}
                >
                  Supprimer bloc
                </li>
              </ul>
            )}
          </div>
        </div>
      )}

      <div>
        <label style={styles.nodeLabel}>Question à poser</label>
        <div
          ref={questionEditableRef}
          contentEditable
          className="nodrag nowheel"
          style={styles.editableArea}
          placeholder="Entrez votre question ici..."
          onKeyDown={(e) => e.stopPropagation()}
          onSelect={saveSelection}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onPaste={(e) => {
            e.stopPropagation();
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain").trim();
            document.execCommand("insertText", false, text);
          }}
          onBlur={(e) =>
            data.onNodeChange(
              id,
              { ...data, question: e.target.innerHTML },
              true,
            )
          }
        />

        {data.media && data.media.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "6px",
              marginBottom: "12px",
            }}
          >
            {data.media.map((url, index) => (
              <div
                key={index}
                style={{
                  position: "relative",
                  width: "100%",
                  height: "55px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                }}
              >
                <img
                  src={url}
                  alt="Preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <button
                  style={{
                    position: "absolute",
                    top: "2px",
                    right: "2px",
                    backgroundColor: "rgba(15,23,42,0.75)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                    fontSize: "9px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={() => {
                    const filteredMedia = data.media.filter(
                      (_, i) => i !== index,
                    );
                    data.onNodeChange(
                      id,
                      { ...data, media: filteredMedia },
                      true,
                    );
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <label style={styles.nodeLabel}>Options</label>
        {data.options &&
          data.options.map((opt, idx) => (
            <div key={idx} style={styles.optionRow}>
              <span style={styles.dragHandle}>
                <button
                  style={styles.sortBtn}
                  onClick={() => moveOption(idx, -1)}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>
                <button
                  style={styles.sortBtn}
                  onClick={() => moveOption(idx, 1)}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </span>
              <input
                type="text"
                value={opt}
                placeholder="Entrez l'option..."
                style={styles.optionInput}
                onKeyDown={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const updatedOptions = [...data.options];
                  updatedOptions[idx] = e.target.value;
                  data.onNodeChange(
                    id,
                    { ...data, options: updatedOptions },
                    true,
                  );
                  if (data.onOptionTextChange)
                    data.onOptionTextChange(id, idx, e.target.value);
                }}
              />

              {id !== "node_root_primary" ? (
                <input
                  type="radio"
                  name={`loop_${id}`}
                  checked={!!data.loopOptions?.[idx]}
                  style={{
                    cursor: "pointer",
                    width: "16px",
                    height: "16px",
                    accentColor: "#6bb884",
                  }}
                  className="nodrag nowheel"
                  onClick={(e) => handleRadioClick(idx, e)}
                  onChange={() => {}}
                  title="Ligne supplémentaire (Boucle)"
                />
              ) : (
                <div style={{ width: "16px", height: "16px" }} />
              )}

              <button style={styles.iconBtn} onClick={() => deleteOption(idx)}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="19" />
                  <line x1="6" y1="6" x2="18" y2="19" />
                </svg>
              </button>
            </div>
          ))}

        {data.options && data.options.length < 4 && (
          <button style={styles.addOptionBtn} onClick={addOption}>
            + Ajouter Option
          </button>
        )}
      </div>
    </div>
  );
};
