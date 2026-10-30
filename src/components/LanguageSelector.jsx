import { useState, useRef, useEffect } from "react";
import { LANGUAGES, getLanguage } from "../languages";
import { playSound } from "./audio";

export default function LanguageSelector({ language, setLanguage, theme, sound, align = "right" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const activeLang = language ? getLanguage(language) : null;

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

  const handleSelect = (code) => {
    playSound("click", sound);
    if (setLanguage) setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="stylish-language-selector" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`stylish-language-trigger ${isOpen ? "open" : ""} ${!language ? "unselected" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={activeLang ? `Selected language: ${activeLang.nativeName} (${activeLang.label})` : "Choose quiz language"}
        title="Change Assessment Language"
      >
        {activeLang ? (
          <>
            <span className="lang-trigger-flag">{activeLang.flag}</span>
            <span className="lang-trigger-label">
              <span className="lang-trigger-native">{activeLang.nativeName}</span>
              <span className="lang-trigger-code">{activeLang.code.toUpperCase()}</span>
            </span>
          </>
        ) : (
          <>
            <span className="lang-trigger-globe">🌐</span>
            <span className="lang-trigger-label">
              <span className="lang-trigger-native">Select Language</span>
              <span className="lang-trigger-req-dot" />
            </span>
          </>
        )}
        <span className={`lang-chevron ${isOpen ? "rotated" : ""}`}>▾</span>
      </button>

      {/* Floating Glassmorphic Language Menu */}
      {isOpen && (
        <div
          className={`stylish-language-menu ${align === "left" ? "align-left" : "align-right"}`}
          role="listbox"
          aria-label="Supported Quiz Languages"
          style={{
            borderColor: theme?.border || "rgba(255, 255, 255, 0.14)"
          }}
        >
          <div className="lang-menu-header">
            <span className="lang-menu-title">🌐 Assessment Language</span>
            <span className="lang-menu-count">{LANGUAGES.length} Available</span>
          </div>

          <div className="lang-options-grid">
            {LANGUAGES.map((item) => {
              const isSelected = language === item.code;
              return (
                <button
                  type="button"
                  key={item.code}
                  role="option"
                  aria-selected={isSelected}
                  className={`lang-option-card ${isSelected ? "selected" : ""}`}
                  style={isSelected ? { borderColor: theme?.accent, background: "rgba(255, 255, 255, 0.08)" } : {}}
                  onClick={() => handleSelect(item.code)}
                >
                  <span className="lang-card-flag">{item.flag}</span>
                  <div className="lang-card-info">
                    <div className="lang-card-name-row">
                      <strong className="lang-card-native">{item.nativeName}</strong>
                      {isSelected && (
                        <span className="lang-card-check" style={{ color: theme?.accent }}>
                          ✓
                        </span>
                      )}
                    </div>
                    <small className="lang-card-sub">
                      {item.label} · {item.region}
                    </small>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
