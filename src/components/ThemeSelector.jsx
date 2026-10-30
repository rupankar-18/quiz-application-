import { useState, useRef, useEffect } from "react";

export const THEME_OPTIONS = [
  {
    key: "slate",
    name: "Slate Precision",
    mode: "Dark",
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    description: "Technical slate & sapphire accent"
  },
  {
    key: "obsidian",
    name: "Obsidian Minimal",
    mode: "Dark",
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1, #4f46e5)",
    description: "Deep stealth indigo & high contrast"
  },
  {
    key: "emerald",
    name: "Emerald Scholar",
    mode: "Dark",
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    description: "Academic jade & calming mint"
  },
  {
    key: "frost",
    name: "Nordic Clean",
    mode: "Light",
    color: "#2563eb",
    gradient: "linear-gradient(135deg, #2563eb, #38bdf8)",
    description: "Crisp white canvas & vivid cobalt"
  }
];

export default function ThemeSelector({ themeKey, setThemeKey, theme, align = "right" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const activeTheme = THEME_OPTIONS.find((t) => t.key === themeKey) || THEME_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (key) => {
    setThemeKey(key);
    setIsOpen(false);
  };

  return (
    <div className="stylish-theme-selector" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`stylish-theme-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Change theme, currently ${activeTheme.name}`}
      >
        <span
          className="theme-color-dot"
          style={{
            background: activeTheme.gradient,
            boxShadow: `0 0 10px ${activeTheme.color}88`
          }}
        />
        <span className="theme-trigger-label">
          <span className="theme-trigger-name">{activeTheme.name}</span>
          <span className="theme-trigger-mode-pill">{activeTheme.mode}</span>
        </span>
        <span className={`theme-chevron ${isOpen ? "rotated" : ""}`}>▾</span>
      </button>

      {/* Floating Glassmorphic Dropdown Menu */}
      {isOpen && (
        <div
          className={`stylish-theme-menu ${align === "left" ? "align-left" : "align-right"}`}
          role="listbox"
          aria-label="Available themes"
          style={{
            borderColor: theme?.border || "rgba(255, 255, 255, 0.14)"
          }}
        >
          <div className="theme-menu-header">
            <span className="theme-menu-title">Theme Palette</span>
            <span className="theme-menu-count">{THEME_OPTIONS.length} Presets</span>
          </div>

          <div className="theme-options-list">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = opt.key === themeKey;
              return (
                <button
                  type="button"
                  key={opt.key}
                  role="option"
                  aria-selected={isSelected}
                  className={`theme-option-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelect(opt.key)}
                >
                  <span
                    className="theme-swatch-circle"
                    style={{
                      background: opt.gradient,
                      boxShadow: isSelected ? `0 0 12px ${opt.color}` : "none"
                    }}
                  />
                  <div className="theme-option-info">
                    <div className="theme-option-name-row">
                      <strong className="theme-option-name">{opt.name}</strong>
                      <span className={`theme-mode-tag ${opt.mode.toLowerCase()}`}>
                        {opt.mode}
                      </span>
                    </div>
                    <small className="theme-option-desc">{opt.description}</small>
                  </div>
                  {isSelected && (
                    <span className="theme-check-icon" style={{ color: opt.color }}>
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
