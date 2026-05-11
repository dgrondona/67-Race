export default function ModeTabs({ value, onChange }) {
  return (
    <div className="mode-tabs" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={value === "private"}
        className={`mode-tab ${value === "private" ? "mode-tab-active" : ""}`}
        onClick={() => onChange("private")}
      >
        Private lobby
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "matchmaking"}
        className={`mode-tab ${value === "matchmaking" ? "mode-tab-active" : ""}`}
        onClick={() => onChange("matchmaking")}
      >
        Matchmaking
      </button>
    </div>
  );
}
